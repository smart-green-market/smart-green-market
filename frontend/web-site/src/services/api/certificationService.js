import axiosClient from "./axiosClient";

export const certificationService = {
  // --- ADMIN + SUPPLIER
  getAll: () =>
    axiosClient.get("/certifications/").then((res) => res.data.results),

  //   [
  //     {
  //         "id": 0,
  //         "name": "string",
  //         "certificate_code": "string",
  //         "issued_by": "string",
  //         "issue_date": "2026-06-06",
  //         "expiry_date": "2026-06-06",
  //         "description": "string",
  //         "file_url": "string",
  //         "status": "pending",
  //         "verified_at": "2026-06-06T13:09:50.018Z",
  //         "rejection_reason": "string",
  //         "created_at": "2026-06-06T13:09:50.018Z",
  //         "updated_at": "2026-06-06T13:09:50.018Z",
  //         "deleted_at": "2026-06-06T13:09:50.018Z",
  //         "supplier": 0,
  //         "verified_by": 0
  //     }
  //     ]

  getById: (id) =>
    axiosClient.get(`/certifications/${id}/`).then((res) => res.data),

  //   {
  //     "id": 0,
  //     "name": "string",
  //     "certificate_code": "string",
  //     "issued_by": "string",
  //     "issue_date": "2026-06-06",
  //     "expiry_date": "2026-06-06",
  //     "description": "string",
  //     "file_url": "string",
  //     "status": "pending",
  //     "verified_at": "2026-06-06T13:12:29.797Z",
  //     "rejection_reason": "string",
  //     "created_at": "2026-06-06T13:12:29.797Z",
  //     "updated_at": "2026-06-06T13:12:29.797Z",
  //     "deleted_at": "2026-06-06T13:12:29.797Z",
  //     "supplier": 0,
  //     "verified_by": 0
  //     }

  // --- SUPPLIER
  create: (data) =>
    axiosClient.post("/certifications/", data).then((res) => res.data.data),

  //   {
  //     "name": "string",
  //     "certificate_code": "string",
  //     "issued_by": "string",
  //     "issue_date": "2026-06-06",
  //     "expiry_date": "2026-06-06",
  //     "description": "string",
  //     "file_url": "string",
  //     "deleted_at": "2026-06-06T13:12:13.696Z",
  //     "supplier": 0
  //     }

  update: (id, data) =>
    axiosClient.put(`/certifications/${id}/`, data).then((res) => res.data),

  //   {
  //     "name": "string",
  //     "certificate_code": "string",
  //     "issued_by": "string",
  //     "issue_date": "2026-06-06",
  //     "expiry_date": "2026-06-06",
  //     "description": "string",
  //     "file_url": "string",
  //     "deleted_at": "2026-06-06T13:13:47.915Z",
  //     "supplier": 0
  //     }

  // --- ADMIN
  verify: (id, data) =>
    axiosClient
      .post(`/certifications/${id}/verify/`, data)
      .then((res) => res.data),

  //   {
  //     "status": "approved / rejected",
  //     "rejection_reason": "string"
  //     }

  delete: (id) =>
    axiosClient.delete(`/certifications/${id}/`).then((res) => res.data),
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
