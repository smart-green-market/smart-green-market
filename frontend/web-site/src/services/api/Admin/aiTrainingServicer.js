import axiosClient from "../axiosClient";

export const aiTrainingServicer = {
  trainRelatedProducts: () =>
    axiosClient.post("/train-related-products/").then((res) => res.data),
  // Chỉ admin. Chạy pipeline huấn luyện mô hình gợi ý sản phẩm liên quan từ lịch sử đơn hàng và cập nhật kết quả xuống database.

  // response
  // {
  //   "success": true,
  //   "message": "Thành công: Đã huấn luyện mô hình và cập nhật danh sách gợi ý."
  // }

  reloadRelatedProducts: () =>
    axiosClient.post("/sync-related-products/").then((res) => res.data),
  // API POST (LUỒNG 2): Chỉ thực hiện tính toán độ tương đồng Cosine từ file ma trận trọng số .keras để lưu xuống CSDL mà không cần huấn luyện lại. Tốc độ siêu nhanh (< 1s).
  // response
  // {
  //   "success": true,
  //   "message": "string"
  // }

  customerSegment: (params = {}) =>
    axiosClient.get("/customer-segments/", { params }).then((res) => res.data),
  // Admin và Dealer xem tất cả nhóm khách hàng (segment hệ thống dùng chung).
  // Chạy phân khúc khách hàng (RFM + K-Means) - MỚI
  // GET /api/customer-segments/?page=1&page_size=20
  // Phân trang (load more): mặc định page=1, page_size=20, tối đa 100.

  // {
  //   "count": 123,
  //   "next": "http://api.example.org/accounts/?page=4",
  //   "previous": "http://api.example.org/accounts/?page=2",
  //   "page": 1,
  //   "page_size": 5,
  //   "has_more": true,
  //   "results": [
  //     {
  //       "id": 0,
  //       "code": "string",
  //       "name": "string",
  //       "description": "string",
  //       "is_system": true,
  //       "created_at": "2026-07-16T11:40:06.601Z",
  //       "updated_at": "2026-07-16T11:40:06.601Z"
  //     }
  //   ]
  // }

  customerSegmentDetail: (id) =>
    axiosClient.get(`/customer-segments/${id}/`).then((res) => res.data),
  //ViewSet để quản lý phân nhóm khách hàng (CustomerSegment). Segment là tài nguyên dùng chung toàn hệ thống; membership gán qua CustomerSegmentMember. Admin có toàn quyền. Dealer chỉ có quyền xem (list/retrieve).
  //in id
  //{
  //   "id": 0,
  //   "code": "string",
  //   "name": "string",
  //   "description": "string",
  //   "is_system": true,
  //   "created_at": "2026-07-16T11:50:07.996Z",
  //   "updated_at": "2026-07-16T11:50:07.996Z"
  // }

  customerSegmentAdminHistory: () =>
    axiosClient.get(`/admin/segmentation-history/`).then((res) => res.data),
  // Admin giám sát điểm số Sihouette toàn hệ thống (Phân trang)
  // Lấy danh sách phân trang (load từng trang) tất cả dữ liệu phân cụm AI của mọi đại lý để Admin đánh giá mô hình.

  // {
  //   "count": 0,
  //   "next": "string",
  //   "previous": "string",
  //   "page": 0,
  //   "page_size": 0,
  //   "has_more": true,
  //   "count_status": {
  //     "additionalProp1": 0,
  //     "additionalProp2": 0,
  //     "additionalProp3": 0
  //   },
  //   "results": [
  //     {
  //       "id": 0,
  //       "dealer_id": 2147483647,
  //       "silhouette_score": 0,
  //       "total_customers": 2147483647,
  //       "created_at": "2026-07-18T00:59:19.523Z",
  //       "formatted_created_at": "string"
  //     }
  //   ]
  // }

  customerSegmentDealerHistory: () =>
    axiosClient.get(`/dealer/segmentation-history/`).then((res) => res.data),
  // Lịch sử phân nhóm khách hàng trong 60 ngày gần nhất của Dealer
  //Trả về toàn bộ các phiên phân cụm AI trong vòng 60 ngày qua, sắp xếp tuần tự tăng dần phục vụ vẽ biểu đồ miền.

  // in: dealer_id (ID của đại lý cần lấy lịch sử)

  // [
  //   {
  //     "id": 0,
  //     "total_customers": 2147483647,
  //     "vip_count": 2147483647,
  //     "potential_count": 2147483647,
  //     "passive_count": 2147483647,
  //     "risk_count": 2147483647,
  //     "silhouette_score": 0,
  //     "created_at": "2026-07-18T00:59:47.463Z",
  //     "formatted_created_at": "string"
  //   }
  // ]
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const data = error.response?.data;
  const message =
    data?.message ||
    data?.detail ||
    (typeof data === "string" ? data : null) ||
    error.message ||
    defaultMessage;
  console.error("API Error:", error);
  return message;
};
