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

export const userOrderService = {
  getAll: async () => {
    try {
      const res = await axiosClient.get("/customer-orders/");
      const list = flattenOrderResults(res.data);
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
