import { useEffect, useRef } from "react";
import { NOTIFICATION_REALTIME_EVENT } from "../contexts/notificationRealtimeProvider";

/**
 * Lắng nghe thông báo mới từ NotificationRealtimeProvider (WebSocket toàn cục).
 * Dùng cho trang cần phản ứng realtime mà không tự subscribe WS riêng.
 */
export function useNotificationRealtimeEvent(onNewNotification, { enabled = true } = {}) {
    const handlerRef = useRef(onNewNotification);
    handlerRef.current = onNewNotification;

    useEffect(() => {
        if (!enabled) return undefined;

        const handleEvent = (event) => {
            handlerRef.current?.(event.detail);
        };

        window.addEventListener(NOTIFICATION_REALTIME_EVENT, handleEvent);
        return () => {
            window.removeEventListener(NOTIFICATION_REALTIME_EVENT, handleEvent);
        };
    }, [enabled]);
}
