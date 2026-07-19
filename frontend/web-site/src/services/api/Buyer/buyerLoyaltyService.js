import axiosClient from "../axiosClient";

const storefrontLoyaltyPath = (dealerSlug) =>
  `/storefronts/${encodeURIComponent(dealerSlug)}`;

export const buyerLoyaltyService = {
  // Danh sách hạng và quyền lợi công khai của cửa hàng.
  getTier: (dealerSlug) =>
    axiosClient
      .get(`${storefrontLoyaltyPath(dealerSlug)}/loyalty/tiers/`)
      .then((response) => response.data),

  // Hạng hiện tại, điểm tích lũy và tiến độ lên hạng của buyer.
  getMyScore: (dealerSlug) =>
    axiosClient
      .get(`${storefrontLoyaltyPath(dealerSlug)}/me/loyalty/`)
      .then((response) => response.data),

  // Lịch sử cộng/trừ điểm, phân trang từ API.
  getHistory: (dealerSlug, { page = 1, page_size = 10 } = {}) =>
    axiosClient
      .get(`${storefrontLoyaltyPath(dealerSlug)}/me/loyalty/transactions/`, {
        params: { page, page_size },
      })
      .then((response) => response.data),
};

export const normalizeLoyaltyTiers = (payload) => {
  const tiers = Array.isArray(payload) ? payload : payload?.results;
  return Array.isArray(tiers)
    ? [...tiers]
        .filter((tier) => tier?.is_active !== false)
        .sort(
          (left, right) =>
            Number(left?.level ?? left?.min_points ?? 0) -
            Number(right?.level ?? right?.min_points ?? 0),
        )
    : [];
};

export const normalizeLoyaltyHistory = (payload, fallbackPageSize = 10) => ({
  count: Number(payload?.count ?? 0),
  page: Math.max(1, Number(payload?.page ?? 1)),
  page_size: Math.max(1, Number(payload?.page_size ?? fallbackPageSize)),
  has_more: Boolean(payload?.has_more ?? payload?.next),
  next: payload?.next ?? null,
  previous: payload?.previous ?? null,
  results: Array.isArray(payload?.results) ? payload.results : [],
});

export const handleLoyaltyApiError = (
  error,
  defaultMessage = "Có lỗi xảy ra khi tải dữ liệu thành viên.",
) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  defaultMessage;
