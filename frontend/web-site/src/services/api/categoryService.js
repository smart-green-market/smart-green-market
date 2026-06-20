import axiosClient from "./axiosClient";

export const categoryService = {
  // USER
  getAll: () => axiosClient.get("/categories/").then((res) => res.data.results),

  // {
  //   "count": 123,
  //   "next": "http://api.example.org/accounts/?page=4",
  //   "previous": "http://api.example.org/accounts/?page=2",
  //   "results": [
  //     {
  //       "count": 0,
  //       "next": "string",
  //       "previous": "string",
  //       "page": 0,
  //       "page_size": 0,
  //       "has_more": true,
  //       "results": [
  //         {
  //           "id": 0,
  //           "name": "string",
  //           "description": "string",
  //           "scope": "system",
  //           "status": "pending",
  //           "sort_order": 2147483647,
  //           "verified_by": 0,
  //           "verified_by_username": "string",
  //           "verified_at": "2026-06-15T12:41:01.284Z",
  //           "rejection_reason": "string",
  //           "created_at": "2026-06-15T12:41:01.284Z",
  //           "updated_at": "2026-06-15T12:41:01.284Z",
  //           "created_by": {
  //             "id": 0,
  //             "username": "yZO0T.smCML60uSxgDGRKaC8HfhN_N116GUIVjRGBgCuitujvGgdBqWhNLnH5DO9",
  //             "full_name": "string",
  //             "phone": "string",
  //             "role": "admin",
  //             "profile_name": "string"
  //           },
  //           "product_count": 0
  //         }
  //       ]
  //     }
  //   ]
  // }

  getById: (id) =>
    axiosClient.get(`/categories/${id}/`).then((res) => res.data),

  // {
  //   "id": 0,
  //   "name": "string",
  //   "description": "string",
  //   "scope": "system",
  //   "status": "pending",
  //   "sort_order": 2147483647,
  //   "verified_by": 0,
  //   "verified_by_username": "string",
  //   "verified_at": "2026-06-15T12:40:37.754Z",
  //   "rejection_reason": "string",
  //   "created_at": "2026-06-15T12:40:37.754Z",
  //   "updated_at": "2026-06-15T12:40:37.754Z",
  //   "created_by": {
  //     "id": 0,
  //     "username": "3Gv4epIlArwYEQhHbUvTH9l7q.nJi8V5aoi1GmeI",
  //     "full_name": "string",
  //     "phone": "string",
  //     "role": "admin",
  //     "profile_name": "string"
  //   },
  //   "product_count": 0,
  //   "products": "string"
  // }

  createSystem: (data) => axiosClient.post("/categories/", data).then((res) => res.data),
  
  //Admin tạo scope=system (active ngay). Supplier/Dealer tạo danh mục riêng (custom) → status=pending, chờ Admin duyệt. Tối đa danh mục riêng theo /api/system-config/.
  // {
  //   "scope": "system",
  //   "name": "string",
  //   "description": "string",
  //   "sort_order": 2147483647
  // }

  create: (data) =>
    axiosClient.post("/categories/", data).then((res) => res.data),

   // {
  //   "scope": "custom",
  //   "name": "string",
  //   "description": "string",
  //   "sort_order": 2147483647
  // }

  update: (id, data) =>
    axiosClient.put(`/categories/${id}/`, data).then((res) => res.data),

  // {
  //   "scope": "system",
  //   "name": "string",
  //   "description": "string",
  //   "sort_order": 2147483647
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
