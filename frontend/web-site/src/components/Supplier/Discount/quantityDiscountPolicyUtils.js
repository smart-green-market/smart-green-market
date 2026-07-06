export const INITIAL_QUANTITY_DISCOUNT_FORM = {
  title: "",
  scope: "all",
  category: "",
  supplier_product: "",
  priority: 0,
  is_active: true,
  tiers: [{ min_quantity: "", discount_type: "percent", discount_value: "" }],
};

export function mapPolicyToFormData(data) {
  return {
    title: data.title || "",
    scope: data.scope || "all",
    category: data.category != null ? String(data.category) : "",
    supplier_product: data.supplier_product != null ? String(data.supplier_product) : "",
    priority: data.priority ?? 0,
    is_active: data.is_active !== false,
    tiers: (data.tiers || []).map((tier) => ({
      min_quantity: tier.min_quantity != null ? String(tier.min_quantity) : "",
      discount_type: tier.discount_type || "percent",
      discount_value: tier.discount_value != null ? String(tier.discount_value) : "",
    })),
  };
}

export function validateQuantityDiscountForm(formData) {
  if (!formData.title?.trim()) return "Vui lòng nhập tên chính sách";
  if (formData.scope === "category" && !formData.category) return "Vui lòng chọn danh mục";
  if (formData.scope === "supplier_product" && !formData.supplier_product) {
    return "Vui lòng chọn sản phẩm";
  }
  if (!formData.tiers?.length) return "Cần ít nhất một bậc giảm giá";

  const minQuantities = new Set();
  for (let i = 0; i < formData.tiers.length; i++) {
    const tier = formData.tiers[i];
    const minQty = parseFloat(tier.min_quantity);
    const discountValue = parseFloat(tier.discount_value);

    if (!minQty || minQty <= 0) return `Bậc ${i + 1}: số lượng tối thiểu phải lớn hơn 0`;
    if (!discountValue || discountValue <= 0) return `Bậc ${i + 1}: mức giảm phải lớn hơn 0`;
    if (tier.discount_type === "percent" && discountValue > 100) {
      return `Bậc ${i + 1}: phần trăm giảm không vượt quá 100%`;
    }
    if (minQuantities.has(minQty)) return "Các bậc không được trùng số lượng tối thiểu";
    minQuantities.add(minQty);
  }
  return null;
}

export function buildQuantityDiscountPayload(formData) {
  const payload = {
    title: formData.title.trim(),
    scope: formData.scope,
    priority: parseInt(formData.priority, 10) || 0,
    is_active: formData.is_active,
    start_at: null,
    end_at: null,
    category: null,
    supplier_product: null,
    tiers: formData.tiers.map((tier) => ({
      min_quantity: tier.min_quantity,
      discount_type: tier.discount_type,
      discount_value: tier.discount_value,
    })),
  };

  if (formData.scope === "category") {
    payload.category = parseInt(formData.category, 10);
  } else if (formData.scope === "supplier_product") {
    payload.supplier_product = parseInt(formData.supplier_product, 10);
  }

  return payload;
}

export function handleQuantityScopeChange(prev, nextScope) {
  return {
    ...prev,
    scope: nextScope,
    category: nextScope === "category" ? prev.category : "",
    supplier_product: nextScope === "supplier_product" ? prev.supplier_product : "",
  };
}
