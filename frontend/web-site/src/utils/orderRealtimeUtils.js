export const ORDER_REFERENCE_TYPES = {
    PURCHASE_ORDER: "purchase_order",
    CUSTOMER_ORDER: "customer_order",
    CUSTOMER_PREORDER_REQUEST: "customer_preorder_request",
};

const SUPPORTED_REFERENCE_TYPES = new Set(Object.values(ORDER_REFERENCE_TYPES));

/**
 * Trích xuất thông tin đơn từ payload notification WS / CustomEvent.
 * @returns {{ referenceType: string, referenceId: number, referenceStatus: string|null, referenceOrderCode: string|null } | null}
 */
export function parseOrderNotification(item) {
    if (!item || typeof item !== "object") return null;

    const referenceType = item.reference_type ?? item.referenceType;
    if (!SUPPORTED_REFERENCE_TYPES.has(referenceType)) {
        return null;
    }

    const rawId = item.reference_id ?? item.referenceId;
    if (rawId == null || rawId === "") return null;

    const referenceId = Number(rawId);
    if (Number.isNaN(referenceId)) return null;

    return {
        referenceType,
        referenceId,
        referenceStatus: item.reference_status ?? item.referenceStatus ?? null,
        referenceOrderCode: item.reference_order_code ?? item.referenceOrderCode ?? null,
    };
}
