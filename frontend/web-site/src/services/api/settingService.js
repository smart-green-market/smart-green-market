import axiosClient from "./axiosClient";

export const settingService = {
  getAll: () => axiosClient.get("/admin/settings").then((res) => res.data),

  update: (id, data) =>
    axiosClient.put("/admin/settings/", data).then((res) => res.data),
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
