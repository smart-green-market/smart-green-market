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

        # 2. Train model
        model, embeddings, history = self._train_model(target_items, context_items, labels, vocab_size, item2idx)

        # 3. Tính toán coverage (tổng thể + từng dealer)
        metrics = self._evaluate_metrics(embeddings, idx2item, top_k=self.top_k)

        # 4. Lấy Loss history và Epochs thực tế
        loss_history = [round(float(v), 6) for v in history.history['loss']]
        final_loss = loss_history[-1]
        epochs_run = len(loss_history)

        # 5. LƯU LỊCH SỬ VÀO DATABASE
        from apps.training_models.models import AITrainingHistory
        AITrainingHistory.objects.create(
            model_name="Item2Vec",
            epochs_run=epochs_run,
            final_loss=final_loss,
            catalog_coverage=metrics['catalog_coverage'],
            total_items_trained=metrics['total_items'],
            status='SUCCESS',
            loss_history=loss_history,
            dealer_coverage_detail=metrics['dealer_coverage_detail'],
        )

        # 6. Lưu file tĩnh & Đồng bộ DB
        self._save_static_files(model, idx2item)
        self._export_to_db(embeddings, idx2item)

        # 7. Gửi cảnh báo cho Admin nếu có dealer thiếu gợi ý
        self._notify_admins_if_needed(metrics['dealer_coverage_detail'])

        return True, f"Hoàn tất phân tích dữ liệu. Hệ thống AI đã hỗ trợ gợi ý cho {metrics['catalog_coverage']}% danh mục sản phẩm. Kết quả đã được lưu trữ."

    def _notify_admins_if_needed(self, dealer_coverage_detail):
        """Gửi thông báo cảnh báo cho Admin nếu phát hiện Dealer có sản phẩm thiếu gợi ý."""
        warning_dealers = [d for d in dealer_coverage_detail if d['coverage_pct'] < 100]
        if not warning_dealers:
            return

        from common.notifications import notify_admins

        lines = []
        for d in warning_dealers:
            lines.append(
                f"- Cửa hàng \"{d['dealer_name']}\": "
                f"Thiếu {d['missing_count']}/{d['total_products']} sản phẩm chưa được AI đề xuất bán kèm hiệu quả (Độ bao phủ: {d['coverage_pct']}%)"
            )
        detail_text = '\n'.join(lines)

        notify_admins(
            title=f"Báo cáo: {len(warning_dealers)} cửa hàng cần bổ sung thêm dữ liệu bán hàng",
            content=(
                f"Quá trình phân tích hành vi mua sắm vừa hoàn tất. "
                f"Tuy nhiên, hệ thống ghi nhận {len(warning_dealers)} cửa hàng có một số sản phẩm chưa đạt mức tối ưu về khả năng tự động đề xuất bán kèm:\n"
                f"{detail_text}\n\n"
                f"Nguyên nhân thường gặp: Các cửa hàng này mới tạo, có quá ít sản phẩm trên kệ, hoặc chưa phát sinh đủ số lượng đơn hàng thực tế để AI học hỏi."
            ),
            reference_type='ai_training',
            reference_id=None,
            created_by=None,
            notif_type='warning',
        )

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
        Tính toán các chỉ số đánh giá mô hình: Catalog Coverage tổng thể + chi tiết từng Dealer.
        """
        from apps.dealer_products.models import DealerProduct
        from apps.dealers.models import DealerProfile

        norms_all = np.linalg.norm(embeddings, axis=1)
        norms_all[norms_all == 0] = 1e-10

        idx2item_clean = {int(k): v for k, v in idx2item.items()}
        product_to_dealer = dict(DealerProduct.objects.values_list('id', 'dealer_profile_id'))

        # Nhóm sản phẩm theo dealer
        dealer_products_map = {}
        for pid, did in product_to_dealer.items():
            dealer_products_map.setdefault(did, set()).add(pid)

        total_valid_items = len(idx2item_clean)
        unique_recommended_items = set()

        # Đếm số gợi ý thực tế cho mỗi sản phẩm
        product_rec_count = {}

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
                        unique_recommended_items.add(candidate_pid)

                if len(recommendations) == top_k:
                    break

            product_rec_count[target_pid] = len(recommendations)

        # Tính coverage tổng thể
        coverage_percentage = (len(unique_recommended_items) / total_valid_items) * 100 if total_valid_items > 0 else 0

        # Tính coverage chi tiết theo từng Dealer
        dealer_names = dict(DealerProfile.objects.values_list('id', 'store_name'))
        dealer_coverage_detail = []

        for dealer_id, dp_ids in dealer_products_map.items():
            # Chỉ xét sản phẩm tồn tại trong tập huấn luyện
            trained_ids = {pid for pid in dp_ids if pid in product_rec_count}
            total = len(trained_ids)
            if total == 0:
                continue

            covered = sum(1 for pid in trained_ids if product_rec_count.get(pid, 0) >= top_k)
            missing_count = total - covered
            pct = round((covered / total) * 100, 1)

            dealer_coverage_detail.append({
                'dealer_id': dealer_id,
                'dealer_name': dealer_names.get(dealer_id, f'Dealer #{dealer_id}'),
                'total_products': total,
                'covered': covered,
                'missing_count': missing_count,
                'coverage_pct': pct,
            })

        # Sắp xếp dealer có vấn đề lên đầu
        dealer_coverage_detail.sort(key=lambda x: x['coverage_pct'])

        metrics = {
            'total_items': total_valid_items,
            'items_recommended': len(unique_recommended_items),
            'catalog_coverage': round(coverage_percentage, 2),
            'dealer_coverage_detail': dealer_coverage_detail,
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
        from apps.dealer_products.models import DealerProductRelatedRecommendation

        norms_all = np.linalg.norm(embeddings, axis=1)
        norms_all[norms_all == 0] = 1e-10

        idx2item_clean = {int(k): v for k, v in idx2item.items()}
        product_to_dealer = dict(DealerProduct.objects.values_list('id', 'dealer_profile_id'))

        with transaction.atomic():
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

                DealerProductRelatedRecommendation.objects.update_or_create(
                    dealer_product_id=target_pid,
                    defaults={'related_product_ids': recommendations}
                )