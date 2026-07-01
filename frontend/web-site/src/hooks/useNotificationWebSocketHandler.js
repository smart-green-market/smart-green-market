import { useCallback } from "react";
import {
    buildBellStateFromList,
    formatNotificationRow,
    isNotificationUnread,
    parseNotificationWebSocketMessage,
    sortNotificationsByCreatedDesc,
} from "../components/Admin/Notification/notificationFormatters";

/**
 * Xử lý message WS notification — dùng chung cho Bell và trang danh sách.
 */
export function useNotificationWebSocketHandler({
    applyList,
    setNotifications,
    setUnreadCount,
    onNewNotification,
    maxItems = 5,
}) {
    return useCallback(
        (data) => {
            const message = parseNotificationWebSocketMessage(data);
            if (!message) return;

            if (message.kind === "list") {
                applyList?.(
                    message.items,
                    message.unreadCount != null
                        ? { unreadCount: message.unreadCount }
                        : {},
                );
                return;
            }

            if (message.kind === "unread_count") {
                setUnreadCount?.(message.unreadCount);
                return;
            }

            if (message.kind === "new") {
                const incoming = message.item;
                const formatted = formatNotificationRow(incoming);

                setNotifications?.((prev) => {
                    const withoutDup = prev.filter((item) => item.id !== formatted.id);
                    const next = sortNotificationsByCreatedDesc([formatted, ...withoutDup]);
                    return maxItems != null ? next.slice(0, maxItems) : next;
                });

                if (isNotificationUnread(incoming)) {
                    setUnreadCount?.((prev) => prev + 1);
                }

                onNewNotification?.(incoming, formatted);
            }
        },
        [applyList, setNotifications, setUnreadCount, onNewNotification, maxItems],
    );
}
