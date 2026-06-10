import axiosClient from "./axiosClient";

export const dealerService = {
  getAll: () => axiosClient.get("/dealers/").then((res) => res.data.result),

  verify: (id, data) =>
    axiosClient.post(`/dealers/${id}/verify/`, data).then((res) => res.data),
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
