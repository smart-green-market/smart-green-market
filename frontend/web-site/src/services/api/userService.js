import axiosClient from "./axiosClient";

export const userService = {
  getAll: () => axiosClient.get("/users/").then((res) => res.data.result),

  verify: (id, data) =>
    axiosClient.post(`/users/${id}/verify/`, data).then((res) => res.data),
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
