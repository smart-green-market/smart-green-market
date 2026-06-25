import { authService } from "../../../services/api/authAdminService";
import { clearAuthStorage, saveAuthTokens } from "../../../services/token/authTokenStorage";
import { accountDocumentService } from "../../../services/api/accountDocumentService";
import { dealerService } from "../../../services/api/dealerService";

const REQUIRED_DOC_TYPES = [
    "id_card",
    "business_license",
    "tax_certificate",
];

function fieldText(value) {
    if (Array.isArray(value)) return value.join(" ");
    if (typeof value === "string") return value;
    return "";
}

export function isAccountExistsError(error) {
    const data = error?.response?.data;

    if (!data || typeof data !== "object") {
        return false;
    }

    const usernameMsg = fieldText(data.username).toLowerCase();
    const emailMsg = fieldText(data.email).toLowerCase();

    return (
        usernameMsg.includes("already exists") ||
        emailMsg.includes("already exists") ||
        usernameMsg.includes("đã tồn tại") ||
        emailMsg.includes("đã tồn tại")
    );
}

function buildProfileDraft(profile) {
    return {
        store_name: profile?.store_name?.trim() || "",
        store_address: profile?.store_address?.trim() || "",
        description: profile?.description?.trim() || "",
    };
}

function isStoreInfoComplete(profileDraft) {
    return (
        profileDraft.store_name &&
        profileDraft.store_address &&
        profileDraft.description
    );
}

function getMissingDocTypes(documents = []) {
    const uploaded = new Set(documents.map((doc) => doc.document_type));
    return REQUIRED_DOC_TYPES.filter((type) => !uploaded.has(type));
}

export async function attemptResumeDealerRegistration(username, password) {
    clearAuthStorage();

    let loginResult;

    try {
        loginResult = await authService.login({
            username: username.trim(),
            password,
        });
    } catch {
        throw new Error("Tài khoản đã tồn tại. Vui lòng kiểm tra mật khẩu.");
    }

    if (!loginResult?.access) {
        throw new Error("Tài khoản đã tồn tại. Vui lòng kiểm tra mật khẩu.");
    }

    if (loginResult.account?.role !== "dealer") {
        throw new Error("Tài khoản này không phải đại lý.");
    }

    saveAuthTokens({
        access: loginResult.access,
        refresh: loginResult.refresh,
    });
    localStorage.setItem("user", JSON.stringify(loginResult.account));

    let profile = null;

    try {
        profile = await dealerService.resolveMyProfile();
    } catch {
        profile = null;
    }

    let documents = [];

    try {
        documents = (await accountDocumentService.getAll()) ?? [];
    } catch {
        documents = [];
    }

    const profileDraft = buildProfileDraft(profile);
    const missingDocs = getMissingDocTypes(documents);
    const storeComplete = isStoreInfoComplete(profileDraft);

    if (storeComplete && missingDocs.length === 0) {
        clearAuthStorage();
        throw new Error(
            "Đăng ký đại lý đã hoàn tất. Vui lòng đăng nhập để sử dụng hệ thống.",
        );
    }

    return {
        profileDraft,
        resumeMessage:
            "Tài khoản đã tồn tại. Vui lòng tiếp tục cập nhật thông tin đăng ký.",
        initialStep: storeComplete ? 2 : 1,
    };
}
