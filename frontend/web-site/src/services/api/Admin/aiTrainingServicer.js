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
