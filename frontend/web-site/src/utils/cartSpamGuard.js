const SPAM_WINDOW_MS = 3000;
const SPAM_BLOCK_MS = 5000;
const PRODUCT_DUPLICATE_LIMIT = 3;
const GLOBAL_ATTEMPT_LIMIT = 10;

const state = {
    products: new Map(),
    global: { count: 0, windowStart: 0, blockedUntil: 0 },
};

function resetWindow(entry, now) {
    entry.count = 0;
    entry.windowStart = now;
    entry.toastShown = false;
}

export function resetCartSpamGuard() {
    state.products.clear();
    state.global = { count: 0, windowStart: 0, blockedUntil: 0 };
}

export function registerDuplicateAddAttempt(productId) {
    const now = Date.now();
    const id = String(productId);

    if (now < state.global.blockedUntil) {
        return { added: false, reason: "spam", showToast: false };
    }

    if (
        !state.global.windowStart ||
        now - state.global.windowStart > SPAM_WINDOW_MS
    ) {
        state.global.count = 0;
        state.global.windowStart = now;
    }
    state.global.count += 1;

    let entry = state.products.get(id);
    if (!entry || now - entry.windowStart > SPAM_WINDOW_MS) {
        entry = { count: 0, windowStart: now, toastShown: false };
    }
    entry.count += 1;
    state.products.set(id, entry);

    const isSpam =
        entry.count >= PRODUCT_DUPLICATE_LIMIT ||
        state.global.count >= GLOBAL_ATTEMPT_LIMIT;

    if (isSpam) {
        state.global.blockedUntil = now + SPAM_BLOCK_MS;
        return { added: false, reason: "spam", showToast: true };
    }

    if (entry.toastShown) {
        return { added: false, reason: "already_in_cart", showToast: false };
    }

    entry.toastShown = true;
    return { added: false, reason: "already_in_cart", showToast: true };
}

export function clearProductSpamEntry(productId) {
    state.products.delete(String(productId));
}
