import axiosClient from "./axiosClient";

export const accountService = {
  // --- ACCOUNT

  create: (data) =>
    axiosClient.post("/register/", data).then((res) => res.data.data),

  // {
  //   "username": "supplier01",
  //   "email": "supplier01@example.com",
  updateProfile: (data) =>
    axiosClient.put("/profile/", data).then((res) => res.data),
  updateAvatar: (formData) =>
    axiosClient.post("/profile/avatar/", formData).then((res) => res.data),
  updatePassword: (data) => axiosClient.post("/change-password/", data).then((res) => res.data),
  getDocuments: () => axiosClient.get("/account-documents/").then((res) => res.data),
};

