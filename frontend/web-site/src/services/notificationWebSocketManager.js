import { getAccessToken } from "./token/authTokenStorage";
import { buildNotificationWebSocketUrl } from "../utils/notificationWebSocketUtils";

const RETRY_MS = 5000;

/** @type {WebSocket | null} */
let ws = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let retryTimer = null;
let connectionToken = null;
let subscriberCount = 0;
let visibilityListenerAttached = false;

/** @type {Set<(data: unknown) => void>} */
const messageListeners = new Set();
/** @type {Set<() => void>} */
const connectListeners = new Set();
/** @type {Set<() => void>} */
const disconnectListeners = new Set();

function clearRetryTimer() {
    if (retryTimer != null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
    }
}

function scheduleRetry() {
    clearRetryTimer();
    if (subscriberCount === 0 || !connectionToken) return;
    retryTimer = window.setTimeout(openSocket, RETRY_MS);
}

function notifyConnect() {
    connectListeners.forEach((listener) => {
        try {
            listener();
        } catch (error) {
            console.error("Notification WS connect listener error:", error);
        }
    });
}

function notifyDisconnect() {
    disconnectListeners.forEach((listener) => {
        try {
            listener();
        } catch (error) {
            console.error("Notification WS disconnect listener error:", error);
        }
    });
}

function notifyMessage(data) {
    messageListeners.forEach((listener) => {
        try {
            listener(data);
        } catch (error) {
            console.error("Notification WS message listener error:", error);
        }
    });
}

function closeSocket() {
    clearRetryTimer();

    if (!ws) return;

    const socket = ws;
    ws = null;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;

    if (
        socket.readyState === WebSocket.OPEN
        || socket.readyState === WebSocket.CONNECTING
    ) {
        socket.close(1000, "Notification socket closed");
    }
}

function openSocket() {
    clearRetryTimer();

    if (subscriberCount === 0 || !connectionToken) return;

    let wsUrl;
    try {
        wsUrl = buildNotificationWebSocketUrl(connectionToken);
    } catch (error) {
        console.error("[NotificationWS] Cannot build WS URL:", error);
        scheduleRetry();
        return;
    }

    if (import.meta.env.DEV) {
        console.debug("[NotificationWS] Connecting →", wsUrl.replace(/token=[^&]+/, "token=***"));
    }

    try {
        ws = new WebSocket(wsUrl);
    } catch (error) {
        console.error("[NotificationWS] Failed to create WebSocket:", error);
        scheduleRetry();
        return;
    }

    ws.onopen = () => {
        if (import.meta.env.DEV) {
            console.debug("[NotificationWS] Connected ✓");
        }
        notifyConnect();
    };

    ws.onmessage = (event) => {
        try {
            notifyMessage(JSON.parse(event.data));
        } catch {
            // ignore invalid payload
        }
    };

    ws.onerror = (event) => {
        if (import.meta.env.DEV) {
            console.warn("[NotificationWS] Error — will reconnect after", RETRY_MS, "ms", event);
        }
        // onclose will handle reconnect
    };

    ws.onclose = (event) => {
        ws = null;
        if (import.meta.env.DEV) {
            console.debug("[NotificationWS] Closed — code:", event.code, "reason:", event.reason || "(none)");
        }
        notifyDisconnect();
        scheduleRetry();
    };
}

function syncConnectionToken() {
    const token = getAccessToken();
    if (!token) {
        connectionToken = null;
        closeSocket();
        return false;
    }

    const tokenChanged = connectionToken !== token;
    connectionToken = token;

    if (tokenChanged) {
        closeSocket();
    }

    if (!ws || ws.readyState === WebSocket.CLOSED) {
        openSocket();
    }

    return true;
}

function handleVisibilityChange() {
    if (document.visibilityState !== "visible") return;
    if (subscriberCount === 0) return;

    if (!syncConnectionToken()) return;

    if (ws?.readyState === WebSocket.OPEN) {
        notifyConnect();
    }
}

function attachVisibilityListener() {
    if (visibilityListenerAttached) return;
    document.addEventListener("visibilitychange", handleVisibilityChange);
    visibilityListenerAttached = true;
}

function detachVisibilityListener() {
    if (!visibilityListenerAttached) return;
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    visibilityListenerAttached = false;
}

function ensureConnection(token) {
    if (!token) {
        connectionToken = null;
        closeSocket();
        return;
    }

    syncConnectionToken();
}

/**
 * Đăng ký lắng nghe WebSocket thông báo — dùng chung 1 kết nối cho toàn app.
 * @returns {() => void} Hàm hủy đăng ký
 */
export function subscribeNotificationWebSocket({
    onMessage,
    onConnect,
    onDisconnect,
} = {}) {
    if (onMessage) messageListeners.add(onMessage);
    if (onConnect) connectListeners.add(onConnect);
    if (onDisconnect) disconnectListeners.add(onDisconnect);

    subscriberCount += 1;
    attachVisibilityListener();
    ensureConnection(getAccessToken());

    if (ws?.readyState === WebSocket.OPEN) {
        onConnect?.();
    }

    return () => {
        if (onMessage) messageListeners.delete(onMessage);
        if (onConnect) connectListeners.delete(onConnect);
        if (onDisconnect) disconnectListeners.delete(onDisconnect);

        subscriberCount = Math.max(0, subscriberCount - 1);

        if (subscriberCount === 0) {
            connectionToken = null;
            closeSocket();
            detachVisibilityListener();
        }
    };
}

/** Mở lại kết nối sau khi token được làm mới hoặc đăng nhập. */
export function reconnectNotificationWebSocket() {
    if (subscriberCount === 0) return;
    syncConnectionToken();
}
