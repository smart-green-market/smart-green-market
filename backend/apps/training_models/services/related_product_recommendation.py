import os
import json
import numpy as np
import tensorflow as tf
from collections import defaultdict
from django.conf import settings
from django.db import connection, transaction
from tensorflow.keras.preprocessing.sequence import skipgrams

from apps.orders.models import OrderItem
from apps.dealer_products.models import DealerProduct
class RelatedProductRecommendationService:
    """
    MÔ HÌNH AI SỐ 2: GỢI Ý SẢN PHẨM MUA KÈM (ITEM2VEC)
    """
    def __init__(self, embedding_dim=16, epochs=100, batch_size=128, window_size=12, top_k=7):
        self.embedding_dim = embedding_dim
        self.epochs = epochs
        self.batch_size = batch_size
        self.window_size = window_size
        self.top_k = top_k
        self.output_dir = os.path.join(settings.BASE_DIR, 'apps', 'training_models', 'recommendation_model')
        
        # Đảm bảo thư mục luôn tồn tại
        os.makedirs(self.output_dir, exist_ok=True)

    def train_pipeline(self):
        # 1. Tải và tiền xử lý dữ liệu
        sentences, unique_items = self._load_data()
        if not sentences:
            return False, "Không đủ dữ liệu đơn hàng để huấn luyện."
        target_items, context_items, labels, vocab_size, item2idx, idx2item = self._prepare_data(sentences, unique_items)
        
        # 2. Train model (Cần sửa hàm _train_model trả về thêm lịch sử 'history' để lấy loss)
        model, embeddings, history = self._train_model(target_items, context_items, labels, vocab_size, item2idx)
        
        # 3. Tính toán độ phủ danh mục (Coverage)
        metrics = self._evaluate_metrics(embeddings, idx2item, top_k=self.top_k)
        
        # 4. Lấy Loss cuối cùng và Epochs thực tế
        final_loss = history.history['loss'][-1]
        epochs_run = len(history.history['loss'])
        
        # 5. LƯU LỊCH SỬ VÀO DATABASE
        from apps.training_models.models import AITrainingHistory # Nhớ import
        AITrainingHistory.objects.create(
            model_name="Item2Vec",
            epochs_run=epochs_run,
            final_loss=final_loss,
            catalog_coverage=metrics["catalog_coverage"],
            total_items_trained=metrics["total_items"],
            status="SUCCESS"
        )
        
        # 6. Lưu file tĩnh & Đồng bộ DB
        self._save_static_files(model, idx2item)
        self._export_to_db(embeddings, idx2item)

        return True, f"Huấn luyện thành công. Độ phủ danh mục: {metrics['catalog_coverage']}%. Data đã lưu lịch sử."

    def inference_pipeline_only(self):
        """
        LUỒNG 2 (ONLINE INFERENCE / QUICK EXPORT):
        Dùng để tái tạo lại danh sách gợi ý trong Database từ file .keras đã lưu mà KHÔNG CẦN TRAIN LẠI.
        """
        # 1. Nạp thẳng model tĩnh và từ điển đã lưu
        model = self._load_existing_model()
        idx2item = self._load_existing_vocab()

        if model is None or idx2item is None:
            return False, "Lỗi: Không tìm thấy file .keras hoặc tf_vocab.json. Vui lòng chạy luồng Huấn luyện (Train) trước!"

        try:
            # 2. Rút trích ma trận trọng số (Embeddings) ngay lập tức
            embeddings = model.get_layer("target_emb").get_weights()[0]

            # 3. Tính Cosine và ghi thẳng xuống Database
            self._export_to_db(embeddings, idx2item)
            
            return True, "Thành công: Đã CẬP NHẬT DATABASE từ file .keras tĩnh (Không huấn luyện)."
        except Exception as e:
            return False, f"Lỗi trong quá trình suy luận: {str(e)}"
        
    def _load_data(self):
        order_sequences = defaultdict(list)
        items = OrderItem.objects.values_list('order_id', 'dealer_product_id')
        
        for order_id, product_id in items:
            if order_id and product_id:
                order_sequences[order_id].append(str(product_id))

        sentences = [sorted(list(set(seq))) for seq in order_sequences.values() if len(set(seq)) > 1]
        unique_items = sorted(list(set([item for seq in sentences for item in seq])))
        
        return sentences, unique_items

    def _prepare_data(self, sentences, unique_items):
        item2idx = {item: idx + 1 for idx, item in enumerate(unique_items)}
        idx2item = {idx + 1: item for idx, item in enumerate(unique_items)}
        vocab_size = len(unique_items) + 1

        target_items, context_items, labels = [], [], []
        for seq in sentences:
            indexed_seq = [item2idx[item] for item in seq]
            pairs, pair_labels = skipgrams(
                indexed_seq, 
                vocabulary_size=vocab_size, 
                window_size=self.window_size, 
                negative_samples=4, 
                seed=42
            )
            for pair, label in zip(pairs, pair_labels):
                target_items.append(pair[0])
                context_items.append(pair[1])
                labels.append(label)
                
        return target_items, context_items, labels, vocab_size, item2idx, idx2item

    def _train_model(self, target_items, context_items, labels, vocab_size, item2idx):
        early_stop = tf.keras.callbacks.EarlyStopping(
            monitor='loss', min_delta=0.001, patience=5, 
            verbose=1, mode='min', restore_best_weights=True
        )
        
        # Xây dựng cấu trúc mô hình
        target_input = tf.keras.layers.Input(shape=(1,), name="target")
        context_input = tf.keras.layers.Input(shape=(1,), name="context")
        
        target_embedding = tf.keras.layers.Embedding(input_dim=vocab_size, output_dim=self.embedding_dim, name="target_emb")(target_input)
        context_embedding = tf.keras.layers.Embedding(input_dim=vocab_size, output_dim=self.embedding_dim, name="context_emb")(context_input)
        
        dots = tf.keras.layers.Dot(axes=2)([target_embedding, context_embedding])
        output = tf.keras.layers.Dense(1, activation='sigmoid')(tf.keras.layers.Flatten()(dots))
        
        model = tf.keras.Model(inputs=[target_input, context_input], outputs=output)

        # --- LOGIC HỌC NỐI TIẾP (TRANSFER WEIGHTS) ---
        old_model = self._load_existing_model()
        old_vocab = self._load_existing_vocab()

        if old_model is not None and old_vocab is not None:
            try:
                # Lấy ma trận trọng số cũ và mới
                old_target_weights = old_model.get_layer("target_emb").get_weights()[0]
                old_context_weights = old_model.get_layer("context_emb").get_weights()[0]

                new_target_weights = model.get_layer("target_emb").get_weights()[0]
                new_context_weights = model.get_layer("context_emb").get_weights()[0]
                # Ánh xạ lại trọng số cho những sản phẩm đã tồn tại trong model cũ
                for old_str_idx, product_id in old_vocab.items():
                    old_idx = int(old_str_idx)
                    # Nếu sản phẩm cũ vẫn tồn tại trong đợt train này
                    if product_id in item2idx:
                        new_idx = item2idx[product_id]
                        # Đảm bảo index hợp lệ
                        if old_idx < len(old_target_weights) and new_idx < len(new_target_weights):
                            new_target_weights[new_idx] = old_target_weights[old_idx]
                            new_context_weights[new_idx] = old_context_weights[old_idx]
                # Cập nhật trọng số vào model mới
                model.get_layer("target_emb").set_weights([new_target_weights])
                model.get_layer("context_emb").set_weights([new_context_weights])
                print("Đã tải và kế thừa thành công trọng số từ mô hình cũ (Học nối tiếp).")
            except Exception as e:
                print(f"Cảnh báo: Không thể nạp trọng số cũ, mô hình sẽ học lại từ đầu. Lỗi: {e}")
        # ---------------------------------------------

        model.compile(optimizer='adam', loss='binary_crossentropy')
        
        history = model.fit(
            x=[np.array(target_items), np.array(context_items)], 
            y=np.array(labels), 
            epochs=self.epochs, 
            batch_size=self.batch_size,
            callbacks=[early_stop],
            verbose=0 # Tắt log dài dòng khi chạy trên API
        )
        
        # Trả về cả object model (để lưu) và ma trận trọng số (để tính toán)
        embeddings = model.get_layer("target_emb").get_weights()[0]
        return model, embeddings, history
    
    def _evaluate_metrics(self, embeddings, idx2item, top_k=7):
        """
        Tính toán các chỉ số đánh giá mô hình (Catalog Coverage).
        """
        from apps.dealer_products.models import DealerProduct
        
        norms_all = np.linalg.norm(embeddings, axis=1)
        norms_all[norms_all == 0] = 1e-10 
        
        idx2item_clean = {int(k): v for k, v in idx2item.items()}
        product_to_dealer = dict(DealerProduct.objects.values_list('id', 'dealer_profile_id'))
        
        total_valid_items = len(idx2item_clean)
        unique_recommended_items = set()

        # Quét qua toàn bộ sản phẩm để giả lập lấy gợi ý
        for idx, product_id in idx2item_clean.items():
            target_pid = int(product_id)
            target_dealer_id = product_to_dealer.get(target_pid)
            
            if not target_dealer_id:
                continue
                
            target_vector = embeddings[idx]
            dot_products = np.dot(embeddings, target_vector)
            norm_target = np.linalg.norm(target_vector)
            similarities = dot_products / (norms_all * norm_target)
            
            best_indices = similarities.argsort()[::-1]
            
            recommendations = []
            for best_idx in best_indices:
                best_idx_int = int(best_idx)
                if best_idx_int != 0 and best_idx_int != idx and best_idx_int in idx2item_clean:
                    candidate_pid = int(idx2item_clean[best_idx_int])
                    candidate_dealer_id = product_to_dealer.get(candidate_pid)
                    
                    if candidate_dealer_id == target_dealer_id:
                        recommendations.append(candidate_pid)
                        unique_recommended_items.add(candidate_pid) # Lưu vết sản phẩm được gợi ý
                        
                if len(recommendations) == top_k:
                    break
        
        # Tính toán tỷ lệ phần trăm Coverage
        coverage_percentage = (len(unique_recommended_items) / total_valid_items) * 100 if total_valid_items > 0 else 0
        
        metrics = {
            "total_items": total_valid_items,
            "items_recommended": len(unique_recommended_items),
            "catalog_coverage": round(coverage_percentage, 2)
        }
        
        return metrics

    def _save_static_files(self, model, idx2item):
        model.save(os.path.join(self.output_dir, 'full_model.keras'))
        with open(os.path.join(self.output_dir, 'tf_vocab.json'), 'w') as f:
            json.dump(idx2item, f)

    def _load_existing_model(self):
        # Kiểm tra xem đã có model cũ chưa
        model_path = os.path.join(self.output_dir, 'full_model.keras')
        if os.path.exists(model_path):
            return tf.keras.models.load_model(model_path)
        return None
        
    def _load_existing_vocab(self):
        # Đọc file vocab cũ để biết index sản phẩm cũ nằm ở đâu
        vocab_path = os.path.join(self.output_dir, 'tf_vocab.json')
        if os.path.exists(vocab_path):
            with open(vocab_path, 'r') as f:
                return json.load(f)
        return None
    
    def _export_to_db(self, embeddings, idx2item):
        from django.utils import timezone 
        
        norms_all = np.linalg.norm(embeddings, axis=1)
        norms_all[norms_all == 0] = 1e-10 
        
        TABLE_NAME = "dealer_product_related_recommendations"
        current_time = timezone.now()

        idx2item_clean = {int(k): v for k, v in idx2item.items()}
        product_to_dealer = dict(DealerProduct.objects.values_list('id', 'dealer_profile_id'))

        # Thực hiện toàn bộ tiến trình trong một Transaction để đảm bảo tính toàn vẹn dữ liệu
        with transaction.atomic(), connection.cursor() as cursor:
            for idx, product_id in idx2item_clean.items():
                target_pid = int(product_id)
                
                target_dealer_id = product_to_dealer.get(target_pid)
                if not target_dealer_id:
                    continue
                target_vector = embeddings[idx]

                dot_products = np.dot(embeddings, target_vector)
                norm_target = np.linalg.norm(target_vector)
                similarities = dot_products / (norms_all * norm_target)
                
                best_indices = similarities.argsort()[::-1]

                recommendations = []
                for best_idx in best_indices:
                    best_idx_int = int(best_idx)
                    
                    if best_idx_int != 0 and best_idx_int != idx:
                        if best_idx_int in idx2item_clean:
                            candidate_pid = int(idx2item_clean[best_idx_int])
                            candidate_dealer_id = product_to_dealer.get(candidate_pid)
                            
                            if candidate_dealer_id == target_dealer_id:
                                recommendations.append(candidate_pid)

                    if len(recommendations) == self.top_k:
                        break
                
                # --- LOGIC LƯU VÀO DATABASE ---
                # Bước 1: Thử cập nhật bản ghi đã tồn tại (Giữ nguyên cột 'id' PK)
                cursor.execute(
                    f"""
                    UPDATE "{TABLE_NAME}" 
                    SET related_product_ids = %s, updated_at = %s
                    WHERE dealer_product_id = %s
                    """, 
                    [recommendations, current_time, target_pid]
                )
                
                # Bước 2: Kiểm tra số dòng bị ảnh hưởng. 
                # Nếu rowcount == 0, nghĩa là sản phẩm này chưa có trong DB -> Tiến hành thêm mới
                if cursor.rowcount == 0:
                    cursor.execute(
                        f"""
                        INSERT INTO "{TABLE_NAME}" (dealer_product_id, related_product_ids, updated_at)
                        VALUES (%s, %s, %s)
                        """,
                        [int(product_id), recommendations, current_time]
                    )