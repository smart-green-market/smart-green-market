import axiosClient from "./axiosClient";

export const farmingProcessService = {
  /**
   * GET /api/farming-processes/
   * Trả về danh sách quy trình canh tác (có phân trang)
   */
  getAll: async (params = {}) => {
    let allResults = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const queryParams = { ...params, page, page_size: 100 };
      const res = await axiosClient.get("/cultivation-processes/", { params: queryParams });
      const data = res.data;

      const results = Array.isArray(data) ? data : (data?.results || []);
      allResults = [...allResults, ...results];

      if (Array.isArray(data) || !data?.has_more || !data?.next) {
        hasMore = false;
      } else {
        page += 1;
      }
    }

    return allResults;
  },

  /**
   * GET /api/farming-processes/:id/
   */
  getById: async (id) => {
    const res = await axiosClient.get(`/cultivation-processes/${id}/`);
    return res.data;
  },

  /**
   * POST /api/farming-processes/
   * payload: { supplier_product, step_order, process_name, description }
   */
  create: async (payload) => {
    const res = await axiosClient.post("/cultivation-processes/", payload);
    return res.data;
  },

  /**
   * PATCH /api/farming-processes/:id/
   */
  update: async (id, payload) => {
    const res = await axiosClient.patch(`/cultivation-processes/${id}/`, payload);
    return res.data;
  },

  /**
   * DELETE /api/farming-processes/:id/
   */
  delete: async (id) => {
    const res = await axiosClient.delete(`/cultivation-processes/${id}/`);
    return res.data;
  },
};
