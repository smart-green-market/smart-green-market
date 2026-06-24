export const PRODUCT_MASTER_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
};

export function extractProductMasterList(response) {
    if (Array.isArray(response)) return response;
    if (!response?.results) return [];

    const first = response.results[0];
    if (first?.results) {
        return response.results.flatMap((page) => page.results ?? []);
    }

    return response.results;
}

export function formatProductMasterRow(item) {
    return {
        id: item.id,
        name: item.name ?? "",
        slug: item.slug ?? "",
        default_unit: item.default_unit ?? "",
        description: item.description ?? "",
        status: item.status ?? PRODUCT_MASTER_STATUS.ACTIVE,
        sort_order: item.sort_order ?? 0,
        category_id: item.category?.id ?? null,
        category_name: item.category?.name ?? "—",
        category_scope: item.category?.scope ?? "",
    };
}

export function formatProductMasterDetail(detail) {
    return {
        id: detail.id,
        name: detail.name ?? "",
        slug: detail.slug ?? "",
        default_unit: detail.default_unit ?? "",
        description: detail.description ?? "",
        status: detail.status ?? PRODUCT_MASTER_STATUS.ACTIVE,
        sort_order: detail.sort_order ?? 0,
        category_id: detail.category?.id ?? null,
        category_name: detail.category?.name ?? "—",
        category: detail.category ?? null,
    };
}

export function buildProductMasterPayload({
    category_id,
    name,
    default_unit,
    description,
    sort_order,
    status,
}) {
    const payload = {
        category: Number(category_id),
        name: name.trim(),
        default_unit: default_unit.trim(),
        description: description.trim(),
        sort_order: Number(sort_order) || 0,
    };

    if (status) {
        payload.status = status;
    }

    return payload;
}
