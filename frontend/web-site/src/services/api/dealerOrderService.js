import axiosClient from "./axiosClient";
import { extractApiError } from "../../utils/extractApiError";

export const dealerOrderService = {
  getAll: async (params = {}) => {
    try {
      const res = await axiosClient.get("/customer-orders/", { params });
      return res.data; // trả về cục json { count, results: [...] }
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn bán hàng", error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const res = await axiosClient.get(`/customer-orders/${id}/`);
      return res.data;
    } catch (error) {
      console.error("Lỗi lấy chi tiết đơn bán hàng", error);
      throw error;
    }
  },

  confirmOrder: async (id) => {
    try {
      const res = await axiosClient.post(`/customer-orders/${id}/confirm/`);
      return res.data;
    } catch (error) {
      console.error("Lỗi xác nhận đơn bán hàng", error);
      throw error;
    }
  },

  startProcessing: async (id) => {
    try {
      const res = await axiosClient.post(`/customer-orders/${id}/start-processing/`);
      return res.data;
    } catch (error) {
      console.error("Lỗi chuyển trạng thái đang chuẩn bị hàng", error);
      throw error;
    }
  },

  shipOrder: async (id) => {
    try {
      const res = await axiosClient.post(`/customer-orders/${id}/ship/`);
      return res.data;
    } catch (error) {
      console.error("Lỗi chuyển trạng thái giao hàng", error);
      throw error;
    }
  }
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  return extractApiError(error, defaultMessage);
};
