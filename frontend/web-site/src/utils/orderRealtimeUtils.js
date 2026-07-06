export const ORDER_REFERENCE_TYPES = {
    PURCHASE_ORDER: "purchase_order",
    CUSTOMER_ORDER: "customer_order",
};

/**
 * Trích xuất thông tin đơn từ payload notification WS / CustomEvent.
 * @returns {{ referenceType: string, referenceId: number, referenceStatus: string|null, referenceOrderCode: string|null } | null}
 */
export function parseOrderNotification(item) {
    if (!item || typeof item !== "object") return null;

    const referenceType = item.reference_type ?? item.referenceType;
    if (
        referenceType !== ORDER_REFERENCE_TYPES.PURCHASE_ORDER
        && referenceType !== ORDER_REFERENCE_TYPES.CUSTOMER_ORDER
    ) {
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
