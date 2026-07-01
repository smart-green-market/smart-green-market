import { useEffect, useRef } from "react";
import { getAccessToken } from "../services/token/authTokenStorage";
import { buildNotificationWebSocketUrl } from "../utils/notificationWebSocketUtils";

const RETRY_MS = 5000;

export function useNotificationWebSocket({ enabled = true, onMessage, onConnect, onDisconnect }) {
    const onMessageRef = useRef(onMessage);
    const onConnectRef = useRef(onConnect);
    const onDisconnectRef = useRef(onDisconnect);

    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;

    useEffect(() => {
        if (!enabled) return undefined;

        const token = getAccessToken();
        if (!token) return undefined;

        let ws = null;
        let retryTimer = null;
        let disposed = false;

        const scheduleRetry = () => {
            if (disposed) return;
            retryTimer = window.setTimeout(connect, RETRY_MS);
        };

        function connect() {
            if (disposed) return;

            try {
                ws = new WebSocket(buildNotificationWebSocketUrl(token));
            } catch {
                scheduleRetry();
                return;
            }

            ws.onopen = () => {
                if (disposed) {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.close(1000, "Component unmounted");
                    }
                    return;
                }
                onConnectRef.current?.();
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessageRef.current?.(data);
                } catch {
                    // ignore invalid payload
                }
            };

            ws.onerror = () => {
                // onclose handles reconnect
            };

            ws.onclose = () => {
                ws = null;
                onDisconnectRef.current?.();
                scheduleRetry();
            };
        }

        connect();

        return () => {
            disposed = true;
            window.clearTimeout(retryTimer);

            if (!ws) return;

            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;

            if (ws.readyState === WebSocket.OPEN) {
                ws.close(1000, "Component unmounted");
            }
        };
    }, [enabled]);

    return undefined;
}
