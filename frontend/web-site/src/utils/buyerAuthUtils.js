import { authBuyerService } from "../services/api/Buyer/authBuyerService";
import { saveAuthTokens, clearAuthStorage } from "../services/token/authTokenStorage";
import { extractApiError } from "./extractApiError";

export const STORE_DEALER_SLUG_KEY = "store_dealer_slug";

export function getStoredDealerSlug() {
    return localStorage.getItem(STORE_DEALER_SLUG_KEY) || "";
}

export function normalizeDealerSlugInput(input) {
    if (!input || typeof input !== "string") return "";

    let value = input.trim();
    if (!value) return "";

    if (/^https?:\/\//i.test(value)) {
        try {
            value = new URL(value).pathname;
        } catch {
            return "";
        }
    }

    const pathMatch = value.match(/(?:^|\/)cua-hang\/([^/?#]+)/i);
    if (pathMatch?.[1]) {
        return decodeURIComponent(pathMatch[1]).trim();
    }

    value = value.replace(/^\/+|\/+$/g, "");
    const firstSegment = value.split("/")[0] ?? "";
    return decodeURIComponent(firstSegment).trim();
}

export function saveBuyerSession(response, dealerSlug) {
    saveAuthTokens({
        access: response.access,
        refresh: response.refresh,
    });

    localStorage.setItem(STORE_DEALER_SLUG_KEY, dealerSlug);

    const account = response.account || response.buyer || {};
    const user = {
        ...account,
        role: account.role || "buyer",
        auth_scope: response.auth_scope || "storefront",
        store_dealer_slug: dealerSlug,
        store_dealer_id: response.store_dealer_id ?? account.store_dealer_id,
    };

    localStorage.setItem("user", JSON.stringify(user));
    return user;
}

export async function loginBuyer(dealerSlug, { email, password }) {
    const slug = dealerSlug?.trim();

    if (!slug) {
        return { success: false, message: "Liên kết cửa hàng không hợp lệ." };
    }

    if (!email?.trim() || !password) {
        return { success: false, message: "Vui lòng nhập email và mật khẩu." };
    }

    try {
        const response = await authBuyerService.login(slug, {
            email: email.trim(),
            password,
        });

        if (!response?.access) {
            return { success: false, message: "API không trả về access token" };
        }

        const user = saveBuyerSession(response, slug);
        return { success: true, user };
    } catch (error) {
        return {
            success: false,
            message: extractApiError(error, "Đăng nhập thất bại"),
        };
    }
}

export async function registerBuyer(dealerSlug, form) {
    const slug = dealerSlug?.trim();

    if (!slug) {
        return { success: false, message: "Liên kết cửa hàng không hợp lệ." };
    }

    if (!form.full_name?.trim()) {
        return { success: false, message: "Vui lòng nhập họ tên." };
    }

    if (!form.email?.trim()) {
        return { success: false, message: "Vui lòng nhập email." };
    }

    if (!form.phone?.trim()) {
        return { success: false, message: "Vui lòng nhập số điện thoại." };
    }

    if (!form.password) {
        return { success: false, message: "Vui lòng nhập mật khẩu." };
    }

    if (form.password !== form.repassword) {
        return { success: false, message: "Mật khẩu xác nhận không khớp." };
    }

    try {
        const response = await authBuyerService.register(slug, {
            email: form.email.trim(),
            password: form.password,
            repassword: form.repassword,
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
        });

        if (!response?.access) {
            return { success: false, message: "API không trả về access token" };
        }

        const user = saveBuyerSession(response, slug);
        return { success: true, user };
    } catch (error) {
        return {
            success: false,
            message: extractApiError(error, "Đăng ký thất bại"),
        };
    }
}

export function clearBuyerAuth() {
    clearAuthStorage();
}

export async function logoutBuyer() {
    try {
        await authBuyerService.logout();
    } catch (error) {
        console.error("Lỗi khi logout buyer:", error);
    } finally {
        clearBuyerAuth();
    }
}
