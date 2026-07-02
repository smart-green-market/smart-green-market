import os
import json
import numpy as np
import tensorflow as tf
from collections import defaultdict
from django.conf import settings
from django.db import connection, transaction
from tensorflow.keras.preprocessing.sequence import skipgrams

from apps.orders.models import OrderItem

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

    def execute_pipeline(self):
        """Hàm thực thi toàn bộ quy trình, gọi từ API View"""
        # 1. Tải dữ liệu từ DB
        sentences, unique_items = self._load_data()
        if not sentences:
            return False, "Không đủ dữ liệu đơn hàng để huấn luyện."

        # 2. Chuẩn bị dữ liệu học (Skip-gram)
        target_items, context_items, labels, vocab_size, item2idx, idx2item = self._prepare_data(sentences, unique_items)

        # 3. Huấn luyện mạng Nơ-ron TensorFlow (Có kèm học nối tiếp)
        model, embeddings = self._train_model(target_items, context_items, labels, vocab_size, item2idx)

        # 4. Xuất model và ma trận ra file tĩnh
        self._save_static_files(model, idx2item)

        # 5. Dùng ma trận vừa Train để tính toán và lưu thẳng vào Database
        self._export_to_db(embeddings, idx2item)

        return True, "Thành công: Đã huấn luyện mô hình và cập nhật danh sách gợi ý."

    def _load_data(self):
        order_sequences = defaultdict(list)
        items = OrderItem.objects.values_list('order_id', 'dealer_product_id')
        
        for order_id, product_id in items:
            if order_id and product_id:
                order_sequences[order_id].append(str(product_id))

        sentences = [seq for seq in order_sequences.values() if len(seq) > 1]
        unique_items = list(set([item for seq in sentences for item in seq]))
        
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
                new_target_weights = model.get_layer("target_emb").get_weights()[0]
                
                # Ánh xạ lại trọng số cho những sản phẩm đã tồn tại trong model cũ
                for old_str_idx, product_id in old_vocab.items():
                    old_idx = int(old_str_idx)
                    # Nếu sản phẩm cũ vẫn tồn tại trong đợt train này
                    if product_id in item2idx:
                        new_idx = item2idx[product_id]
                        # Đảm bảo index hợp lệ
                        if old_idx < len(old_target_weights) and new_idx < len(new_target_weights):
                            new_target_weights[new_idx] = old_target_weights[old_idx]
                
                # Cập nhật trọng số vào model mới
                model.get_layer("target_emb").set_weights([new_target_weights])
                print("Đã tải và kế thừa thành công trọng số từ mô hình cũ (Học nối tiếp).")
            except Exception as e:
                print(f"Cảnh báo: Không thể nạp trọng số cũ, mô hình sẽ học lại từ đầu. Lỗi: {e}")
        # ---------------------------------------------

        model.compile(optimizer='adam', loss='binary_crossentropy')
        
        model.fit(
            x=[np.array(target_items), np.array(context_items)], 
            y=np.array(labels), 
            epochs=self.epochs, 
            batch_size=self.batch_size,
            callbacks=[early_stop],
            verbose=0 # Tắt log dài dòng khi chạy trên API
        )
        
        # Trả về cả object model (để lưu) và ma trận trọng số (để tính toán)
        return model, model.get_layer("target_emb").get_weights()[0]

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
        from django.utils import timezone # Import để lấy thời gian đúng múi giờ cấu hình
        
        norms_all = np.linalg.norm(embeddings, axis=1)
        norms_all[norms_all == 0] = 1e-10 
        
        TABLE_NAME = "dealer_product_related_recommendations"
        current_time = timezone.now()

        idx2item_clean = {int(k): v for k, v in idx2item.items()}

        # Thực hiện toàn bộ tiến trình trong một Transaction để đảm bảo tính toàn vẹn dữ liệu
        with transaction.atomic(), connection.cursor() as cursor:
            for idx, product_id in idx2item_clean.items():
                target_vector = embeddings[idx]
                
                dot_products = np.dot(embeddings, target_vector)
                norm_target = np.linalg.norm(target_vector)
                similarities = dot_products / (norms_all * norm_target)
                
                best_indices = similarities.argsort()[-(self.top_k + 1):][::-1]
                
                recommendations = []
                for best_idx in best_indices:
                    best_idx_int = int(best_idx)
                    
                    # Bỏ qua index 0 (padding) và chính sản phẩm đang xét
                    if best_idx_int != 0 and best_idx_int != idx:
                        if best_idx_int in idx2item_clean:
                            recommendations.append(int(idx2item_clean[best_idx_int]))
                            
                    if len(recommendations) == self.top_k:
                        break
                
                # --- LOGIC LƯU VÀO DATABASE ---
                # Bước 1: Xóa gợi ý cũ của sản phẩm này để tránh trùng lặp dữ liệu
                cursor.execute(
                    f'DELETE FROM "{TABLE_NAME}" WHERE dealer_product_id = %s', 
                    [int(product_id)]
                )
                
                # Bước 2: Chèn dữ liệu mới
                cursor.execute(
                    f"""
                    INSERT INTO "{TABLE_NAME}" (dealer_product_id, related_product_ids, updated_at)
                    VALUES (%s, %s, %s)
                    """,
                    [int(product_id), recommendations, current_time]
                )