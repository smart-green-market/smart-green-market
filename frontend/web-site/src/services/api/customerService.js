import axiosClient from "./axiosClient";

export const customerService = {
  /**
   * Lấy danh sách khách hàng của đại lý
   * GET /api/dealer-customers/
   * @param {Object} params - Query params (page, page_size, search, ...)
   */
  getAll: (params = {}) =>
    axiosClient
      .get("/dealer-customers/", { params })
      .then((res) => res.data),

  /**
   * Lấy thống kê phân khúc khách hàng
   * GET /api/dealer-customers/segment-stats/
   */
  getSegmentStats: () =>
    axiosClient
      .get("/dealer-customers/segment-stats/")
      .then((res) => res.data),

  /**
   * Lấy chi tiết một khách hàng
   * GET /api/dealer-customers/:id/
   */
  getById: (id) =>
    axiosClient
      .get(`/dealer-customers/${id}/`)
      .then((res) => res.data),

  /**
   * Cập nhật ghi chú khách hàng
   * PATCH /api/dealer-customers/:id/
   */
  updateNote: (id, data) =>
    axiosClient
      .patch(`/dealer-customers/${id}/`, data)
      .then((res) => res.data),

  /**
   * Chạy pipeline phân khúc khách hàng AI
   * POST /ai/customer-segmentation/
   */
  runSegmentation: (dealerId, tDays) => {
    const origin = axiosClient.defaults.baseURL.split("/api")[0];
    return axiosClient
      .post(`${origin}/api/customer-segmentation/`, {
        dealer_id: Number(dealerId),
        t_days: Number(tDays),
      })
      .then((res) => res.data);
  },
};
