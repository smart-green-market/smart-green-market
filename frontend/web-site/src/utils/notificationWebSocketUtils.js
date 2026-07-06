import { API_ORIGIN } from "../config/apiConfig";

/**
 * Derive notification WebSocket URL from REST API origin.
 * https://smart-green-market-api.onrender.com/api -> wss://smart-green-market-api.onrender.com/ws/notifications/?token=...
 * http://127.0.0.1:8000/api -> ws://127.0.0.1:8000/ws/notifications/?token=...
 * Override with VITE_WS_NOTIFICATIONS_URL env var if needed.
 */
export function buildNotificationWebSocketUrl(token) {
    if (import.meta.env.VITE_WS_NOTIFICATIONS_URL) {
        const url = new URL(import.meta.env.VITE_WS_NOTIFICATIONS_URL);
        url.searchParams.set("token", token);
        return url.toString();
    }

    const origin = import.meta.env.VITE_WS_BASE_URL || API_ORIGIN;
    const httpUrl = new URL(origin.includes("://") ? origin : `http://${origin}`);
    const wsProtocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";

    const wsUrl = new URL(`${wsProtocol}//${httpUrl.host}/ws/notifications/`);
    wsUrl.searchParams.set("token", token);

    return wsUrl.toString();
}
