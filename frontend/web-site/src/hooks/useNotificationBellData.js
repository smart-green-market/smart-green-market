import { useCallback, useEffect, useState } from "react";
import { useNotificationWebSocket } from "./useNotificationWebSocket";
import { useNotificationWebSocketHandler } from "./useNotificationWebSocketHandler";
import {
    buildBellStateFromList,
} from "../components/Admin/Notification/notificationFormatters";
import { BELL_NOTIFICATION_PAGE_SIZE } from "../services/api/notificationService";
import {
    notificationService,
    handleApiError,
} from "../services/api/notificationService";

export function useNotificationBellData({ enabled = true } = {}) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);

    const applyList = useCallback((rawList = [], options = {}) => {
        const next = buildBellStateFromList(rawList, options);
        setUnreadCount(next.unreadCount);
        setNotifications(next.notifications.slice(0, BELL_NOTIFICATION_PAGE_SIZE));
    }, []);

    const fetchInitialNotifications = useCallback(async () => {
        try {
            const { unreadCount: count, items } = await notificationService.getBellFeed();
            applyList(items, { unreadCount: count });
        } catch (error) {
            console.error(handleApiError(error, "Không thể tải thông báo ban đầu"));
        }
    }, [applyList]);

    useEffect(() => {
        if (!enabled) return undefined;
        fetchInitialNotifications();
        return undefined;
    }, [enabled, fetchInitialNotifications]);

    const handleWebSocketMessage = useNotificationWebSocketHandler({
        applyList,
        setNotifications,
        setUnreadCount,
        maxItems: BELL_NOTIFICATION_PAGE_SIZE,
    });

    useNotificationWebSocket({
        enabled,
        onMessage: handleWebSocketMessage,
        onConnect: fetchInitialNotifications,
    });

    return {
        unreadCount,
        setUnreadCount,
        notifications,
        setNotifications,
        refreshNotifications: fetchInitialNotifications,
    };
}
