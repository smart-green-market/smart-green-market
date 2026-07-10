import os
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from datetime import datetime
from django.conf import settings
from django.db import connection, transaction
from django.utils import timezone
from django.db.models import Sum,F
from django.db.models.functions import TruncDate

# Import các Django Model thực tế từ hệ thống của bạn
from apps.dealer_products.models import DealerProduct, DealerInventoryBatch
from apps.orders.models import OrderItem, Order
from ..models import ProductPredictionResult       # Model vừa tạo ở Bước 1

class TrendAndDecisionRecommendationService:
    """
    MÔ HÌNH AI SỐ 3: DỰ ĐOÁN XU THẾ MUA HÀNG (LSTM) & GỢI Ý QUYẾT ĐỊNH KINH DOANH (DENSE)
    """
    def __init__(self, window_size=30, horizon=7, lstm_epochs=25, decision_epochs=40):
        # Siêu tham số cấu hình hệ thống
        self.window_size = window_size
        self.horizon = horizon
        self.lstm_epochs = lstm_epochs
        self.decision_epochs = decision_epochs
        self.lstm_batch_size = 64
        self.decision_batch_size = 32
        
        # Thư mục lưu trữ các file mô hình tĩnh tĩnh (.keras và metadata)
        self.base_output_dir = os.path.join(settings.BASE_DIR, 'apps', 'training_models', 'trend_decision_model')
        os.makedirs(self.base_output_dir, exist_ok=True)

        # Ngưỡng phân loại và nhãn nghiệp vụ
        self.trend_thresholds = {
            "tang_manh": 0.20, "tang_nhe": 0.05, "giam_nhe": -0.05, "giam_manh": -0.20
        }
        self.decision_classes = [
            "Nhập hàng gấp", "Nhập thêm hàng", "Duy trì", "Khuyến mãi đẩy hàng", "Giảm nhập / ngừng nhập"
        ]
        self.feature_names = [
            "growth_rate", "avg_daily_sales", "stock_days_left", 
            "days_to_nearest_expiry", "price_ratio", "is_custom_product"
        ]

    def train_models(self, dealer_id):
        """API 1: Chỉ tải dữ liệu và huấn luyện mô hình, sau đó lưu ra file."""
        dealer_dir = os.path.join(self.base_output_dir, f"dealer_{dealer_id}")
        os.makedirs(dealer_dir, exist_ok=True)
        
        trend_model_path = os.path.join(dealer_dir, "trend_lstm_model.keras")
        trend_meta_path = os.path.join(dealer_dir, "trend_model_meta.json")
        decision_model_path = os.path.join(dealer_dir, "decision_model.keras")
        decision_meta_path = os.path.join(dealer_dir, "decision_model_meta.json")

        # 1. Tải dữ liệu từ DB
        products_df, sales_series, inventory_snapshot = self._load_database_data(dealer_id)
        if sales_series is None or len(sales_series) == 0:
            return False, f"Không đủ dữ liệu lịch sử bán hàng của đại lý {dealer_id} để huấn luyện."

        # 2. Huấn luyện và lưu model Xu thế (LSTM)
        try:
            self._train_trend_model(sales_series, products_df, trend_model_path, trend_meta_path)
        except Exception as e:
            return False, f"Lỗi huấn luyện mô hình Xu thế: {e}"

        # 3. Huấn luyện và lưu model Quyết định
        try:
            self._train_decision_model(decision_model_path, decision_meta_path)
        except Exception as e:
            return False, f"Lỗi huấn luyện mô hình Quyết định: {e}"

        return True, f"Thành công: Đã huấn luyện xong mô hình AI cho đại lý {dealer_id}."


    def analyze_data(self, dealer_id):
        """API 2: Tải mô hình đã train từ file lên để dự đoán dữ liệu mới và ghi vào DB."""
        dealer_dir = os.path.join(self.base_output_dir, f"dealer_{dealer_id}")
        
        trend_model_path = os.path.join(dealer_dir, "trend_lstm_model.keras")
        trend_meta_path = os.path.join(dealer_dir, "trend_model_meta.json")
        decision_model_path = os.path.join(dealer_dir, "decision_model.keras")
        decision_meta_path = os.path.join(dealer_dir, "decision_model_meta.json")

        # 1. Kiểm tra mô hình đã tồn tại chưa
        if not os.path.exists(trend_model_path) or not os.path.exists(decision_model_path):
            return False, "Chưa có mô hình AI. Vui lòng gọi API Huấn luyện (Train) trước."

        try:
            # 2. Load Metadata
            with open(trend_meta_path, "r", encoding="utf-8") as f:
                trend_meta = json.load(f)
            with open(decision_meta_path, "r", encoding="utf-8") as f:
                decision_meta = json.load(f)

            # 3. Load Keras Models
            trend_model = tf.keras.models.load_model(trend_model_path)
            decision_model = tf.keras.models.load_model(decision_model_path)
        except Exception as e:
            return False, f"Lỗi khi tải mô hình từ ổ cứng: {e}"

        # 4. Tải dữ liệu thực tế tại thời điểm hiện tại
        products_df, sales_series, inventory_snapshot = self._load_database_data(dealer_id)

        # 5. Phân tích và ghi vào DB
        try:
            self._export_predictions_to_db(
                dealer_id, products_df, sales_series, inventory_snapshot, 
                trend_model, trend_meta, decision_model, decision_meta
            )
        except Exception as e:
            return False, f"Lỗi khi lưu kết quả vào Database: {e}"

        return True, "Thành công: Phân tích dữ liệu bằng model đã lưu và cập nhật DB."

    # =======================================================================
    # BƯỚC 1: TRUY VẤN CSDL (DJANGO ORM & PANDAS)
    # =======================================================================
    # =======================================================================
    # BƯỚC 1: TRUY VẤN CSDL (DJANGO ORM & PANDAS) - Fix FieldError
    # =======================================================================
    def _load_database_data(self, dealer_id):
        # 1. Lấy danh sách sản phẩm đại lý
        products = DealerProduct.objects.filter(
            dealer_profile_id=dealer_id, 
        ).annotate(
            # Trỏ trực tiếp vào trường 'title' của model DealerProduct
            product_name=F('title')
        ).values(
            'id', 
            'dealer_profile_id', 
            'supplier_product_id', 
            'retail_price',
            'product_name'  # Lấy trường đã được annotate
        )
        
        if not products.exists():
            return None, None, None
        
        products_df = pd.DataFrame(list(products))
        
        # Đổi tên các cột ID cho khớp với logic xử lý của AI
        products_df.rename(columns={
            'id': 'dealer_product_id',
            'dealer_profile_id': 'dealer_id',
        }, inplace=True)
        
        # Ép kiểu Decimal sang Float
        products_df['retail_price'] = products_df['retail_price'].astype(float)
        
        # Lấp đầy tên nếu có sản phẩm nào bị null title trong Database
        if 'product_name' in products_df.columns:
            products_df['product_name'] = products_df['product_name'].fillna("Sản phẩm chưa cập nhật tên")
        else:
            products_df['product_name'] = "Sản phẩm " + products_df['dealer_product_id'].astype(str)
        
        products_df['category'] = "Rau củ" 
        products_df['product_type'] = "standard"
        
        product_ids = products_df['dealer_product_id'].tolist()

        # 2. Truy vấn dữ liệu bán hàng từ bảng OrderItem
        # BỎ order__dealer_profile_id vì dealer_product_id__in đã bảo chứng dữ liệu của đúng Dealer
        sales_qs = OrderItem.objects.filter(
            dealer_product_id__in=product_ids         
        ).annotate(
            date=TruncDate('order__created_at')       
        ).values(
            'dealer_product_id', 'date'
        ).annotate(
            quantity_sold=Sum('quantity')             
        ).order_by('dealer_product_id', 'date')
        
        sales_df = pd.DataFrame(list(sales_qs))
        
        sales_series = {}
        if not sales_df.empty:
            sales_df['date'] = pd.to_datetime(sales_df['date'])
            for pid, g in sales_df.groupby("dealer_product_id"):
                g = g.set_index("date").asfreq("D")
                g["quantity_sold"] = g["quantity_sold"].fillna(0)
                sales_series[int(pid)] = g["quantity_sold"].values.astype(float)
        else:
            for pid in product_ids:
                sales_series[pid] = np.zeros(self.window_size)

        # 3. Lấy trạng thái Snapshot tồn kho thực tế 
        today = timezone.now().date()
        # BỎ luôn điều kiện lọc dealer_id ở đây để tránh lỗi FieldError tương tự ở bảng Batch
        inventory_qs = DealerInventoryBatch.objects.filter(
            dealer_product_id__in=product_ids,
            remaining_quantity__gt=0,
            expiry_date__gte=today
        ).values('dealer_product_id', 'remaining_quantity', 'expiry_date')
        
        inventory_df = pd.DataFrame(list(inventory_qs)) if inventory_qs.exists() else pd.DataFrame()

        inventory_snapshot = {}
        for pid in product_ids:
            if not inventory_df.empty and pid in inventory_df['dealer_product_id'].values:
                sub_inv = inventory_df[inventory_df['dealer_product_id'] == pid]
                remaining_total = int(sub_inv['remaining_quantity'].sum())
                sub_inv['expiry_date'] = pd.to_datetime(sub_inv['expiry_date']).dt.date
                days_to_expiry = [(edge - today).days for edge in sub_inv['expiry_date']]
                nearest_expiry = int(max(min(days_to_expiry), 0)) if days_to_expiry else 30
            else:
                remaining_total = 0
                nearest_expiry = 30 
            
            inventory_snapshot[pid] = {
                "remaining_stock": remaining_total, 
                "days_to_nearest_expiry": nearest_expiry
            }

        return products_df, sales_series, inventory_snapshot

    # =======================================================================
    # BƯỚC 2: HUẤN LUYỆN MÔ HÌNH XU THẾ (LSTM + EMBEDDING)
    # =======================================================================
    def _train_trend_model(self, sales_series, products_df, model_path, meta_path):
        # Xây dựng bản đồ ánh xạ chỉ mục (Index mapping)
        product_ids = sorted(list(sales_series.keys()))
        product_index = {int(pid): i for i, pid in enumerate(product_ids)}
        
        product_meta = {}
        for _, row in products_df.iterrows():
            if int(row['dealer_product_id']) in sales_series:
                product_meta[int(row['dealer_product_id'])] = {
                    "product_name": row['product_name'],
                    "category": row['category'],
                    "product_type": row['product_type']
                }

        categories = sorted(list({m["category"] for m in product_meta.values()}))
        category_index = {c: i for i, c in enumerate(categories)}

        # Trượt cửa sổ thời gian (Sliding Window) thu thập dữ liệu huấn luyện
        X_seq, X_prod, X_cat, Y = [], [], [], []
        stats_by_product = {}

        for pid, qty in sales_series.items():
            # Chuẩn hóa dữ liệu thủ công qua Log1p + MinMax
            log_qty = np.log1p(qty)
            q_min, q_max = float(log_qty.min()), float(log_qty.max())
            rng_val = max(q_max - q_min, 1e-6)
            norm = (log_qty - q_min) / rng_val
            stats_by_product[str(pid)] = {"log_min": q_min, "log_max": q_max}

            n = len(norm)
            if n < self.window_size + self.horizon:
                continue

            cat_id = category_index[product_meta[pid]["category"]]
            prod_id = product_index[pid]

            for start in range(0, n - self.window_size - self.horizon + 1):
                X_seq.append(norm[start:start + self.window_size])
                X_prod.append(prod_id)
                X_cat.append(cat_id)
                Y.append(norm[start + self.window_size: start + self.window_size + self.horizon])

        X_seq = np.array(X_seq, dtype=np.float32)[..., np.newaxis]
        X_prod = np.array(X_prod, dtype=np.int32)
        X_cat = np.array(X_cat, dtype=np.int32)
        Y = np.array(Y, dtype=np.float32)

        # Định hình cấu trúc mạng nơ-ron LSTM đa nhánh
        seq_input = tf.keras.layers.Input(shape=(self.window_size, 1), name="sales_sequence")
        x = tf.keras.layers.LSTM(64, return_sequences=True)(seq_input)
        x = tf.keras.layers.LSTM(32)(x)
        x = tf.keras.layers.Dropout(0.2)(x)

        prod_input = tf.keras.layers.Input(shape=(1,), name="product_id")
        p = tf.keras.layers.Embedding(input_dim=len(product_index) + 1, output_dim=8)(prod_input)
        p = tf.keras.layers.Flatten()(p)

        cat_input = tf.keras.layers.Input(shape=(1,), name="category_id")
        c = tf.keras.layers.Embedding(input_dim=len(category_index) + 1, output_dim=4)(cat_input)
        c = tf.keras.layers.Flatten()(c)

        merged = tf.keras.layers.Concatenate()([x, p, c])
        h = tf.keras.layers.Dense(64, activation="relu")(merged)
        h = tf.keras.layers.Dense(32, activation="relu")(h)
        output = tf.keras.layers.Dense(self.horizon, activation="sigmoid", name="future_quantity_norm")(h)

        model = tf.keras.Model(inputs=[seq_input, prod_input, cat_input], outputs=output)
        model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3), loss="mse")

        # Huấn luyện mô hình
        early_stop = tf.keras.callbacks.EarlyStopping(monitor="loss", patience=5, restore_best_weights=True)
        model.fit(
            {"sales_sequence": X_seq, "product_id": X_prod, "category_id": X_cat}, Y,
            epochs=self.lstm_epochs, batch_size=self.lstm_batch_size, callbacks=[early_stop], verbose=0
        )

        model.save(model_path)
        
        trend_meta = {
            "window_size": self.window_size, "horizon": self.horizon,
            "product_index": {str(k): v for k, v in product_index.items()},
            "category_index": category_index, "product_meta": {str(k): v for k, v in product_meta.items()},
            "stats_by_product": stats_by_product
        }
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(trend_meta, f, ensure_ascii=False, indent=2)

        return model, trend_meta

    # =======================================================================
    # BƯỚC 3: HUẤN LUYỆN MÔ HÌNH QUYẾT ĐỊNH (DENSE MULTI-CLASS)
    # =======================================================================
    def _train_decision_model(self, model_path, meta_path):
        # Bộ sinh nhãn nghiệp vụ (Rule-based simulator) kết hợp nhiễu
        def rule_based_label(growth_rate, stock_days_left, days_to_nearest_expiry, price_ratio):
            if growth_rate >= 0.20:
                return 0 if stock_days_left <= 3 else 1
            elif growth_rate >= 0.05:
                return 1 if stock_days_left <= 3 else 2
            elif growth_rate <= -0.20:
                return 4 if (stock_days_left >= 14 or days_to_nearest_expiry <= 2) else 3
            elif growth_rate <= -0.05:
                return 3 if (days_to_nearest_expiry <= 2 or stock_days_left >= 14 or price_ratio >= 1.15) else 2
            else:
                return 3 if days_to_nearest_expiry <= 2 else 2

        # Khởi tạo ma trận dữ liệu tổng hợp
        np_rng = np.random.default_rng(42)
        n_samples = 5000
        growth_rate = np_rng.uniform(-0.6, 0.6, n_samples)
        avg_daily_sales = np_rng.uniform(2, 120, n_samples)
        stock_days_left = np_rng.uniform(0, 30, n_samples)
        days_to_nearest_expiry = np_rng.uniform(0, 15, n_samples)
        price_ratio = np_rng.uniform(0.7, 1.4, n_samples)
        is_custom_product = np_rng.integers(0, 2, n_samples).astype(float)

        labels = np.array([
            rule_based_label(g, s, e, p) 
            for g, s, e, p in zip(growth_rate, stock_days_left, days_to_nearest_expiry, price_ratio)
        ])
        
        # Tiêm 4% độ nhiễu thực tế
        flip_mask = np_rng.random(n_samples) < 0.04
        labels[flip_mask] = np_rng.integers(0, len(self.decision_classes), flip_mask.sum())

        X = np.stack([growth_rate, avg_daily_sales, stock_days_left, days_to_nearest_expiry, price_ratio, is_custom_product], axis=1)
        
        # Tính toán tham số chuẩn hóa
        stats = {"mean": X.mean(axis=0).tolist(), "std": (X.std(axis=0) + 1e-6).tolist()}
        X_norm = (X - np.array(stats["mean"])) / np.array(stats["std"])

        # Mạng nơ-ron phân loại quyết định kinh doanh
        inputs = tf.keras.layers.Input(shape=(len(self.feature_names),))
        x = tf.keras.layers.Dense(64, activation="relu")(inputs)
        x = tf.keras.layers.Dropout(0.15)(x)
        x = tf.keras.layers.Dense(32, activation="relu")(x)
        outputs = tf.keras.layers.Dense(len(self.decision_classes), activation="softmax")(x)

        model = tf.keras.Model(inputs=inputs, outputs=outputs)
        model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3), loss="sparse_categorical_crossentropy")
        
        model.fit(X_norm, labels, epochs=self.decision_epochs, batch_size=self.decision_batch_size, verbose=0)
        model.save(model_path)

        decision_meta = {"feature_names": self.feature_names, "classes": self.decision_classes, "stats": stats}
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(decision_meta, f, ensure_ascii=False, indent=2)

        return model, decision_meta

    # =======================================================================
    # BƯỚC 4: SUY LUẬN (INFERENCE) & LƯU TRỮ VÀO DATABASE
    # =======================================================================
    def _export_predictions_to_db(self, dealer_id, products_df, sales_series, inventory_snapshot, 
                                  trend_model, trend_meta, decision_model, decision_meta):
        current_time = timezone.now()
        prediction_records = []

        # Nạp lại cấu trúc chỉ mục từ siêu dữ liệu mô hình xu thế
        p_idx_map = {int(k): v for k, v in trend_meta["product_index"].items()}
        c_idx_map = trend_meta["category_index"]
        stats_by_product = trend_meta["stats_by_product"]

        for _, row in products_df.iterrows():
            pid = int(row['dealer_product_id'])
            pid_str = str(pid)
            
            # Bỏ qua nếu sản phẩm không có hoặc không đủ lịch sử bán hàng để trượt cửa sổ
            if pid_str not in stats_by_product or len(sales_series[pid]) < self.window_size:
                continue

            qty = sales_series[pid]
            stats = stats_by_product[pid_str]

            # Dự đoán xu thế tương lai thông qua LSTM
            log_qty = np.log1p(qty)
            norm_qty = (log_qty - stats["log_min"]) / max(stats["log_max"] - stats["log_min"], 1e-6)
            last_window = norm_qty[-self.window_size:].reshape(1, self.window_size, 1)

            pred_in_prod = np.array([[p_idx_map[pid]]])
            pred_in_cat = np.array([[c_idx_map[row['category']]]])

            pred_norm = trend_model.predict(
                {"sales_sequence": last_window, "product_id": pred_in_prod, "category_id": pred_in_cat}, verbose=0
            )[0]
            
            # Đảo ngược chuẩn hóa đưa về sản lượng thực tế (Inverse-transform)
            pred_qty = np.expm1(pred_norm * max(stats["log_max"] - stats["log_min"], 1e-6) + stats["log_min"])
            pred_qty = [round(float(v), 1) for v in pred_qty]

            # Phân loại nhãn xu thế tăng/giảm trưởng
            recent_mean = max(qty[-self.window_size:].mean(), 1e-6)
            growth_rate = float((np.mean(pred_qty) - recent_mean) / recent_mean)

            trend_label = "on_dinh"
            for label, threshold in self.trend_thresholds.items():
                if "tang" in label and growth_rate >= threshold:
                    trend_label = label
                elif "giam" in label and growth_rate <= threshold:
                    trend_label = label

            # Tính toán vector đặc trưng đầu vào cho mô hình quyết định
            inv = inventory_snapshot[pid]
            same_cat_prices = products_df[products_df["category"] == row["category"]]["retail_price"]
            avg_cat_price = same_cat_prices.mean() if not same_cat_prices.empty else row['retail_price']
            price_ratio = float(row['retail_price'] / avg_cat_price) if avg_cat_price else 1.0
            
            stock_days_left = float(inv["remaining_stock"] / recent_mean)

            feat_dict = {
                "growth_rate": growth_rate, "avg_daily_sales": recent_mean,
                "stock_days_left": min(stock_days_left, 60.0),
                "days_to_nearest_expiry": float(inv["days_to_nearest_expiry"]),
                "price_ratio": price_ratio, "is_custom_product": 1.0 if row["product_type"] == "custom" else 0.0
            }

            x_feat = np.array([[feat_dict[name] for name in self.feature_names]], dtype=np.float32)
            
            # Chuẩn hóa vector đặc trưng quyết định
            dec_stats = decision_meta["stats"]
            x_feat_norm = (x_feat - np.array(dec_stats["mean"])) / np.array(dec_stats["std"])

            # Dự đoán xác suất phân lớp quyết định
            probs = decision_model.predict(x_feat_norm, verbose=0)[0]
            best_class_idx = int(np.argmax(probs))
            
            all_prob_dict = {self.decision_classes[i]: round(float(p), 3) for i, p in enumerate(probs)}

            # Khởi tạo object dữ liệu kết quả dự đoán
            prediction_records.append(ProductPredictionResult(
                dealer_id=dealer_id,
                dealer_product_id=pid,
                product_name=row['product_name'],
                category=row['category'],
                recent_avg_daily_sales=round(recent_mean, 2),
                growth_rate=round(growth_rate, 4),
                trend_label=trend_label,
                forecast_next_days=pred_qty,
                stock_days_left=round(stock_days_left, 1),
                days_to_nearest_expiry=inv["days_to_nearest_expiry"],
                decision=self.decision_classes[best_class_idx],
                decision_confidence=round(float(probs[best_class_idx]), 3),
                all_probabilities=all_prob_dict,
                updated_at=current_time
            ))

        # Lưu xuống CSDL thông qua Atomic Transaction để tối ưu hiệu năng
        if prediction_records:
            with transaction.atomic():
                # Xóa toàn bộ bản ghi dự báo cũ của Dealer này để nạp dữ liệu hoàn toàn mới
                ProductPredictionResult.objects.filter(dealer_id=dealer_id).delete()
                # Bulk tạo mới hàng loạt
                ProductPredictionResult.objects.bulk_create(prediction_records)