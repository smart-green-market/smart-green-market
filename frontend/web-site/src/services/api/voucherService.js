import axiosClient from "./axiosClient";

export const voucherService = {
  getAll: (params) =>
    axiosClient.get("/vouchers/", { params }).then((res) => res.data),

  getById: (id) =>
    axiosClient.get(`/vouchers/${id}/`).then((res) => res.data),

  create: (data) =>
    axiosClient.post("/vouchers/", data).then((res) => res.data),

  update: (id, data) =>
    axiosClient.patch(`/vouchers/${id}/`, data).then((res) => res.data),

  delete: (id) =>
    axiosClient.delete(`/vouchers/${id}/`).then((res) => res.data),
};
