export function formatNotificationRow(item) {
    return {
        id: item.id,
        type: item.type,
        typeLabel: item.typeLabel ?? item.type_label,
        title: item.title,
        content: item.content,
        referenceType: item.referenceType ?? item.reference_type,
        referenceTypeLabel: item.referenceTypeLabel ?? item.reference_type_label,
        referenceId: item.referenceId ?? item.reference_id,
        createdAt: item.createdAt ?? item.created_at,
        createdBy: item.createdBy ?? item.created_by,
        readAt: item.readAt ?? item.read_at,
    };
}

export function mergeNotificationDetail(detail, fallback = {}) {
    return {
        id: detail.id ?? fallback.id,
        type: detail.type ?? fallback.type,
        typeLabel: detail.type_label ?? fallback.typeLabel,
        title: detail.title ?? fallback.title,
        content: detail.content ?? fallback.content,
        referenceType: detail.reference_type ?? fallback.referenceType,
        referenceTypeLabel: detail.reference_type_label ?? fallback.referenceTypeLabel,
        referenceId: detail.reference_id ?? fallback.referenceId,
        createdAt: detail.created_at ?? fallback.createdAt,
        createdBy: detail.created_by ?? fallback.createdBy,
        readAt: detail.read_at || fallback.readAt,
    };
}
