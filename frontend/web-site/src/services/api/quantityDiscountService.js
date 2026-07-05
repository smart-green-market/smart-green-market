import axiosClient from "./axiosClient";

export const quantityDiscountService = {
  getAll: (params) =>
    axiosClient.get("/quantity-discount-policies/", { params }).then((res) => res.data),

  getById: (id) =>
    axiosClient.get(`/quantity-discount-policies/${id}/`).then((res) => res.data),

  create: (data) =>
    axiosClient.post("/quantity-discount-policies/", data).then((res) => res.data),

  update: (id, data) =>
    axiosClient.patch(`/quantity-discount-policies/${id}/`, data).then((res) => res.data),

  delete: (id) =>
    axiosClient.delete(`/quantity-discount-policies/${id}/`).then((res) => res.data),
};
