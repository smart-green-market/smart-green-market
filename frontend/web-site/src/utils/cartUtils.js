import { getStoredDealerSlug } from "./buyerAuthUtils";
import { getProductPrice, normalizeUnitKey } from "./userProductUtils";

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

    return {
        id: product.id,
        name: product.name ?? product.title ?? "",
        price,
        unit,
        quantity: Math.max(1, quantity),
        selected: true,
        image,
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
    return {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        unit: item.unit ?? "kg",
        quantity: Math.max(1, Number(item.quantity)),
        selected: item.selected !== false,
        image: item.image ?? "https://placehold.co/160x160",
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
