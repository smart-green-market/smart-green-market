import { categoryService } from "../../../services/api/categoryService";
import { productService } from "../../../services/api/productService";
import { supplierService } from "../../../services/api/suppilerService";
import { accountDocumentService } from "../../../services/api/accountDocumentService";
import { certificationService } from "../../../services/api/certificationService";
import { normalizeReferenceType } from "./notificationReferenceHelpers";

async function runWithLoading(setActionLoading, action) {
    try {
        setActionLoading?.(true);
        await action();
    } finally {
        setActionLoading?.(false);
    }
}

function wrapAction(setActionLoading, onUpdated, action) {
    return async (...args) => {
        await runWithLoading(setActionLoading, async () => {
            await action(...args);
            await onUpdated?.();
        });
    };
}

const ACTION_BUILDERS = {
    category: (wrap) => ({
        onApprove: wrap(async (category) => {
            await categoryService.verify(category.id, {
                status: "active",
                rejection_reason: "",
            });
        }),
        onReject: wrap(async (category, rejectionReason) => {
            await categoryService.verify(category.id, {
                status: "rejected",
                rejection_reason: rejectionReason,
            });
        }),
        onLock: wrap(async (category) => {
            await categoryService.lock(category.id, {
                status: "inactive",
                rejection_reason: "Không hợp lệ",
            });
        }),
        onUnlock: wrap(async (category) => {
            await categoryService.unlock(category.id, {
                status: "active",
            });
        }),
    }),
    supplier_product: (wrap) => ({
        onApprove: wrap(async (product) => {
            await productService.verify(product.id, { status: "active" });
        }),
        onReject: wrap(async (product, rejectionReason) => {
            await productService.verify(product.id, {
                status: "rejected",
                rejection_reason: rejectionReason,
            });
        }),
        onPause: wrap(async (product) => {
            await productService.verify(product.id, { status: "inactive" });
        }),
    }),
    supplier: (wrap) => ({
        onApprove: wrap(async (supplier) => {
            await supplierService.verify(supplier.id, {
                verification_status: "approved",
            });
        }),
        onReject: wrap(async (supplier, rejectionReason) => {
            await supplierService.verify(supplier.id, {
                verification_status: "rejected",
                rejection_reason: rejectionReason,
            });
        }),
    }),
    account_document: (wrap) => ({
        onApprove: wrap(async (document) => {
            await accountDocumentService.verify(document.id, "approved");
        }),
        onReject: wrap(async (document, rejectionReason) => {
            await accountDocumentService.verify(document.id, {
                status: "rejected",
                rejection_reason: rejectionReason,
            });
        }),
    }),
    certification: (wrap) => ({
        onApprove: wrap(async (certification) => {
            await certificationService.verify(certification.id, {
                status: "approved",
                rejection_reason: "",
            });
        }),
        onReject: wrap(async (certification, rejectionReason) => {
            await certificationService.verify(certification.id, {
                status: "rejected",
                rejection_reason: rejectionReason,
            });
        }),
    }),
};

export function createNotificationReferenceActions(
    referenceType,
    onUpdated,
    setActionLoading,
) {
    const normalizedType = normalizeReferenceType(referenceType);
    const builder = ACTION_BUILDERS[normalizedType];

    if (!builder) {
        return {};
    }

    const wrap = (action) => wrapAction(setActionLoading, onUpdated, action);
    return builder(wrap);
}
