import axiosClient from "./axiosClient";

export const purchaseOrderService = {
  // Lấy danh sách phiếu nhập hàng (có hỗ trợ bộ lọc phân trang, tìm kiếm, trạng thái)
  getAll: (params) =>
    axiosClient.get("/purchase-orders/", { params }).then((res) => res.data),

  // Lấy thông tin chi tiết một phiếu nhập hàng theo id
  getById: (id) =>
    axiosClient.get(`/purchase-orders/${id}/`).then((res) => res.data),

  // Tạo mới một phiếu nhập hàng
  create: (data) =>
    axiosClient.post("/purchase-orders/", data).then((res) => res.data),

  // Hủy phiếu nhập hàng
  cancel: (id, data) =>
    axiosClient.post(`/purchase-orders/${id}/cancel/`, data).then((res) => res.data),

  // Xác nhận đã nhận hàng (đối với đại lý khi đơn đang giao)
  confirmDelivery: (id, data) =>
    axiosClient.post(`/purchase-orders/${id}/confirm-delivery/`, data).then((res) => res.data),

  // Lấy thông tin tài khoản và mã QR thanh toán (deposit hoặc final_payment)
  getPaymentQr: (id, paymentType) =>
    axiosClient.get(`/purchase-orders/${id}/payment-qr/`, { params: { payment_type: paymentType } }).then((res) => res.data),

  // Nộp minh chứng thanh toán đặt cọc (FormData có receipt_file)
  submitDeposit: (id, formData) =>
    axiosClient.post(`/purchase-orders/${id}/submit-deposit/`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then((res) => res.data),

  // Nộp minh chứng thanh toán cuối (FormData có receipt_file)
  submitFinalPayment: (id, formData) =>
    axiosClient.post(`/purchase-orders/${id}/submit-final-payment/`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then((res) => res.data),
};
