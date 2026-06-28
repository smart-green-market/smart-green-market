export const CATEGORY_SCOPE = {
  SYSTEM: "system",
  CUSTOM: "custom",
};

const CATEGORY_STATUS_FILTERS = ["active", "rejected", "pending", "inactive"];
const CATEGORY_SCOPE_FILTERS = ["system", "custom"];

export function buildCategoryListParams(statusFilter) {
  if (!statusFilter) return {};

  if (CATEGORY_STATUS_FILTERS.includes(statusFilter)) {
    return { status: statusFilter };
  }

  if (CATEGORY_SCOPE_FILTERS.includes(statusFilter)) {
    return { scope: statusFilter };
  }

  return {};
}

export const SCOPE_LABELS = {
  system: "Hệ thống",
  custom: "Người dùng đăng ký",
};

export function formatCategoryRow(category) {
  return {
    id: category.id,
    name: category.name,
    scope: category.scope ?? CATEGORY_SCOPE.CUSTOM,
    status: category.status,
    product_count: category.product_count ?? 0,
    sort_order: category.sort_order ?? 0,
    created_at: category.created_at,
    updated_at: category.updated_at,
  };
}

export function formatCategoryDetail(detail) {
  return {
    id: detail.id,
    name: detail.name ?? "",
    description: detail.description ?? "",
    scope: detail.scope ?? CATEGORY_SCOPE.CUSTOM,
    status: detail.status,
    sort_order: detail.sort_order ?? 0,
    created_at: detail.created_at,
    verified_at: detail.verified_at ?? detail.updated_at,
    updated_at: detail.updated_at,
    rejection_reason: detail.rejection_reason ?? "",
    created_by: detail.created_by ?? null,
    product_count: detail.product_count ?? 0,
  };
}

export function buildSystemCategoryPayload({ name, description, sort_order }) {
  return {
    scope: CATEGORY_SCOPE.SYSTEM,
    name: name.trim(),
    description: description.trim(),
    sort_order: Number(sort_order) || 0,
  };
}

export function getScopeLabel(scope) {
  return SCOPE_LABELS[scope] ?? scope ?? "—";
}
