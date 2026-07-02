import axiosClient from "../services/api/axiosClient";

/**
 * Derive notification WebSocket URL from REST API baseURL.
 * http://127.0.0.1:8000/api -> ws://127.0.0.1:8000/ws/notifications/?token=...
 */
export function buildNotificationWebSocketUrl(token) {
    if (import.meta.env.VITE_WS_NOTIFICATIONS_URL) {
        const url = new URL(import.meta.env.VITE_WS_NOTIFICATIONS_URL);
        url.searchParams.set("token", token);
        return url.toString();
    }

    const apiBase =
        import.meta.env.VITE_WS_BASE_URL
        || axiosClient.defaults.baseURL
        || "http://127.0.0.1:8000/api";

    const httpUrl = new URL(apiBase);
    const wsProtocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
    const host = httpUrl.host;

    const wsUrl = new URL(`${wsProtocol}//${host}/ws/notifications/`);
    wsUrl.searchParams.set("token", token);

    return wsUrl.toString();
}
