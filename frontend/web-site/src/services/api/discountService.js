import axiosClient from "./axiosClient";

export const discountService = {
  getAll: (params) =>
    axiosClient.get("/age-discount-policies/", { params }).then((res) => res.data),
  
  getById: (id) =>
    axiosClient.get(`/age-discount-policies/${id}/`).then((res) => res.data),
    
  create: (data) =>
    axiosClient.post("/age-discount-policies/", data).then((res) => res.data),
    
  update: (id, data) =>
    axiosClient.patch(`/age-discount-policies/${id}/`, data).then((res) => res.data),
    
  delete: (id) =>
    axiosClient.delete(`/age-discount-policies/${id}/`).then((res) => res.data),
};
