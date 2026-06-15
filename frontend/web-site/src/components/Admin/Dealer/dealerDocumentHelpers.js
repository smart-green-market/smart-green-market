const REQUIRED_DOC_TYPES = [
    "id_card",
    "business_license",
    "tax_certificate",
];

const DOC_TYPE_LABELS = {
    id_card: "CMND/CCCD",
    business_license: "Giấy phép kinh doanh",
    tax_certificate: "Giấy chứng nhận thuế",
};

function formatDocLabel(type, documents = []) {
    const doc = documents.find((item) => item.document_type === type);
    return doc?.document_type_label || DOC_TYPE_LABELS[type] || type;
}

export function getDealerApprovalDocumentError(documents = []) {
    const uploadedTypes = new Set(
        documents.map((doc) => doc.document_type).filter(Boolean),
    );

    const missingTypes = REQUIRED_DOC_TYPES.filter(
        (type) => !uploadedTypes.has(type),
    );

    if (missingTypes.length > 0) {
        const labels = missingTypes.map((type) => formatDocLabel(type, documents));
        return `Đại lý chưa upload đủ giấy tờ: ${labels.join(", ")}`;
    }

    const unapprovedTypes = REQUIRED_DOC_TYPES.filter((type) => {
        const doc = documents.find((item) => item.document_type === type);
        return doc?.status !== "approved";
    });

    if (unapprovedTypes.length > 0) {
        const labels = unapprovedTypes.map((type) => formatDocLabel(type, documents));
        return `Còn giấy tờ chưa được duyệt: ${labels.join(", ")}. Vui lòng duyệt ở mục Quản lý giấy tờ trước.`;
    }

    return null;
}
