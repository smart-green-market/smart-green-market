import { useEffect, useRef } from "react";
import { useAuth } from "./authProvider";
import {
    NOTIFICATION_REALTIME_EVENT,
    resolveNotificationId,
    showRealtimeNotificationToast,
} from "../utils/realtimeNotificationUtils";

export { NOTIFICATION_REALTIME_EVENT };

/**
 * Hiển thị toast khi có thông báo mới (CustomEvent từ useNotificationWebSocketHandler).
 * Chuông + refresh đơn hàng dùng chung handler WS — tránh 2 luồng WS tách rời.
 */
export function NotificationRealtimeProvider({ children }) {
    const { user } = useAuth();
    const shownIdsRef = useRef(new Set());

    useEffect(() => {
        if (!user) {
            shownIdsRef.current.clear();
            return undefined;
        }

        const handleEvent = (event) => {
            const item = event.detail;
            if (!item || typeof item !== "object") return;

            const notificationId = resolveNotificationId(item);
            if (notificationId != null) {
                if (shownIdsRef.current.has(notificationId)) return;
                shownIdsRef.current.add(notificationId);
            }

            showRealtimeNotificationToast(item);
        };

        window.addEventListener(NOTIFICATION_REALTIME_EVENT, handleEvent);
        return () => {
            window.removeEventListener(NOTIFICATION_REALTIME_EVENT, handleEvent);
        };
    }, [user?.id]);

    return children;
}
