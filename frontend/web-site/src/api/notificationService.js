import axiosClient from "./axiosClient";

export const notificationService = {
  getAll: () =>
    axiosClient.get("/notifications/my/").then((res) => {
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.results)) return data.results;
      return [];
    }),

  // getAll response (results[]):
  // {
  //   "receipt_id": 0,   ← chỉ để hiển thị/tracking
  //   "id": 0,           ← dùng cho mark_read (mọi role); getById chỉ admin
  //   "title": "string",
  //   "content": "string",
  //   "type": "info",
  //   "type_label": "string",
  //   "reference_type": "account_document",
  //   "reference_type_label": "string",
  //   "reference_id": 0,
  //   "reference_status": "string",
  //   "reference_order_code": "string",
  //   "read_at": null,
  //   "created_at": "2026-06-12T15:15:21.858Z"
  // }

  getById: (id) =>
    axiosClient.get(`/notifications/${id}/`).then((res) => res.data),

  // getById response:
  // {
  //   "id": 0,
  //   "type_label": "string",
  //   "reference_type_label": "string",
  //   "type": "info",
  //   "title": "string",
  //   "content": "string",
  //   "reference_type": "string",
  //   "reference_id": 2147483647,
  //   "created_at": "2026-06-12T15:18:04.802Z",
  //   "created_by": 0
  // }

  mark_read: (id) =>
    axiosClient
      .post(`/notifications/${id}/mark_read/`, {})
      .then((res) => res.data),
  // id = notification id từ getAll (mọi role)
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
