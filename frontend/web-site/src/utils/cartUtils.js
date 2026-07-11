import { getStoredDealerSlug } from "./buyerAuthUtils";
import {
  getProductPrice,
  isProductInStock,
  normalizeUnitKey,
} from "./userProductUtils";

export const CART_SESSION_PREFIX = "gm_cart";

export function getBuyerCartId(user) {
  if (!user) return null;
  if (user.role !== "buyer" && user.auth_scope !== "storefront") return null;
  return user.id ?? user.buyer_id ?? user.account_id ?? null;
}

export function getCartSessionKey(dealerSlug, buyerId) {
  const slug = String(dealerSlug || getStoredDealerSlug() || "default").trim();
  const owner = buyerId != null ? String(buyerId) : "guest";
  return `${CART_SESSION_PREFIX}_${slug}_${owner}`;
}

export function resolveCartOwner(user, dealerSlug) {
  const slug = dealerSlug || getStoredDealerSlug() || "";
  const buyerId = getBuyerCartId(user);
  return {
    slug,
    buyerId,
    key: getCartSessionKey(slug, buyerId),
  };
}

export function getCartItemAvailableQuantity(item) {
  const raw = item?.availableQuantity ?? item?.available_quantity;
  if (raw == null || raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/** @deprecated Dùng getCartItemAvailableQuantity — giữ để hiển thị tồn khi > 0. */
export function getCartItemMaxQuantity(item) {
  const available = getCartItemAvailableQuantity(item);
  return available != null && available > 0 ? available : null;
}

export function isCartItemOutOfStock(item) {
  if (typeof item?.inStock === "boolean") {
    return !item.inStock;
  }

  const available = getCartItemAvailableQuantity(item);
  return available != null && available <= 0;
}

/** Mục giỏ hàng hết tồn — checkout sẽ đi luồng đặt trước. */
export function isCartItemPreorderOnly(item) {
  return isCartItemOutOfStock(item);
}

export function cartItemExceedsStock(item) {
  if (isCartItemOutOfStock(item)) {
    return Number(item.quantity) >= 1;
  }

  const available = getCartItemAvailableQuantity(item);
  if (available == null || available <= 0) return false;
  return Number(item.quantity) > available;
}

export function normalizeCartQuantity(value, maxQuantity = null) {
  const parsed = Number.parseInt(String(value).replace(/\D/g, ""), 10);
  let next = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
  if (maxQuantity != null && maxQuantity > 0) {
    next = Math.min(next, maxQuantity);
  }
  return next;
}

export function buildCartItemFromProduct(product, quantity = 1) {
  const price = Number(getProductPrice(product) ?? product.priceValue ?? 0);
  const rawUnit = product.unitKey ?? product.unit ?? "";
  const unit =
    normalizeUnitKey(String(rawUnit).replace(/^\//, "")) ||
    String(rawUnit).replace(/^\//, "") ||
    "kg";

  const image =
    product.image ??
    product.thumbnail ??
    product.images?.[0]?.image_url ??
    "https://placehold.co/160x160";

  const inStock = isProductInStock(product);
  const availableQuantity =
    product.available_quantity ?? product.availableQuantity ?? null;
  const parsedAvailable =
    availableQuantity != null && availableQuantity !== ""
      ? Number(availableQuantity)
      : null;
  const effectiveAvailable = inStock
    ? Number.isFinite(parsedAvailable)
      ? parsedAvailable
      : null
    : 0;

  return {
    id: product.id,
    name: product.name ?? product.title ?? "",
    price,
    unit,
    quantity: normalizeCartQuantity(quantity),
    selected: true,
    image,
    inStock,
    availableQuantity: effectiveAvailable,
  };
}

function isValidCartItem(item) {
  return (
    item &&
    item.id != null &&
    typeof item.name === "string" &&
    Number.isFinite(Number(item.price)) &&
    Number(item.quantity) >= 1
  );
}

function normalizeCartItem(item) {
  const rawAvailable = getCartItemAvailableQuantity(item);
  const inStock =
    typeof item.inStock === "boolean"
      ? item.inStock
      : typeof item.in_stock === "boolean"
        ? item.in_stock
        : rawAvailable == null || rawAvailable > 0;
  const availableQuantity = inStock ? rawAvailable : 0;

  return {
    id: item.id,
    name: item.name,
    price: Number(item.price),
    unit: item.unit ?? "kg",
    quantity: normalizeCartQuantity(item.quantity),
    selected: item.selected !== false,
    image: item.image ?? "https://placehold.co/160x160",
    inStock,
    availableQuantity,
  };
}

export function loadCartFromSession(dealerSlug, buyerId) {
  try {
    const key = getCartSessionKey(dealerSlug, buyerId);
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidCartItem).map(normalizeCartItem);
  } catch {
    return [];
  }
}

export function saveCartToSession(items, dealerSlug, buyerId) {
  try {
    const key = getCartSessionKey(dealerSlug, buyerId);
    sessionStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Bỏ qua khi sessionStorage đầy hoặc không khả dụng.
  }
}

export function clearCartSession(dealerSlug, buyerId) {
  try {
    const key = getCartSessionKey(dealerSlug, buyerId);
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
