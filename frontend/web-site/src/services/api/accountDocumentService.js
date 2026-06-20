import axiosClient from "./axiosClient";

export const accountDocumentService = {
  // --- ADMIN + SUPPLIER
  getAll: () =>
    axiosClient.get("/account-documents/").then((res) => res.data.results),

  // [
  //   {
  //     "id": 0,
  //     "file_url": "string",
  //     "document_type": "business_license",
  //     "status": "pending",
  //     "verified_at": "2026-06-07T07:45:49.745Z",
  //     "created_at": "2026-06-07T07:45:49.745Z",
  //     "supplier": 0,
  //     "verified_by": 0
  //   }
  // ]

  getById: (id) =>
    axiosClient.get(`/account-documents/${id}/`).then((res) => res.data),

  // {
  //   "id": 0,
  //   "file_url": "string",
  //   "document_type": "business_license",
  //   "status": "pending",
  //   "verified_at": "2026-06-07T07:46:26.729Z",
  //   "created_at": "2026-06-07T07:46:26.729Z",
  //   "supplier": 0,
  //   "verified_by": 0
  // }

  // --- SUPPLIER
  create: (data) =>
    axiosClient.post("/account-documents/", data).then((res) => res.data.data),

  upload: (selectedFiles) => {
    const formData = new FormData();
    Object.entries(selectedFiles).forEach(([key, file]) => {
      formData.append(key, file);
    });
    return axiosClient
      .post("/account-documents/", formData)
      .then((res) => res.data);
  },

  verify: (id, payload) => {
    const formData = new FormData();
    const status = typeof payload === "string" ? payload : payload.status;

    formData.append("status", status);

    if (typeof payload === "object" && payload.rejection_reason) {
      formData.append("rejection_reason", payload.rejection_reason);
    }

    return axiosClient
      .post(`/account-documents/${id}/verify/`, formData)
      .then((res) => res.data);
  },
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
