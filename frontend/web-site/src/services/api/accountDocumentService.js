import axiosClient from "./axiosClient";

export const accountDocumentService = {
  getAll: () =>
    axiosClient
      .get("/account-documents/")
      .then((res) => res.data.results ?? res.data),

  getById: (id) =>
    axiosClient.get(`/account-documents/${id}/`).then((res) => res.data),

  upload: (selectedFiles) => {
    const formData = new FormData();
    Object.entries(selectedFiles).forEach(([key, file]) => {
      formData.append(key, file);
    });
    return axiosClient
      .post("/account-documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  verify: (id, payload) => {
    const status = typeof payload === "string" ? payload : payload.status;
    const body = { status };

    if (typeof payload === "object" && payload.rejection_reason) {
      body.rejection_reason = payload.rejection_reason;
    }

    return axiosClient
      .post(`/account-documents/${id}/verify/`, body)
      .then((res) => res.data);
  },
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const data = error.response?.data;
  const message =
    data?.message ||
    data?.detail ||
    (typeof data === "object" ? JSON.stringify(data) : null) ||
    error.message ||
    defaultMessage;
  console.error("API Error:", error);
  return message;
};
