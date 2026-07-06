import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "./authProvider";
import { getAccessToken } from "../services/token/authTokenStorage";
import {
    reconnectNotificationWebSocket,
    subscribeNotificationWebSocket,
} from "../services/notificationWebSocketManager";
import { parseNotificationWebSocketMessage } from "../components/Admin/Notification/notificationFormatters";

export const NOTIFICATION_REALTIME_EVENT = "sgm:notification:new";

/**
 * Giữ 1 kết nối WebSocket thông báo toàn cục + toast khi có thông báo mới.
 * Dùng chung cho Admin, Supplier, Dealer, Buyer.
 */
export function NotificationRealtimeProvider({ children }) {
    const { user } = useAuth();
    const shownIdsRef = useRef(new Set());

    useEffect(() => {
        if (!user) {
            shownIdsRef.current.clear();
            return undefined;
        }

        const token = getAccessToken();
        if (!token) return undefined;

        return subscribeNotificationWebSocket({
            onMessage: (data) => {
                const message = parseNotificationWebSocketMessage(data);
                if (message?.kind !== "new") return;

                const item = message.item;
                const notificationId = item?.id;
                if (notificationId != null) {
                    if (shownIdsRef.current.has(notificationId)) return;
                    shownIdsRef.current.add(notificationId);
                }

                toast.info(item?.title || "Thông báo mới", {
                    description: item?.content,
                    duration: 5000,
                });

                window.dispatchEvent(
                    new CustomEvent(NOTIFICATION_REALTIME_EVENT, { detail: item }),
                );
            },
        });
    }, [user?.id]);

    return children;
}
