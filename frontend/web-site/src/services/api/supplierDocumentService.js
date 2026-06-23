import axiosClient from "./axiosClient";

const DOCUMENTS_BASE = "/account-documents/";

export const supplierDocumentService = {
  // --- ADMIN + SUPPLIER
  getAll: () =>
    axiosClient.get(DOCUMENTS_BASE).then((res) => {
      const data = res.data;
      return data?.results ?? data?.data ?? (Array.isArray(data) ? data : []);
    }),

  getById: (id) =>
    axiosClient.get(`${DOCUMENTS_BASE}${id}/`).then((res) => res.data),

  // --- SUPPLIER
  // POST /account-documents/ — Upload 3 loại giấy tờ (một lần)
  create: (data) =>
    axiosClient
      .post(DOCUMENTS_BASE, data)
      .then((res) => res.data?.data ?? res.data),

  upload: (files = {}) => {
    const formData = new FormData();

    if (files.business_license) {
      formData.append("business_license", files.business_license);
    }
    if (files.id_card) {
      formData.append("id_card", files.id_card);
    }
    if (files.tax_certificate) {
      formData.append("tax_certificate", files.tax_certificate);
    }

    return axiosClient.post(DOCUMENTS_BASE, formData).then((res) => res.data);
  },

  update: (id, data) =>
    axiosClient.put(`${DOCUMENTS_BASE}${id}/`, data).then((res) => res.data),

  patch: (id, data) =>
    axiosClient.patch(`${DOCUMENTS_BASE}${id}/`, data).then((res) => res.data),

  delete: (id) =>
    axiosClient.delete(`${DOCUMENTS_BASE}${id}/`).then((res) => res.data),

  // --- ADMIN
  // POST /account-documents/{id}/verify/ — Admin duyệt giấy tờ
  verify: (id, status) => {
    const formData = new FormData();
    formData.append("status", status);

    return axiosClient
      .post(`${DOCUMENTS_BASE}${id}/verify/`, formData)
      .then((res) => res.data);
  },
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    defaultMessage;
  console.error("API Error:", error);
  return message;
};
