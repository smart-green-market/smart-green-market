import axiosClient from "./axiosClient";
import { extractApiError } from "../../utils/extractApiError";

export const dealerPreOrderService = {
  getAll: async (params = {}) => {
    const res = await axiosClient.get("/preorder-requests/", { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await axiosClient.get(`/preorder-requests/${id}/`);
    return res.data;
  },

  confirm: async (id, data = {}) => {
    const res = await axiosClient.post(`/preorder-requests/${id}/confirm/`, data);
    return res.data;
  },

  propose: async (id, data) => {
    const res = await axiosClient.post(`/preorder-requests/${id}/propose/`, data);
    return res.data;
  },

  reject: async (id, data) => {
    const res = await axiosClient.post(`/preorder-requests/${id}/reject/`, data);
    return res.data;
  },
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") =>
  extractApiError(error, defaultMessage);
