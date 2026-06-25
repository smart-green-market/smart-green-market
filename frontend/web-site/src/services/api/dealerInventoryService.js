import axiosClient from "./axiosClient";

export const dealerInventoryService = {
  // Lấy danh sách lô hàng tồn kho
  getBatches: (params) =>
    axiosClient.get("/dealer-inventory-batches/", { params }).then((res) => res.data),

  // Lấy lịch sử giao dịch kho
  getTransactions: (params) =>
    axiosClient.get("/dealer-inventory-transactions/", { params }).then((res) => res.data),

  // Ghi nhận hao hụt tồn kho
  recordWastage: (id, data) =>
    axiosClient.post(`/dealer-inventory-batches/${id}/record-wastage/`, data).then((res) => res.data),
};
