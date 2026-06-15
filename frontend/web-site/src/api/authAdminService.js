import axiosClient from "./axiosClient";

export const authService = {
  login: (data) => axiosClient.post("/login/", data).then((res) => res.data),

  refresh: () => axiosClient.post("/refresh/").then((res) => res.data),

  logout: () => axiosClient.post("/logout/").then((res) => res.data),
};
