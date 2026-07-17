import axiosClient from "../axiosClient";

function normalizeAdminCustomerResponse(data) {
  const nested =
    Array.isArray(data?.results) &&
    data.results.length === 1 &&
    data.results[0] &&
    Array.isArray(data.results[0].results)
      ? data.results[0]
      : null;
  const payload = nested || data || {};

  return {
    count: Number(payload.count ?? data?.count) || 0,
    next: payload.next ?? data?.next ?? null,
    previous: payload.previous ?? data?.previous ?? null,
    page: Number(payload.page ?? data?.page) || 1,
    page_size: Number(payload.page_size ?? data?.page_size) || 20,
    has_more: Boolean(payload.has_more ?? data?.has_more),
    count_status: payload.count_status ?? data?.count_status ?? {},
    count_loyalty: payload.count_loyalty ?? data?.count_loyalty ?? {},
    count_segment: payload.count_segment ?? data?.count_segment ?? {},
    results: Array.isArray(payload.results) ? payload.results : [],
  };
}

export const adminDealerService = {
  /**
   * GET /api/admin/customers/
   * Query: dealer_id, dealer_slug, page, page_size, search,
   * segment_code, status, tier_code.
   */
  getCustomers: (params = {}) =>
    axiosClient
      .get("/admin/customers/", { params })
      .then((res) => normalizeAdminCustomerResponse(res.data)),
};

export { normalizeAdminCustomerResponse };
