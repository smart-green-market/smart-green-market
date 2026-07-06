import { normalizeListResponse } from "./adminDashboardUtils";

export const ADMIN_LIST_PAGE_SIZE = 10;

export function normalizePaginatedResponse(
  data,
  defaultPageSize = ADMIN_LIST_PAGE_SIZE,
) {
  const results = normalizeListResponse(data);
  return {
    results,
    count: Number(data?.count ?? results.length),
    page: Number(data?.page ?? 1),
    pageSize: Number(data?.page_size ?? defaultPageSize),
    hasMore: Boolean(data?.has_more),
    countStatus: data?.count_status ?? null,
  };
}

export function getAdminPageRange(currentPage, pageSize, totalCount) {
  if (totalCount <= 0) {
    return { from: 0, to: 0 };
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);
  return { from, to };
}

/** Chuẩn hóa query list admin: `keyword` → `search`, giữ `status` và các param khác. */
export function sanitizeAdminListParams(params = {}) {
  const {
    keyword,
    search,
    status,
    verification_status,
    page,
    page_size,
    ...rest
  } = params;

  const normalized = { ...rest };

  if (page != null) normalized.page = page;
  if (page_size != null) normalized.page_size = page_size;

  const searchValue = search ?? keyword;
  if (searchValue) normalized.search = searchValue;

  const statusValue = status ?? verification_status;
  if (statusValue) normalized.status = statusValue;

  return normalized;
}
