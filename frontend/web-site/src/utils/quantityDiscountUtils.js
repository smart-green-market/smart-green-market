export const QUANTITY_DISCOUNT_SCOPE_LABELS = {
  all: "Tất cả sản phẩm",
  category: "Theo danh mục",
  supplier_product: "Sản phẩm cụ thể",
};

export const QUANTITY_DISCOUNT_TYPE_LABELS = {
  percent: "Giảm theo %",
  fixed: "Giảm cố định",
};

export function formatTierLabel(tier) {
  if (!tier) return "";
  const qty = parseFloat(tier.min_quantity || 0);
  if (tier.discount_type === "percent") {
    return `Từ ${qty} → giảm ${parseFloat(tier.discount_value)}%`;
  }
  return `Từ ${qty} → giảm ${parseFloat(tier.discount_value).toLocaleString("vi-VN")}đ`;
}

export function computeDiscountedUnitPrice(basePrice, quantity, tiers = []) {
  const base = Number(basePrice) || 0;
  const qty = Number(quantity) || 0;
  if (!base || !qty || !tiers?.length) {
    return {
      unitPrice: base,
      basePrice: base,
      discountPerUnit: 0,
      tier: null,
    };
  }

  const applicable = tiers
    .filter((t) => qty >= parseFloat(t.min_quantity))
    .sort((a, b) => parseFloat(b.min_quantity) - parseFloat(a.min_quantity));

  const tier = applicable[0];
  if (!tier) {
    return {
      unitPrice: base,
      basePrice: base,
      discountPerUnit: 0,
      tier: null,
    };
  }

  let unitPrice = base;
  if (tier.discount_type === "percent") {
    unitPrice = base * (1 - parseFloat(tier.discount_value) / 100);
  } else {
    unitPrice = Math.max(base - parseFloat(tier.discount_value), 0);
  }

  unitPrice = Math.round(unitPrice);
  return {
    unitPrice,
    basePrice: base,
    discountPerUnit: base - unitPrice,
    tier,
  };
}

export function formatQuantityDiscountApiError(error) {
  const errData = error?.response?.data;
  if (!errData) return "Đã xảy ra lỗi. Vui lòng thử lại.";
  if (typeof errData === "string") return errData;
  if (errData.detail) return String(errData.detail);
  if (typeof errData === "object") {
    return Object.entries(errData)
      .map(([key, val]) => {
        const message = Array.isArray(val) ? val.join(", ") : String(val);
        return `${key}: ${message}`;
      })
      .join("\n");
  }
  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}

export function formatAppliedTierLabel(tier, unit = "") {
  if (!tier) return "";
  if (tier.discount_type === "percent") {
    return `Giảm ${parseFloat(tier.discount_value)}%`;
  }
  return `Giảm ${parseFloat(tier.discount_value).toLocaleString("vi-VN")}đ/${unit || "đơn vị"}`;
}

export function formatOrderItemDiscountLabel(item, unit = "") {
  if (!item) return "";
  if (item.discount_label) return item.discount_label;
  const discountType = item.discount_type;
  const discountValue = item.discount_value;
  if (!discountType || discountValue == null) return "";
  const minQty = item.discount_min_quantity;
  const qtyText =
    minQty != null
      ? ` từ ${Number(minQty).toLocaleString("vi-VN")} ${unit}`.trim()
      : "";
  if (discountType === "percent") {
    return `Giảm ${parseFloat(discountValue)}%${qtyText}`;
  }
  return `Giảm ${Number(discountValue).toLocaleString("vi-VN")}đ${qtyText}`;
}

export function getOrderItemLineDiscount(item) {
  if (!item) return 0;
  if (item.line_discount_amount != null) return Number(item.line_discount_amount) || 0;
  if (item.discount_amount != null) return Number(item.discount_amount) || 0;
  const base = Number(item.base_unit_price ?? item.base_price ?? 0);
  const unit = Number(item.unit_price ?? item.price ?? 0);
  const qty = Number(item.quantity ?? 0);
  if (!base || !unit || base <= unit) return 0;
  return (base - unit) * qty;
}

export function getOrderItemBaseUnitPrice(item) {
  if (!item) return 0;
  return Number(item.base_unit_price ?? item.base_price ?? item.unit_price ?? item.price ?? 0);
}

export function getOrderItemUnitPrice(item) {
  if (!item) return 0;
  return Number(item.unit_price ?? item.price ?? 0);
}

export function orderItemHasDiscount(item) {
  return Boolean(item?.has_quantity_discount) || getOrderItemLineDiscount(item) > 0;
}
