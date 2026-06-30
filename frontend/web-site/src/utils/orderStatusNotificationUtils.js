export const ORDER_STATUS_NOTIFICATION_EVENT = "gm-order-status-notification-updated";

const STORAGE_PREFIX = "gm_order_status_snapshot";

function getStorageKey(dealerSlug, buyerId) {
    const slug = String(dealerSlug || "default").trim() || "default";
    const owner = buyerId != null ? String(buyerId) : "guest";
    return `${STORAGE_PREFIX}_${slug}_${owner}`;
}

function notifyUpdated() {
    window.dispatchEvent(new CustomEvent(ORDER_STATUS_NOTIFICATION_EVENT));
}

export function buildOrderStatusMap(orders = []) {
    return orders.reduce((acc, order) => {
        if (order?.id == null) return acc;
        acc[String(order.id)] = order.status ?? "";
        return acc;
    }, {});
}

export function loadOrderStatusSnapshot(dealerSlug, buyerId) {
    try {
        const raw = localStorage.getItem(getStorageKey(dealerSlug, buyerId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}

export function saveOrderStatusSnapshot(dealerSlug, buyerId, orders = []) {
    localStorage.setItem(
        getStorageKey(dealerSlug, buyerId),
        JSON.stringify(buildOrderStatusMap(orders)),
    );
    notifyUpdated();
}

export function countOrderStatusChanges(previousMap, currentMap) {
    if (!previousMap || Object.keys(previousMap).length === 0) {
        return { count: 0, changedIds: [] };
    }

    const allIds = new Set([
        ...Object.keys(previousMap),
        ...Object.keys(currentMap),
    ]);

    const changedIds = [];

    allIds.forEach((id) => {
        if (previousMap[id] !== currentMap[id]) {
            changedIds.push(id);
        }
    });

    return { count: changedIds.length, changedIds };
}

/**
 * So sánh danh sách đơn hiện tại với snapshot đã lưu.
 * Lần đầu (chưa có snapshot) chỉ lưu baseline, không báo cập nhật.
 */
export function detectOrderStatusUpdates(dealerSlug, buyerId, orders = []) {
    const currentMap = buildOrderStatusMap(orders);
    const previousMap = loadOrderStatusSnapshot(dealerSlug, buyerId);

    if (!previousMap || Object.keys(previousMap).length === 0) {
        saveOrderStatusSnapshot(dealerSlug, buyerId, orders);
        return { hasUpdates: false, updateCount: 0, changedIds: [] };
    }

    const { count, changedIds } = countOrderStatusChanges(previousMap, currentMap);

    return {
        hasUpdates: count > 0,
        updateCount: count,
        changedIds,
    };
}

/** Người dùng đã xem trang theo dõi — đồng bộ snapshot mới nhất */
export function markOrderStatusesSeen(dealerSlug, buyerId, orders = []) {
    saveOrderStatusSnapshot(dealerSlug, buyerId, orders);
}

export function readPendingUpdateCount(dealerSlug, buyerId, orders = []) {
    const previousMap = loadOrderStatusSnapshot(dealerSlug, buyerId);
    if (!previousMap) return 0;
    return countOrderStatusChanges(previousMap, buildOrderStatusMap(orders)).count;
}
