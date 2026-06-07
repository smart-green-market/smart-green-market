import axiosClient from "./axiosClient";

export const notificationService = {
  // ADMIN
  getAll: () =>
    axiosClient.get("/notifications/my/").then((res) => res.data.results),

  //   [
  //         {
  //           "id": 0,
  //           "type_label": "string",
  //           "reference_type_label": "string",
  //           "type": "info",
  //           "title": "string",
  //           "content": "string",
  //           "reference_type": "string",
  //           "reference_id": 2147483647,
  //           "created_at": "2026-06-07T08:00:52.108Z",
  //           "created_by": 0
  //         }
  //       ]

  getById: (id) =>
    axiosClient.get(`/notifications/${id}/`).then((res) => res.data),

  //   {
  //     "id": 0,
  //     "type_label": "string",
  //     "reference_type_label": "string",
  //     "type": "info",
  //     "title": "string",
  //     "content": "string",
  //     "reference_type": "string",
  //     "reference_id": 2147483647,
  //     "created_at": "2026-06-07T08:01:34.134Z",
  //     "created_by": 0
  //     }

  mark_read: (id) =>
    axiosClient.post(`/notifications/${id}/mark_read/`).then((res) => res.data),
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
