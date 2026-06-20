import axios from "axios";
import {
    clearAuthStorage,
    getRefreshToken,
    saveAuthTokens,
} from "./authTokenStorage";

const API_BASE_URL = "https://smart-green-market-api.onrender.com/api";

let isRefreshing = false;
let refreshQueue = [];

function resolveQueue(error, data = null) {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(data);
    });
    refreshQueue = [];
}

export function isAuthBypassRequest(url = "") {
    const path = String(url);
    return (
        path.endsWith("/login/") ||
        path.endsWith("/register/") ||
        path.endsWith("/refresh/") ||
        path.endsWith("/logout/")
    );
}

async function requestRefreshToken() {
    const refresh = getRefreshToken();

    if (!refresh) {
        const error = new Error("Không có refresh token");
        error.code = "NO_REFRESH_TOKEN";
        throw error;
    }

    const response = await axios.post(
        `${API_BASE_URL}/refresh/`,
        { refresh },
        { withCredentials: true },
    );

    return response.data;
}

export async function refreshAccessToken() {
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
        });
    }

    isRefreshing = true;

    try {
        const data = await requestRefreshToken();

        if (!data?.access) {
            throw new Error("API refresh không trả về access token");
        }

        saveAuthTokens({
            access: data.access,
            refresh: data.refresh,
        });

        resolveQueue(null, data);
        return data;
    } catch (error) {
        resolveQueue(error, null);
        throw error;
    } finally {
        isRefreshing = false;
    }
}

export { clearAuthStorage } from "./authTokenStorage";

export function redirectToLoginByPath() {
    const pathname = window.location.pathname;

    if (pathname.startsWith("/quan-tri")) {
        window.location.href = "/quan-tri/dang-nhap";
        return;
    }

    if (pathname.startsWith("/dai-ly")) {
        window.location.href = "/dai-ly/dang-nhap";
        return;
    }

    if (pathname.startsWith("/nha-cung-cap")) {
        window.location.href = "/nha-cung-cap/dang-nhap";
        return;
    }

    if (pathname.startsWith("/cua-hang/")) {
        const slug = pathname.split("/")[2];
        window.location.href = slug
            ? `/cua-hang/${encodeURIComponent(slug)}/dang-nhap`
            : "/";
        return;
    }

    window.location.href = "/";
}
