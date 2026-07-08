import numpy as np
import pandas as pd
import tensorflow as tf
from django.utils import timezone
from django.db import transaction

from apps.orders.models import Order
from apps.marketing.models import CustomerSegment, CustomerSegmentMember, CustomerInteraction, CustomerSegmentationHistory

from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Max, Q

def load_data(dealer_id, t_days):
    now = timezone.now()
    start_date = now - timedelta(days=t_days)

    customer_ids = list(
        Order.objects.filter(dealer_id=dealer_id)
        .values_list('customer_id', flat=True)
        .distinct()
    )

    if not customer_ids:
        return []

    # Khởi tạo Dictionary để lưu kết quả với giá trị mặc định cho từng khách hàng
    metrics_dict = {
        cid: {
            "last_order": None,  # Sẽ lưu số ngày dạng số nguyên (int)
            "total_order": 0,
            "total_spent": 0,
            "conversion_rate": 0.0,
            "raw_views": 0,
            "raw_purchases": 0
        }
        for cid in customer_ids
    }

    # =========================================================
    # BƯỚC 2: TRUY VẤN BẢNG ORDER (Gom nhóm theo customer_id của Dealer này)
    # =========================================================
    order_stats = Order.objects.filter(
        customer_id__in=customer_ids,
        dealer_id=dealer_id
    ).values('customer_id').annotate(
        last_purchase=Max('created_at'),
        orders_t_days=Count('id', filter=Q(created_at__gte=start_date)),
        spent_t_days=Sum('total_amount', filter=Q(created_at__gte=start_date))
    )

    # Đổ dữ liệu Order vào metrics_dict và biến đổi ngày thành số nguyên
    for stat in order_stats:
        cid = stat['customer_id']
        last_purchase = stat['last_purchase']
        
        if last_purchase:
            delta_seconds = (now - last_purchase).total_seconds()
            days_ago = int(delta_seconds // 86400)
            metrics_dict[cid]['last_order'] = days_ago
        else:
            metrics_dict[cid]['last_order'] = None

        metrics_dict[cid]['total_order'] = stat['orders_t_days'] or 0
        metrics_dict[cid]['total_spent'] = float(stat['spent_t_days'] or 0)


    # =========================================================
    # BƯỚC 3: TRUY VẤN BẢNG CUSTOMER INTERACTION (Gom nhóm theo customer_id)
    # =========================================================
    interaction_stats = CustomerInteraction.objects.filter(
        customer_id__in=customer_ids,
        dealer_id=dealer_id,
        updated_at__gte=start_date
    ).values('customer_id').annotate(
        total_views=Sum('view_count'),
        total_purchases=Sum('purchase_count')
    )

    # Đổ dữ liệu Tương tác và tính Conversion Rate làm tròn 4 chữ số thập phân
    for stat in interaction_stats:
        cid = stat['customer_id']
        views = stat['total_views'] or 0
        purchases = stat['total_purchases'] or 0
        
        metrics_dict[cid]['raw_views'] = views
        metrics_dict[cid]['raw_purchases'] = purchases
        
        # Tính tỉ lệ chuyển đổi mua hàng / số lần click (view)
        if views > 0:
            metrics_dict[cid]['conversion_rate'] = round(purchases / views, 4)
        else:
            metrics_dict[cid]['conversion_rate'] = 0.0


    # =========================================================
    # BƯỚC 4: ĐỊNH DẠNG LẠI KẾT QUẢ ĐẦU RA DẠNG LIST DICT
    # =========================================================
    final_results = [
        {"customer_id": cid, **data}
        for cid, data in metrics_dict.items()
    ]
    
    return final_results

class CustomerSegmentationService:
    """
    MÔ HÌNH AI SỐ 1: PHÂN LOẠI KHÁCH HÀNG (RFM + K-MEANS)
    """
    
    def __init__(self, k_clusters=4, max_iters=100):
        self.k = k_clusters
        self.max_iters = max_iters
        self.last_silhouette_score = 0.0

    def execute_pipeline(self, dealer_id=None, t_days=30):
        # Đọc dữ liệu từ Postgres thông qua Django và chuẩn hóa dữ liệu thành TensorFlow Tensor
        tensor_input, df, ordered_segments = self._preprocess_data(dealer_id, t_days)
        if df is None or len(df) == 0:
            return None, "Không có dữ liệu khách hàng nào phát sinh giao dịch trong thời gian qua."
            
        if len(df) < self.k:
            return None, f"Số lượng khách hàng hiện tại ({len(df)}) quá ít, không đủ điều kiện tối thiểu để chạy mô hình AI phân cụm (Yêu cầu tối thiểu {self.k} khách hàng)."
        # Xử lý thuật toán toán học TensorFlow K-Means
        df_clustered = self._run_bisecting_kmeans(tensor_input, df)

        # Gắn nhãn phân cấp động dựa trên điểm số
        df_labeled, label_mapping = self._auto_label_segments(df_clustered, ordered_segments)

        # Tính toán Silhouette Score để đánh giá chất lượng phân cụm
        silhouette_score = self._evaluate_clustering(tensor_input, df_labeled)
        self.last_silhouette_score = silhouette_score
        # Lưu kết quả xuống 2 bảng database theo đúng ERD
        self._save_to_database(df_labeled, label_mapping, dealer_id, silhouette_score)
        return df_labeled, label_mapping
        #return f"Thành công: Đã cập nhật phân khúc khách hàng bằng AI cho {len(df_labeled)} tài khoản."

    def _preprocess_data(self, dealer_id, t_days=30):
        raw_metrics = load_data(dealer_id=dealer_id, t_days=t_days)
    
        if not raw_metrics:
            return None, None, None
            
        df = pd.DataFrame(raw_metrics)

        # XỬ LÝ NAN: Nếu khách chưa từng mua, gán số ngày cực lớn (t_day +1))
        df['last_order'] = df['last_order'].fillna(t_days + 1)  

        # TÁCH ID: Đẩy customer_id làm Index
        df.set_index('customer_id', inplace=True)

        # =========================================================
        # BƯỚC 1: TÍNH RFM SCORE
        # =========================================================
        R, F, M, CR = df['last_order'].values, df['total_order'].values, df['total_spent'].values, df['conversion_rate'].values
        R_min, R_max = R.min(), R.max()
        F_min, F_max = F.min(), F.max()
        M_min, M_max = M.min(), M.max()

        R_score = (R_max - R) / (R_max - R_min + 1e-8)  
        F_score = (F - F_min) / (F_max - F_min + 1e-8)
        M_score = (M - M_min) / (M_max - M_min + 1e-8)

        w_r, w_f, w_m = 0.3, 0.2, 0.5 
        df['RFM_score'] = (w_r * R_score) + (w_f * F_score) + (w_m * M_score)

        # =========================================================
        # 2: CHUẨN HÓA ĐÚNG MATRIX (RFM_Score + Conversion_Rate)
        # =========================================================
        values = np.column_stack((df['RFM_score'].values, CR))

        mean = np.mean(values, axis=0)
        std = np.std(values, axis=0)
        std[std == 0] = 1.0  # Tránh lỗi chia cho 0
        
        X_scaled = (values - mean) / std
        tensor_input = tf.convert_to_tensor(X_scaled, dtype=tf.float32)

        # Lấy danh mục nhãn mẫu từ DB
        ordered_segments = list(
            CustomerSegment.objects.filter(is_system=True)
            .order_by('id')
            .values('id', 'code', 'name')
        )

        return tensor_input, df, ordered_segments

    def _run_bisecting_kmeans(self, tensor_input, df):
        X = tensor_input
        n_samples = X.shape[0]
        
        def run_means(X_sub):
            n_sub = X_sub.shape[0]
            if n_sub < 2:
                return tf.zeros([n_sub], dtype=tf.int64)
                
            # Khởi tạo 2 tâm cụm ngẫu nhiên từ tập dữ liệu con này
            random_indices = tf.random.shuffle(tf.range(n_sub))[:2]
            centroids = tf.gather(X_sub, random_indices)
            
            for _ in range(self.max_iters):
                # Tính khoảng cách Euclidean
                distances = tf.reduce_sum(tf.square(tf.expand_dims(X_sub, 1) - tf.expand_dims(centroids, 0)), axis=2)
                assignments = tf.argmin(distances, axis=1)
                
                # Cập nhật tâm cụm mới
                new_centroids = tf.math.unsorted_segment_mean(X_sub, assignments, num_segments=2)
                
                if tf.reduce_all(tf.equal(centroids, new_centroids)):
                    break
                centroids = new_centroids
            return assignments

        # -----------------------------------------------------------------
        # Khởi tạo cấu trúc cây Bisecting K-Means
        # -----------------------------------------------------------------
        # Ban đầu, toàn bộ chỉ số hàng (0 -> n_samples-1) nằm chung trong 1 cụm duy nhất
        clusters_indices = [np.arange(n_samples)]
        
        # Vòng lặp chia đôi liên tục cho đến khi danh sách đạt đủ self.k cụm
        while len(clusters_indices) < self.k:
            max_sse = -1.0
            split_idx = -1
            
            # BƯỚC 1: Duyệt qua các cụm hiện tại để tìm cụm có SSE (độ phân tán) lớn nhất
            for idx, indices in enumerate(clusters_indices):
                if len(indices) <= 1:
                    continue
                
                X_cluster = tf.gather(X, indices)
                centroid = tf.reduce_mean(X_cluster, axis=0)
                # Công thức tính toán SSE bằng toán tử TensorFlow
                sse = tf.reduce_sum(tf.square(X_cluster - centroid)).numpy()
                
                if sse > max_sse:
                    max_sse = sse
                    split_idx = idx
            
            # Nếu không tìm thấy cụm nào đủ điều kiện hợp lệ để phân rã tiếp, dừng vòng lặp
            if split_idx == -1:
                break
                
            # BƯỚC 2: Tiến hành trích xuất và bổ đôi cụm có SSE lớn nhất
            indices_to_split = clusters_indices[split_idx]
            X_subset = tf.gather(X, indices_to_split)
            
            # Chạy thuật toán 2-Means trên tập dữ liệu con
            sub_assignments = run_means(X_subset).numpy()
            
            # Tạo 2 mảng lưu chỉ số dòng con mới dựa trên kết quả phân loại (0 hoặc 1)
            indices_0 = indices_to_split[sub_assignments == 0]
            indices_1 = indices_to_split[sub_assignments == 1]
            
            # Xóa cụm cha cũ khỏi danh sách và đẩy 2 cụm con mới vào thay thế
            clusters_indices.pop(split_idx)
            clusters_indices.append(indices_0)
            clusters_indices.append(indices_1)
            
        # -----------------------------------------------------------------
        # BƯỚC 3: Tổng hợp kết quả gán nhãn về định dạng cột DataFrame ban đầu
        # -----------------------------------------------------------------
        final_assignments = np.zeros(n_samples, dtype=np.int64)
        for cluster_id, indices in enumerate(clusters_indices):
            final_assignments[indices] = cluster_id
            
        df['Cluster'] = final_assignments
        return df

    def _evaluate_clustering(self, tensor_input, df):
        """[Private] Tính toán Silhouette Score bằng thuần toán tử TensorFlow"""
        try:
            labels = df['Cluster'].values
            labels_tensor = tf.convert_to_tensor(labels, dtype=tf.int32)
            
            # 1. Kiểm tra số lượng cụm thực tế trong phiên chạy
            unique_labels, _ = tf.unique(labels_tensor)
            num_clusters = tf.shape(unique_labels)[0]
            if num_clusters <= 1:
                return 0.0

            N = tf.shape(tensor_input)[0]
            
            # 2. Tính ma trận khoảng cách Euclid Pairwise (N x N) giữa tất cả các cặp điểm
            # Công thức ma trận hóa: ||x - y||^2 = ||x||^2 - 2<x, y> + ||y||^2
            r = tf.reduce_sum(tf.square(tensor_input), axis=1, keepdims=True)
            D_squared = r - 2.0 * tf.matmul(tensor_input, tf.transpose(tensor_input)) + tf.transpose(r)
            D_matrix = tf.sqrt(tf.maximum(D_squared, 0.0)) # Tránh số âm rất nhỏ do sai số số thực (float precision)

            # Khởi tạo các tensor lưu trữ giá trị a(i), b(i) và kích thước cụm của mỗi điểm
            a = tf.zeros([N], dtype=tf.float32)
            b = tf.fill([N], float('inf'))
            cluster_sizes = tf.zeros([N], dtype=tf.float32)

            # 3. Tính toán hình học dựa trên cơ chế Broadcasting Mask (Vòng lặp qua K cụm)
            for c in range(self.k):
                mask_c = tf.equal(labels_tensor, c)
                count_c = tf.reduce_sum(tf.cast(mask_c, tf.float32))
                
                # Cập nhật kích thước cụm tương ứng cho từng điểm
                cluster_sizes = tf.where(mask_c, count_c, cluster_sizes)

                # Phát tán (Broadcasting) mask để tính tổng khoảng cách từ mọi điểm đến toàn bộ thành viên cụm c
                mask_c_2d = tf.cast(tf.expand_dims(mask_c, 0), tf.float32) # Mở rộng chiều thành (1, N)
                sum_dist_to_c = tf.reduce_sum(D_matrix * mask_c_2d, axis=1) # Tổng theo hàng (N,)

                # Tính a(i): Khoảng cách trung bình nội cụm (chỉ áp dụng cho các điểm thuộc cụm c)
                # Vì D_matrix[i, i] = 0 nên sum_dist_to_c đã tự loại trừ khoảng cách của chính nó
                a_c = tf.where(count_c > 1, sum_dist_to_c / (count_c - 1.0), 0.0)
                a = tf.where(mask_c, a_c, a)

                # Tính b(i): Khoảng cách trung bình ngoại cụm gần nhất (áp dụng cho các điểm KHÔNG thuộc cụm c)
                b_c = tf.where(count_c > 0, sum_dist_to_c / count_c, float('inf'))
                b = tf.where(tf.logical_not(mask_c), tf.minimum(b, b_c), b)

            # 4. Áp dụng công thức Silhouette cho từng điểm: s(i) = (b - a) / max(a, b)
            max_ab = tf.maximum(a, b)
            silhouette_per_point = tf.where(max_ab > 0.0, (b - a) / max_ab, 0.0)
            
            # Quy ước toán học chuẩn: Nếu cụm chỉ có 1 phần tử đơn lẻ thì điểm của phần tử đó mặc định bằng 0
            silhouette_per_point = tf.where(cluster_sizes <= 1.0, 0.0, silhouette_per_point)

            # 5. Lấy trung bình cộng điểm số của tất cả các điểm trong tập dữ liệu
            mean_silhouette = tf.reduce_mean(silhouette_per_point)
            return float(mean_silhouette.numpy())

        except Exception as e:
            print(f"❌ Lỗi trong quá trình tính toán Silhouette Score bằng TensorFlow: {str(e)}")
        return 0.0

    def _auto_label_segments(self, df, ordered_segments=None):
        """[Private] Định danh nhãn dựa trên kết quả thuật toán"""
        cluster_stats = df.groupby('Cluster')[['RFM_score', 'conversion_rate']].mean().reset_index()
        cluster_stats['Combined_Score'] = cluster_stats['RFM_score'] + cluster_stats['conversion_rate']
        cluster_stats = cluster_stats.sort_values(by='Combined_Score').reset_index(drop=True)
        
        label_mapping = {}
        for rank_idx, row in cluster_stats.iterrows():
            cluster_id = int(row['Cluster'])
            label_mapping[cluster_id] = ordered_segments[rank_idx]
                
        df['Customer_Tag_Code'] = df['Cluster'].map(lambda x: label_mapping[x]['code'])
        return df, label_mapping

    def _save_to_database(self, df_labeled, label_mapping, dealer_id, silhouette_score):
        """[Private] Đồng bộ dữ liệu xuống PostgreSQL đảm bảo ACID và hiệu năng Bulk"""
        with transaction.atomic():
            
            # 1. Trích xuất danh sách các ID của Segment từ label_mapping (vd: [1, 2, 3, 4])
            segment_ids = [seg_info['id'] for seg_info in label_mapping.values()]
            
            # 2. Lấy danh sách ID khách hàng từ INDEX của DataFrame
            customer_ids = df_labeled.index.tolist()
            
            # BƯỚC 1: Xóa dữ liệu phân loại cũ của tập khách hàng này trong 4 nhóm AI
            CustomerSegmentMember.objects.filter(
                customer_profile_id__in=customer_ids,
                segment_id__in=segment_ids
            ).delete()

            # BƯỚC 2: Bulk Insert hàng loạt vào bảng trung gian
            new_members = []
            now = timezone.now()
            
            # Dùng vòng lặp iterrows(): customer_id chính là index, row chứa các cột còn lại
            for customer_id, row in df_labeled.iterrows():
                # Lấy ra số thứ tự Cụm AI (0, 1, 2, 3) của khách hàng này
                cluster_id = row['Cluster'] 
                
                # Từ Cụm AI, tra cứu ngược lại sang ID thực tế của Segment trong Database
                actual_segment_id = label_mapping[cluster_id]['id']
                
                new_members.append(
                    CustomerSegmentMember(
                        customer_profile_id=customer_id,   # Lấy từ index
                        segment_id=actual_segment_id,      # Lấy ID trực tiếp từ mapping
                        created_at=now
                    )
                )
                
            if new_members:
                CustomerSegmentMember.objects.bulk_create(new_members)
            
            # BƯỚC 3: Lưu lịch sử phân loại
            CustomerSegmentationHistory.objects.create(
                dealer_id=dealer_id,
                silhouette_score=silhouette_score,
                created_at=now
            )