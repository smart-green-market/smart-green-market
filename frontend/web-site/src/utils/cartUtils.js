import { getProductPrice, normalizeUnitKey } from "./userProductUtils";

export const CART_SESSION_KEY = "gm_user_cart";

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

export function loadCartFromSession() {
    try {
        const raw = sessionStorage.getItem(CART_SESSION_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter(isValidCartItem).map(normalizeCartItem);
    } catch {
        return [];
    }
}

export function saveCartToSession(items) {
    try {
        sessionStorage.setItem(CART_SESSION_KEY, JSON.stringify(items));
    } catch {
        // Bỏ qua khi sessionStorage đầy hoặc không khả dụng.
    }
}
