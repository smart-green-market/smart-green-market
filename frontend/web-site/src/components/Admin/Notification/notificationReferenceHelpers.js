import { categoryService } from "../../../services/api/categoryService";
import { productService } from "../../../services/api/productService";
import { supplierService } from "../../../services/api/suppilerService";
import { supplierDocumentService } from "../../../services/api/supplierDocumentService";
import { certificationService } from "../../../services/api/certificationService";

export const SUPPORTED_REFERENCE_TYPES = [
    "category",
    "supplier",
    "supplier_product",
    "supplier_document",
    "certification",
];

const REFERENCE_TYPE_ALIASES = {
    supplier_category: "category",
};

export function normalizeReferenceType(referenceType) {
    return REFERENCE_TYPE_ALIASES[referenceType] || referenceType;
}

export function isSupportedReferenceType(referenceType) {
    return SUPPORTED_REFERENCE_TYPES.includes(normalizeReferenceType(referenceType));
}

function normalizeListResponse(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    return [];
}

function getReferenceErrorMessage(error, entityLabel) {
    const status = error?.response?.status;

    if (status === 404) {
        return `${entityLabel} không tồn tại hoặc đã bị xóa.`;
    }

    if (status === 403) {
        return `Bạn không có quyền xem ${entityLabel} này.`;
    }

    return (
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        `Không thể tải ${entityLabel}.`
    );
}

async function fetchWithListFallback({ getById, getAll, id, format, entityLabel }) {
    try {
        const detail = await getById(id);
        return format(detail);
    } catch (error) {
        if (error?.response?.status !== 404 || !getAll) {
            throw error;
        }

        const list = normalizeListResponse(await getAll());
        const found = list.find((item) => String(item.id) === String(id));

        if (!found) {
            throw error;
        }

        return format(found);
    }
}

const formatCategory = (detail) => ({
    id: detail.id,
    status: detail.status,
    name: detail.name,
    description: detail.description ?? "",
    created_at: detail.created_at,
    verified_at: detail.updated_at ?? detail.verified_at,
});

const formatProduct = (detail) => ({
    id: detail.id,
    name: detail.name,
    slug: detail.slug,
    unit: detail.unit,
    description: detail.description,
    storage_duration_days: detail.storage_duration_days,
    min_storage_temp: detail.min_storage_temp,
    max_storage_temp: detail.max_storage_temp,
    status: detail.status,
    rejection_reason: detail.rejection_reason,
    verified_by: detail.verified_by,
    verified_by_username: detail.verified_by_username,
    verified_at: detail.verified_at,
    created_at: detail.created_at,
    updated_at: detail.updated_at,
    images: detail.images ?? [],
    image:
        detail.images?.find((item) => item.is_thumbnail)?.image_url ??
        detail.images?.[0]?.image_url,
    supplier: detail.supplier,
    supplier_name: detail.supplier?.company_name,
    category_name: detail.category?.name,
});

const formatSupplier = (detail) => ({
    id: detail.id,
    company_name: detail.company_name,
    address: detail.address,
    phone: detail.phone,
    tax_code: detail.tax_code,
    description: detail.description,
    verification_status: detail.verification_status,
    created_at: detail.created_at,
    updated_at: detail.updated_at,
    verified_at: detail.verified_at,
    full_name: detail.account?.full_name,
    email: detail.account?.email,
    avatar: detail.account?.avatar_url,
});

const formatDocument = (detail) => ({
    id: detail.id,
    file_url: detail.file_url,
    image: detail.file_url,
    document_type: detail.document_type,
    status: detail.status,
    verified_at: detail.verified_at,
    created_at: detail.created_at,
    supplier: detail.supplier,
    verified_by: detail.verified_by,
});

const formatCertification = (detail) => ({
    id: detail.id,
    code: detail.certificate_code,
    name: detail.name,
    issuedBy: detail.issued_by,
    issueDate: detail.issue_date,
    expiryDate: detail.expiry_date,
    description: detail.description,
    images: detail.images || [],
    status: detail.status,
    verifiedAt: detail.verified_at,
    rejectionReason: detail.rejection_reason,
    createdAt: detail.created_at,
    updatedAt: detail.updated_at,
    supplier: detail.supplier,
});

const REFERENCE_FETCHERS = {
    category: {
        entityLabel: "Danh mục",
        getById: (id) => categoryService.getById(id),
        getAll: () => categoryService.getAll(),
        format: formatCategory,
        type: "category",
    },
    supplier_product: {
        entityLabel: "Sản phẩm",
        getById: (id) => productService.getById(id),
        getAll: () => productService.getAll(),
        format: formatProduct,
        type: "supplier_product",
    },
    supplier: {
        entityLabel: "Nhà cung cấp",
        getById: (id) => supplierService.getById(id),
        getAll: () => supplierService.getAll(),
        format: formatSupplier,
        type: "supplier",
    },
    supplier_document: {
        entityLabel: "Giấy tờ",
        getById: (id) => supplierDocumentService.getById(id),
        getAll: () => supplierDocumentService.getAll(),
        format: formatDocument,
        type: "supplier_document",
    },
    certification: {
        entityLabel: "Chứng chỉ",
        getById: (id) => certificationService.getById(id),
        getAll: () => certificationService.getAll(),
        format: formatCertification,
        type: "certification",
    },
};

export async function fetchNotificationReference(referenceType, referenceId) {
    const normalizedType = normalizeReferenceType(referenceType);

    if (!normalizedType || referenceId == null || referenceId === "") {
        throw new Error("Thông báo không có đối tượng tham chiếu.");
    }

    const config = REFERENCE_FETCHERS[normalizedType];

    if (!config) {
        throw new Error("Loại đối tượng thông báo chưa được hỗ trợ.");
    }

    try {
        const data = await fetchWithListFallback({
            ...config,
            id: referenceId,
        });

        return {
            type: config.type,
            data,
        };
    } catch (error) {
        if (error?.response?.status && error.response.status !== 404) {
            console.error("Notification reference fetch failed:", error);
        }

        throw new Error(getReferenceErrorMessage(error, config.entityLabel));
    }
}
