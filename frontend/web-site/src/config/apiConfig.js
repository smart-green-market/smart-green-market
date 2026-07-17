const DEFAULT_API_BASE_URL = "https://smart-green-market-api.onrender.com/api";
//const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api";

function normalizeApiBaseUrl(url) {
  return String(url).trim().replace(/\/+$/, "");
}

/** REST API base URL, e.g. http://127.0.0.1:8000/api */
export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL,
);

/** Backend origin without /api — dùng cho media URL, WebSocket host, v.v. */
export function getApiOrigin(apiBaseUrl = API_BASE_URL) {
  const normalized = normalizeApiBaseUrl(apiBaseUrl);

  if (normalized.endsWith("/api")) {
    return normalized.slice(0, -"/api".length);
  }

  return new URL(normalized).origin;
}

export const API_ORIGIN = getApiOrigin(API_BASE_URL);
