import axiosClient from "./axiosClient";

export const categoryService = {
  // USER
  getAll: () => axiosClient.get("/categories/").then((res) => res.data.results),

  // [
  //   {
  //     "id": 0,
  //     "name": "string",
  //     "description": "string",
  //     "status": "active",
  //     "created_at": "2026-06-06T13:02:33.765Z",
  //     "updated_at": "2026-06-06T13:02:33.765Z",
  //     "created_by": 0
  //   }
  // ]

  getById: (id) =>
    axiosClient.get(`/categories/${id}/`).then((res) => res.data),

  // {
  //   "id": 0,
  //   "name": "string",
  //   "description": "string",
  //   "status": "active",
  //   "created_at": "2026-06-06T13:05:19.452Z",
  //   "updated_at": "2026-06-06T13:05:19.452Z",
  //   "created_by": 0
  // }
  // ADMIN
  create: (data) =>
    axiosClient.post("/categories/", data).then((res) => res.data.data),

  // {
  //   "name": "string",
  //   "description": "string",
  //   "status": "active",
  //   "created_by": 0
  // }

  update: (id, data) =>
    axiosClient.put(`/categories/${id}/`, data).then((res) => res.data),

  // {
  //   "name": "string",
  //   "description": "string",
  //   "status": "active",
  //   "created_by": 0
  // }

  delete: (id) =>
    axiosClient.delete(`/categories/${id}/`).then((res) => res.data),

  lock: (id) =>
    axiosClient.post(`/categories/${id}/lock/`).then((res) => res.data),

  // {
  //   "name": "string",
  //   "description": "string",
  //   "sort_order": 2147483647
  // }

  unlock: (id) =>
    axiosClient.post(`/categories/${id}/unlock/`).then((res) => res.data),

  // {
  //   "name": "string",
  //   "description": "string",
  //   "sort_order": 2147483647
  // }

  verify: (id, data) =>
    axiosClient.post(`/categories/${id}/verify/`, data).then((res) => res.data),

  // id
  // {
  //   "status": "active / rejected",
  //   "rejection_reason": "string"
  // }

  // Supplier
  getsupplierCategories: () =>
    axiosClient.get("/categories/").then((res) => res.data.results),
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
