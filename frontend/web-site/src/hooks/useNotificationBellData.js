import { useCallback, useEffect, useRef, useState } from "react";
import { useNotificationWebSocket } from "./useNotificationWebSocket";
import { useNotificationWebSocketHandler } from "./useNotificationWebSocketHandler";
import {
    buildBellStateFromList,
    isNotificationUnread,
} from "../components/Admin/Notification/notificationFormatters";
import { BELL_NOTIFICATION_PAGE_SIZE } from "../services/api/notificationService";
import {
    notificationService,
    handleApiError,
} from "../services/api/notificationService";
import {
    dispatchRealtimeNotificationEvent,
    resolveNotificationId,
} from "../utils/realtimeNotificationUtils";

export function useNotificationBellData({ enabled = true } = {}) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const knownIdsRef = useRef(new Set());
    const initialLoadDoneRef = useRef(false);

    const applyList = useCallback((rawList = [], options = {}) => {
        const next = buildBellStateFromList(rawList, options);
        setUnreadCount(next.unreadCount);
        setNotifications(next.notifications.slice(0, BELL_NOTIFICATION_PAGE_SIZE));
    }, []);

    const ingestFetchedItems = useCallback((items = [], options = {}) => {
        if (initialLoadDoneRef.current) {
            for (const item of items) {
                const id = resolveNotificationId(item);
                if (id == null || knownIdsRef.current.has(id)) continue;
                if (!isNotificationUnread(item)) continue;
                knownIdsRef.current.add(id);
                dispatchRealtimeNotificationEvent(item);
            }
        } else {
            for (const item of items) {
                const id = resolveNotificationId(item);
                if (id != null) knownIdsRef.current.add(id);
            }
            initialLoadDoneRef.current = true;
        }

        applyList(items, options);
    }, [applyList]);

    const fetchInitialNotifications = useCallback(async () => {
        try {
            const { unreadCount: count, items } = await notificationService.getBellFeed();
            ingestFetchedItems(items, { unreadCount: count });
        } catch (error) {
            console.error(handleApiError(error, "Không thể tải thông báo ban đầu"));
        }
    }, [ingestFetchedItems]);

    useEffect(() => {
        if (!enabled) {
            knownIdsRef.current.clear();
            initialLoadDoneRef.current = false;
            return undefined;
        }
        fetchInitialNotifications();
        return undefined;
    }, [enabled, fetchInitialNotifications]);

    const handleWebSocketMessage = useNotificationWebSocketHandler({
        applyList,
        setNotifications,
        setUnreadCount,
        onNewNotification: (incoming) => {
            const id = resolveNotificationId(incoming);
            if (id != null) knownIdsRef.current.add(id);
        },
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
