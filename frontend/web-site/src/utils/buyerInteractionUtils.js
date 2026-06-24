import { interactionService } from "../services/api/Buyer/interactionService";
import { isBuyerUser } from "./buyerAuthUtils";

const LOG_PREFIX = "[buyer-interaction]";
const VIEW_DEBOUNCE_MS = 5 * 60 * 1000;
const VIEW_DEBOUNCE_PREFIX = "gm_interaction_view";

function getViewDebounceKey(dealerSlug, dealerProductId) {
    return `${VIEW_DEBOUNCE_PREFIX}_${dealerSlug}_${dealerProductId}`;
}

function shouldSkipViewDebounce(dealerSlug, dealerProductId) {
    try {
        const raw = sessionStorage.getItem(
            getViewDebounceKey(dealerSlug, dealerProductId),
        );
        if (!raw) return false;
        return Date.now() - Number(raw) < VIEW_DEBOUNCE_MS;
    } catch {
        return false;
    }
}

function markViewRecorded(dealerSlug, dealerProductId) {
    try {
        sessionStorage.setItem(
            getViewDebounceKey(dealerSlug, dealerProductId),
            String(Date.now()),
        );
    } catch {
        // ignore
    }
}

function buildContext(dealerSlug, product, action) {
    return {
        action,
        dealerSlug,
        dealerProductId: product?.id ?? null,
        productName: product?.name ?? null,
    };
}

export function logInteractionNotLoggedIn(action, context = {}) {
    console.warn(`${LOG_PREFIX} Chưa đăng nhập — không ghi điểm`, {
        action,
        reason: "auth_required",
        hint: "Buyer cần đăng nhập cửa hàng để tích lũy điểm quan tâm.",
        ...context,
    });
}

function logInteractionSkipped(action, reason, context = {}) {
    console.info(`${LOG_PREFIX} Bỏ qua ghi điểm`, {
        action,
        reason,
        ...context,
    });
}

function logInteractionSuccess(action, response, context = {}) {
    console.log(`${LOG_PREFIX} Đã tăng điểm / ghi nhận tương tác`, {
        action,
        recorded: response?.recorded ?? null,
        engagement_score: response?.engagement_score ?? null,
        view_count: response?.view_count ?? null,
        add_cart_count: response?.add_cart_count ?? null,
        purchase_count: response?.purchase_count ?? null,
        server_reason: response?.reason ?? null,
        retry_after_seconds: response?.retry_after_seconds ?? null,
        ...context,
    });
}

function logInteractionNoPoints(action, response, context = {}) {
    console.info(`${LOG_PREFIX} Không tăng điểm (server từ chối hoặc debounce)`, {
        action,
        recorded: response?.recorded ?? false,
        server_reason: response?.reason ?? null,
        retry_after_seconds: response?.retry_after_seconds ?? null,
        engagement_score: response?.engagement_score ?? null,
        ...context,
    });
}

function logInteractionError(action, error, context = {}) {
    const status = error?.response?.status ?? null;
    const message =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "Unknown error";

    console.warn(`${LOG_PREFIX} Ghi điểm thất bại`, {
        action,
        status,
        message,
        ...context,
    });
}

function postInteraction(dealerSlug, product, action) {
    const dealerProductId = product?.id;
    const context = buildContext(dealerSlug, product, action);

    if (!dealerSlug || dealerProductId == null) {
        logInteractionSkipped(action, "missing_dealer_or_product", context);
        return Promise.resolve();
    }

    return interactionService
        .interaction(dealerSlug, {
            dealer_product_id: dealerProductId,
            action,
        })
        .then((response) => {
            if (action === "view") {
                markViewRecorded(dealerSlug, dealerProductId);
            }

            if (response?.recorded) {
                logInteractionSuccess(action, response, context);
            } else {
                logInteractionNoPoints(action, response, context);
            }
            return response;
        })
        .catch((error) => {
            logInteractionError(action, error, context);
        });
}

/** Ghi nhận xem chi tiết sản phẩm đại lý (+2 điểm). */
export function recordProductView(dealerSlug, product, user) {
    const context = buildContext(dealerSlug, product, "view");

    if (!isBuyerUser(user)) {
        logInteractionNotLoggedIn("view", context);
        return;
    }

    const dealerProductId = product?.id;
    if (!dealerSlug || dealerProductId == null) {
        logInteractionSkipped("view", "missing_dealer_or_product", context);
        return;
    }

    if (shouldSkipViewDebounce(dealerSlug, dealerProductId)) {
        logInteractionSkipped("view", "client_debounce_5_minutes", context);
        return;
    }

    void postInteraction(dealerSlug, product, "view");
}

/** Ghi nhận thêm giỏ sản phẩm đại lý (+3 điểm). */
export function recordAddToCartInteraction(dealerSlug, product, user) {
    const context = buildContext(dealerSlug, product, "add_cart");

    if (!isBuyerUser(user)) {
        logInteractionNotLoggedIn("add_cart", context);
        return;
    }

    const dealerProductId = product?.id;
    if (!dealerSlug || dealerProductId == null) {
        logInteractionSkipped("add_cart", "missing_dealer_or_product", context);
        return;
    }
    
    void postInteraction(dealerSlug, product, "add_cart");
}
