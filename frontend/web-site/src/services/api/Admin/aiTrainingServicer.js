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
