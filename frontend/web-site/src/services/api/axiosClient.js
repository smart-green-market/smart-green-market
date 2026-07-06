import axios from "axios";
import { API_BASE_URL } from "../../config/apiConfig";
import { getAccessToken } from "../token/authTokenStorage";
import {
  clearAuthStorage,
  isAuthBypassRequest,
  redirectToLoginByPath,
  refreshAccessToken,
} from "../token/refreshTokenManager";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthBypassRequest(requestUrl)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const data = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      clearAuthStorage();
      window.dispatchEvent(new Event("unauthorized"));
      redirectToLoginByPath();
      return Promise.reject(refreshError);
    }
  },
);

export default axiosClient;
