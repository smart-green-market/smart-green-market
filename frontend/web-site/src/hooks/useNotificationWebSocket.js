import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/authProvider";
import { getAccessToken } from "../services/token/authTokenStorage";
import { subscribeNotificationWebSocket } from "../services/notificationWebSocketManager";

export function useNotificationWebSocket({ enabled = true, onMessage, onConnect, onDisconnect }) {
    const { user } = useAuth();
    const onMessageRef = useRef(onMessage);
    const onConnectRef = useRef(onConnect);
    const onDisconnectRef = useRef(onDisconnect);

    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;

    useEffect(() => {
        if (!enabled || !user) return undefined;

        const token = getAccessToken();
        if (!token) return undefined;

        return subscribeNotificationWebSocket({
            onMessage: (data) => onMessageRef.current?.(data),
            onConnect: () => onConnectRef.current?.(),
            onDisconnect: () => onDisconnectRef.current?.(),
        });
    }, [enabled, user?.id]);

    return undefined;
}
