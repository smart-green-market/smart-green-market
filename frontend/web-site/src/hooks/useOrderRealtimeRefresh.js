import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNotificationRealtimeEvent } from "./useNotificationRealtimeEvent";
import { subscribeNotificationWebSocket } from "../services/notificationWebSocketManager";
import { parseOrderNotification } from "../utils/orderRealtimeUtils";

/**
 * Lắng nghe notification realtime và refresh UI đơn B2B/B2C.
 *
 * @param {object} options
 * @param {string[]} [options.referenceTypes] - Loại reference cần lắng nghe
 * @param {number|string|null} [options.watchOrderId] - ID đơn đang xem chi tiết
 * @param {(parsed: ReturnType<typeof parseOrderNotification>) => void} [options.onRefresh] - Refetch list/stats
 * @param {(parsed: ReturnType<typeof parseOrderNotification>) => void} [options.onDetailRefresh] - Refetch detail khi khớp watchOrderId
 * @param {boolean} [options.enabled]
 * @param {number} [options.debounceMs] - Gom nhiều WS event liên tiếp
 */
export function useOrderRealtimeRefresh({
    referenceTypes = ["purchase_order", "customer_order"],
    watchOrderId = null,
    onRefresh,
    onDetailRefresh,
    enabled = true,
    debounceMs = 400,
} = {}) {
    const onRefreshRef = useRef(onRefresh);
    const onDetailRefreshRef = useRef(onDetailRefresh);
    const debounceTimerRef = useRef(null);

    onRefreshRef.current = onRefresh;
    onDetailRefreshRef.current = onDetailRefresh;

    const typesSet = useMemo(
        () => new Set(referenceTypes),
        [referenceTypes.join(",")],
    );

    const normalizedWatchId = watchOrderId != null ? Number(watchOrderId) : null;

    const handleNotification = useCallback(
        (item) => {
            const parsed = parseOrderNotification(item);
            if (!parsed || !typesSet.has(parsed.referenceType)) return;

            if (
                normalizedWatchId != null
                && !Number.isNaN(normalizedWatchId)
                && parsed.referenceId === normalizedWatchId
            ) {
                onDetailRefreshRef.current?.(parsed);
            }

            if (debounceTimerRef.current != null) {
                window.clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = window.setTimeout(() => {
                onRefreshRef.current?.(parsed);
            }, debounceMs);
        },
        [typesSet, normalizedWatchId, debounceMs],
    );

    useNotificationRealtimeEvent(handleNotification, { enabled });

    // WS reconnect (Render sleep) → refetch để bắt đơn/thống kê bị miss khi offline
    useEffect(() => {
        if (!enabled) return undefined;

        return subscribeNotificationWebSocket({
            onConnect: () => {
                if (debounceTimerRef.current != null) {
                    window.clearTimeout(debounceTimerRef.current);
                }
                debounceTimerRef.current = window.setTimeout(() => {
                    onRefreshRef.current?.();
                }, debounceMs);
            },
        });
    }, [enabled, debounceMs]);

    useEffect(() => () => {
        if (debounceTimerRef.current != null) {
            window.clearTimeout(debounceTimerRef.current);
        }
    }, []);
}
