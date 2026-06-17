import axiosClient from "./axiosClient";
import { refreshAccessToken } from "../token/refreshTokenManager";

export const authService = {
    login: (data) => axiosClient.post("/login/", data).then((res) => res.data),

    // Body: { refresh: "<refresh_token>" }
    refresh: () => refreshAccessToken(),

    logout: () => axiosClient.post("/logout/").then((res) => res.data),
};
