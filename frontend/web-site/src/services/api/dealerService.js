import axiosClient from "./axiosClient";

export const dealerService = {
  getAll: () => axiosClient.get("/dealers/").then((res) => res.data.result),
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
