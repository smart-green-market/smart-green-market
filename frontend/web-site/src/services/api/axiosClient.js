import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://smart-green-market-api.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// REQUEST
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE
axiosClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    
    // Nếu là API đăng nhập thì không thực hiện refresh token hay redirect tự động
    const isLoginRequest = originalRequest?.url?.endsWith("/login/");

    if (error.response?.status === 401 && !isLoginRequest && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          "https://smart-green-market-api.onrender.com/api/refresh/",
          {},
          {
            withCredentials: true,
          },
        );

        const newAccessToken = response.data.access;

        localStorage.setItem("access_token", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        // Điều hướng thông minh về trang đăng nhập tương ứng
        const pathname = window.location.pathname;
        if (pathname.startsWith("/quan-tri") || pathname.startsWith("/admin")) {
          window.location.href = "/admin/login";
        } else if (pathname.startsWith("/dai-ly")) {
          window.location.href = "/dai-ly/login";
        } else if (pathname.startsWith("/nha-cung-cap")) {
          window.location.href = "/nha-cung-cap/login";
        } else {
          window.location.href = "/";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
