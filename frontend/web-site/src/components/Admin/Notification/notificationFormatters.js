export function formatNotificationRow(item) {
    return {
        id: item.id,
        receiptId: item.receiptId ?? item.receipt_id ?? null,
        type: item.type,
        typeLabel: item.typeLabel ?? item.type_label,
        title: item.title,
        content: item.content,
        referenceType: item.referenceType ?? item.reference_type,
        referenceTypeLabel: item.referenceTypeLabel ?? item.reference_type_label,
        referenceId: item.referenceId ?? item.reference_id,
        referenceStatus: item.referenceStatus ?? item.reference_status,
        referenceOrderCode: item.referenceOrderCode ?? item.reference_order_code,
        createdAt: item.createdAt ?? item.created_at,
        createdBy: item.createdBy ?? item.created_by,
        readAt: item.readAt ?? item.read_at ?? null,
        isRead: item.isRead ?? item.is_read,
    };
}

/** notification id từ getAll — dùng cho mark_read (mọi role) */
export function resolveNotificationId(item) {
    return item?.id ?? item?.notification_id ?? null;
}

export function resolveMarkReadId(item) {
    return resolveNotificationId(item);
}

export function matchesNotificationRecord(item, notificationId, receiptId) {
    if (!item || notificationId == null) return false;

    return (
        item.id === notificationId
        || (receiptId != null
            && (item.receiptId === receiptId || item.receipt_id === receiptId))
    );
}

export function isNotificationUnread(item) {
    if (!item) return false;

    const readAt = item.readAt ?? item.read_at;
    if (readAt) {
        return false;
    }

    const isRead = item.isRead ?? item.is_read;
    if (isRead === true || isRead === 1 || isRead === "true") {
        return false;
    }

    return true;
}

export function getMarkedReadState(response) {
    return {
        readAt: response?.read_at ?? new Date().toISOString(),
        isRead: response?.is_read ?? true,
    };
}

export function mergeNotificationDetail(detail, fallback = {}) {
    return {
        id: detail.id ?? fallback.id,
        receiptId: detail.receipt_id ?? fallback.receiptId ?? null,
        type: detail.type ?? fallback.type,
        typeLabel: detail.type_label ?? fallback.typeLabel,
        title: detail.title ?? fallback.title,
        content: detail.content ?? fallback.content,
        referenceType: detail.reference_type ?? fallback.referenceType,
        referenceTypeLabel: detail.reference_type_label ?? fallback.referenceTypeLabel,
        referenceId: detail.reference_id ?? fallback.referenceId,
        referenceStatus: detail.reference_status ?? fallback.referenceStatus,
        referenceOrderCode: detail.reference_order_code ?? fallback.referenceOrderCode,
        createdAt: detail.created_at ?? fallback.createdAt,
        createdBy: detail.created_by ?? fallback.createdBy,
        isRead: fallback.isRead ?? detail.is_read,
        readAt: fallback.readAt ?? detail.read_at ?? null,
    };
}
