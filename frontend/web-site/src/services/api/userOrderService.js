import axiosClient from "./axiosClient";
import { extractApiError } from "../../utils/extractApiError";
import {
  MOCK_USER_ORDERS,
  getMockUserOrderById,
} from "../../mocks/userOrderMockData";

function flattenOrderResults(data) {
  if (Array.isArray(data)) return data;

  const top = data?.results ?? data?.result ?? [];
  if (!Array.isArray(top)) return [];

  if (top.length && Array.isArray(top[0]?.results)) {
    return top.flatMap((page) => page.results ?? []);
  }

  return top;
}

function useMockFallback(error) {
  console.warn(
    "[userOrderService] Dùng mock data tạm:",
    error?.message ?? error,
  );
  return MOCK_USER_ORDERS;
}

/** Fetch tất cả đơn hàng qua nhiều trang (loop theo trường `next`) */
async function fetchAllOrderPages(firstUrl) {
  const allResults = [];
  let nextUrl = firstUrl;

  while (nextUrl) {
    const res = await axiosClient.get(nextUrl);
    const data = res.data;

    const page = flattenOrderResults(data);
    allResults.push(...page);

    const rawNext = data?.next ?? null;
    if (!rawNext) break;

    // Nếu `next` là full URL (http://...), chỉ lấy phần path+query
    try {
      const url = new URL(rawNext);
      nextUrl = url.pathname + url.search;
    } catch {
      nextUrl = rawNext;
    }
  }

  return allResults;
}

export const userOrderService = {
  getAll: async () => {
    try {
      const list = await fetchAllOrderPages("/customer-orders/?page_size=100");
      return list.length ? list : MOCK_USER_ORDERS;
    } catch (error) {
      return useMockFallback(error);
    }
  },

  getById: async (id) => {
    try {
      const res = await axiosClient.get(`/customer-orders/${id}/`);
      return res.data?.data ?? res.data;
    } catch (error) {
      const mock = getMockUserOrderById(id);
      if (mock) {
        console.warn("[userOrderService] getById fallback mock:", id);
        return mock;
      }
      throw error;
    }
  },
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  console.error("API Error:", error);
  return extractApiError(error, defaultMessage);
};
