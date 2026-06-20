export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

export function saveAuthTokens(tokens = {}) {
    if (tokens.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    }

    if (tokens.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    }
}

export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAuthStorage() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem("user");
}
