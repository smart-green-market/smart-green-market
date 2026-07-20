import axiosClient from "./axiosClient";

export const loyaltyService = {
  // Cấu hình tích điểm (Sử dụng 'me' làm ID định danh cho đại lý hiện tại)
  getSettings: () => axiosClient.get("/loyalty-settings/me/").then(res => res.data),
  updateSettings: (data) => axiosClient.patch("/loyalty-settings/me/", data).then(res => res.data),

  // Danh sách & Thống kê hạng
  getTiers: (params = {}) => axiosClient.get("/loyalty-tiers/", { params }).then(res => res.data),
  createTier: (data) => axiosClient.post("/loyalty-tiers/", data).then(res => res.data),
  updateTier: (id, data) => axiosClient.patch(`/loyalty-tiers/${id}/`, data).then(res => res.data),
  getTierStats: () => axiosClient.get("/loyalty-tiers/stats/").then(res => res.data),

  // Lịch sử của từng khách hàng
  getCustomerTransactions: (customerId, params = {}) => 
    axiosClient.get(`/dealer-customers/${customerId}/loyalty-transactions/`, { params }).then(res => res.data),
  getCustomerTierHistories: (customerId, params = {}) => 
    axiosClient.get(`/dealer-customers/${customerId}/tier-histories/`, { params }).then(res => res.data),
  adjustCustomerPoints: (customerId, data) => 
    axiosClient.post(`/dealer-customers/${customerId}/adjust-loyalty-points/`, data).then(res => res.data),
};
