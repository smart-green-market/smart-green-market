import { getProductPrice, toCardProduct } from "./userProductUtils";

/** Thời gian lưu sản phẩm đã xem — có thể chỉnh (ms). Mặc định: 30 phút */
export const RECENTLY_VIEWED_TTL_MS = 30 * 60 * 1000;

export const RECENTLY_VIEWED_MAX_ITEMS = 12;

export const RECENTLY_VIEWED_UPDATED_EVENT = "gm-recently-viewed-updated";

const STORAGE_PREFIX = "gm_recently_viewed";

function getStorageKey(dealerSlug) {
    const slug = String(dealerSlug || "default").trim() || "default";
    return `${STORAGE_PREFIX}_${slug}`;
}

function readRawEntries(dealerSlug) {
    try {
        const raw = localStorage.getItem(getStorageKey(dealerSlug));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeRawEntries(dealerSlug, entries) {
    localStorage.setItem(getStorageKey(dealerSlug), JSON.stringify(entries));
}

function pruneExpired(entries, now = Date.now()) {
    return entries.filter(
        (item) =>
            item?.viewedAt != null &&
            now - Number(item.viewedAt) < RECENTLY_VIEWED_TTL_MS,
    );
}

function notifyUpdated() {
    window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_UPDATED_EVENT));
}

export function buildRecentlyViewedEntry(product) {
    const card = toCardProduct(product);

    return {
        id: card.id,
        name: card.name,
        price: card.price,
        unit: card.unit,
        image: card.image,
        priceValue: card.priceValue,
        unitKey: card.unitKey,
        viewedAt: Date.now(),
    };
}

export function getRecentlyViewed(dealerSlug) {
    const now = Date.now();
    const valid = pruneExpired(readRawEntries(dealerSlug), now);

    if (valid.length !== readRawEntries(dealerSlug).length) {
        writeRawEntries(dealerSlug, valid);
    }

    return [...valid].sort(
        (a, b) => Number(b.viewedAt || 0) - Number(a.viewedAt || 0),
    );
}

export function addRecentlyViewed(dealerSlug, product) {
    if (!dealerSlug || !product?.id) return;

    const entry = buildRecentlyViewedEntry(product);
    const now = Date.now();
    const existing = pruneExpired(readRawEntries(dealerSlug), now).filter(
        (item) => String(item.id) !== String(entry.id),
    );

    const next = [entry, ...existing].slice(0, RECENTLY_VIEWED_MAX_ITEMS);
    writeRawEntries(dealerSlug, next);
    notifyUpdated();
}

export function clearRecentlyViewed(dealerSlug) {
    localStorage.removeItem(getStorageKey(dealerSlug));
    notifyUpdated();
}

/** Dùng khi cần hiển thị giá từ snapshot đã lưu */
export function getRecentlyViewedPrice(entry) {
    return Number(entry?.priceValue ?? getProductPrice(entry) ?? 0);
}
