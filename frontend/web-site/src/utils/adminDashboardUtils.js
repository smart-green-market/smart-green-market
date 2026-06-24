export const DOCUMENT_TYPE_LABELS = {
    business_license: "Giấy phép kinh doanh",
    id_card: "CMND / CCCD",
    tax_certificate: "Chứng nhận thuế",
};

export const PENDING_QUEUE_TYPE = {
    supplier: {
        label: "Nhà cung cấp",
        href: "/quan-tri/nha-cung-cap",
        badgeClass: "bg-emerald-100 text-emerald-800",
    },
    dealer: {
        label: "Đại lý",
        href: "/quan-tri/dai-ly",
        badgeClass: "bg-sky-100 text-sky-800",
    },
    document: {
        label: "Giấy tờ",
        href: "/quan-tri/giay-to",
        badgeClass: "bg-amber-100 text-amber-800",
    },
    certification: {
        label: "Chứng chỉ",
        href: "/quan-tri/chung-chi",
        badgeClass: "bg-violet-100 text-violet-800",
    },
    product: {
        label: "Sản phẩm",
        href: "/quan-tri/san-pham",
        badgeClass: "bg-lime-100 text-lime-800",
    },
};

export function normalizeListResponse(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) {
        const nested = response.results;
        if (nested.length > 0 && Array.isArray(nested[0]?.results)) {
            return nested.flatMap((page) => page.results ?? []);
        }
        return nested;
    }
    return [];
}

export function countPending(items, statusKey = "status", pendingValue = "pending") {
    return items.filter((item) => item?.[statusKey] === pendingValue).length;
}

export function sortByCreatedDesc(items, dateKey = "created_at") {
    return [...items].sort(
        (a, b) => new Date(b?.[dateKey] ?? 0) - new Date(a?.[dateKey] ?? 0),
    );
}

export function getDocumentOwnerName(document) {
    return (
        document?.account?.profile_name
        || document?.account?.full_name
        || document?.account?.username
        || "Chưa rõ chủ sở hữu"
    );
}

export function buildDashboardSummary({
    suppliers = [],
    dealers = [],
    documents = [],
    certifications = [],
    products = [],
}) {
    const pendingSuppliers = sortByCreatedDesc(
        suppliers.filter((item) => item.verification_status === "pending"),
    );
    const pendingDealers = sortByCreatedDesc(
        dealers.filter((item) => item.status === "pending"),
    );
    const pendingDocuments = sortByCreatedDesc(
        documents.filter((item) => item.status === "pending"),
    );
    const pendingCertifications = sortByCreatedDesc(
        certifications.filter((item) => item.status === "pending"),
    );
    const pendingProducts = sortByCreatedDesc(
        products.filter((item) => item.status === "pending"),
    );

    const pendingTotal =
        pendingSuppliers.length
        + pendingDealers.length
        + pendingDocuments.length
        + pendingCertifications.length
        + pendingProducts.length;

    const partnerPendingTotal = pendingSuppliers.length + pendingDealers.length;

    return {
        pendingSuppliers,
        pendingDealers,
        pendingDocuments,
        pendingCertifications,
        pendingProducts,
        pendingTotal,
        partnerPendingTotal,
        stats: {
            suppliers: {
                pending: pendingSuppliers.length,
                approved: countPending(suppliers, "verification_status", "approved"),
                total: suppliers.length,
            },
            dealers: {
                pending: pendingDealers.length,
                approved: dealers.filter((item) => item.status === "active").length,
                total: dealers.length,
            },
            documents: {
                pending: pendingDocuments.length,
                approved: countPending(documents, "status", "approved"),
                total: documents.length,
            },
            certifications: {
                pending: pendingCertifications.length,
                approved: countPending(certifications, "status", "approved"),
                total: certifications.length,
            },
            products: {
                pending: pendingProducts.length,
                approved: countPending(products, "status", "active"),
                total: products.length,
            },
        },
    };
}

export function buildPendingQueue(summary) {
    const queue = [
        ...summary.pendingSuppliers.map((item) => ({
            id: `supplier-${item.id}`,
            type: "supplier",
            title: item.company_name || "Nhà cung cấp",
            subtitle: item.phone || item.address || "Chờ duyệt hồ sơ đăng ký",
            createdAt: item.created_at,
        })),
        ...summary.pendingDealers.map((item) => ({
            id: `dealer-${item.id}`,
            type: "dealer",
            title: item.store_name || "Đại lý",
            subtitle:
                item.account?.full_name
                || item.account?.phone
                || item.store_address
                || "Chờ duyệt hồ sơ đại lý",
            createdAt: item.created_at,
        })),
        ...summary.pendingDocuments.map((item) => ({
            id: `document-${item.id}`,
            type: "document",
            title: DOCUMENT_TYPE_LABELS[item.document_type] || "Giấy tờ",
            subtitle: getDocumentOwnerName(item),
            createdAt: item.created_at,
        })),
        ...summary.pendingCertifications.map((item) => ({
            id: `certification-${item.id}`,
            type: "certification",
            title: item.name || "Chứng chỉ",
            subtitle: item.certificate_code || item.issued_by || "Chờ duyệt chứng chỉ",
            createdAt: item.created_at,
        })),
        ...summary.pendingProducts.map((item) => ({
            id: `product-${item.id}`,
            type: "product",
            title: item.name || "Sản phẩm",
            subtitle:
                item.supplier?.company_name
                || item.supplier_name
                || item.category?.name
                || "Chờ duyệt sản phẩm",
            createdAt: item.created_at,
        })),
    ];

    return sortByCreatedDesc(queue, "createdAt").slice(0, 12);
}

export function formatRelativeTimeVi(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}
