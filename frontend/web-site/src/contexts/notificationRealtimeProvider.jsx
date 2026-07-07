import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "./authProvider";

export const NOTIFICATION_REALTIME_EVENT = "sgm:notification:new";

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

            const notificationId = item.id ?? item.notification_id;
            if (notificationId != null) {
                if (shownIdsRef.current.has(notificationId)) return;
                shownIdsRef.current.add(notificationId);
            }

            toast.info(item.title || "Thông báo mới", {
                description: item.content ?? item.message,
                duration: 5000,
            });
        };

        window.addEventListener(NOTIFICATION_REALTIME_EVENT, handleEvent);
        return () => {
            window.removeEventListener(NOTIFICATION_REALTIME_EVENT, handleEvent);
        };
    }, [user?.id]);

    return children;
}
