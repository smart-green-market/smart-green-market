import {
  parseSupplierApiErrors,
  extractSupplierApiMessage,
  validateCultivationForm,
} from "../../../utils/supplierValidation";

export const ACTIVE_PRODUCT_STATUS = "active";

export { validateCultivationForm };

export function parseProductList(response) {
  return Array.isArray(response) ? response : (response?.results || []);
}

export function getActiveProducts(products) {
  return products.filter((p) => p.status === ACTIVE_PRODUCT_STATUS);
}

export function parseCultivationList(response) {
  const list = Array.isArray(response) ? response : (response?.results || []);
  return list.map(normalizeCultivationRow);
}

export function normalizeCultivationRow(item) {
  const sp = item.supplier_product;
  const productId = typeof sp === "object" ? sp?.id : sp;
  const productName =
    item.product_name ??
    item.supplier_product_name ??
    (typeof sp === "object" ? sp?.name : null);

  return {
    ...item,
    supplier_product: productId,
    product_name: productName,
  };
}

export function mergeCurrentProduct(activeList, allList, currentId) {
  if (currentId == null) return activeList;
  const id = Number(currentId);
  if (activeList.some((p) => p.id === id)) return activeList;
  const current = allList.find((p) => p.id === id);
  return current ? [...activeList, current] : activeList;
}

export function parseFieldErrors(apiErrors) {
  return parseSupplierApiErrors(apiErrors, {
    fallback: "Lưu quy trình thất bại. Vui lòng kiểm tra lại thông tin.",
  });
}

export function handleApiError(error, defaultMessage = "Có lỗi xảy ra") {
  return extractSupplierApiMessage(error, defaultMessage);
}
