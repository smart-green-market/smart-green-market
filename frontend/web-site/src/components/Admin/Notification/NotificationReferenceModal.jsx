import { useCallback, useEffect, useState } from "react";
import CategoryViewModal from "../Category/CategoryViewModal";
import ProductViewModal from "../Product/ProductViewModal";
import SupplierViewModal from "../Suppiler/SupplierViewModal";
import DocumentViewModal from "../Document/DocumentViewModal";
import CertificationViewModal from "../Certification/CertificationViewModal";
import { fetchNotificationReference } from "./notificationReferenceHelpers";

const noop = async () => {};

export default function NotificationReferenceModal({
    isOpen,
    onClose,
    referenceType,
    referenceId,
}) {
    const [reference, setReference] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadReference = useCallback(async () => {
        if (!isOpen || referenceId == null || !referenceType) return;

        try {
            setLoading(true);
            setError("");
            const result = await fetchNotificationReference(referenceType, referenceId);
            setReference(result);
        } catch (err) {
            setReference(null);
            setError(err.message || "Không thể tải chi tiết đối tượng.");
        } finally {
            setLoading(false);
        }
    }, [isOpen, referenceId, referenceType]);

    useEffect(() => {
        if (isOpen) {
            loadReference();
            return;
        }

        setReference(null);
        setError("");
        setLoading(false);
    }, [isOpen, loadReference]);

    const handleClose = () => {
        setReference(null);
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
                <div className="rounded-xl bg-white px-6 py-4 text-sm text-neutral-600 shadow-xl">
                    Đang tải chi tiết...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
                <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                    <h3 className="text-base font-semibold text-zinc-900">
                        Không thể mở chi tiết
                    </h3>
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                    <p className="mt-2 text-sm text-neutral-500">
                        Mã tham chiếu: {referenceType} #{referenceId}
                    </p>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!reference) return null;

    switch (reference.type) {
        case "category":
            return (
                <CategoryViewModal
                    isOpen
                    onClose={handleClose}
                    category={reference.data}
                    onApprove={noop}
                    onReject={noop}
                    onLock={noop}
                    onUnlock={noop}
                    loading={false}
                />
            );
        case "supplier_product":
            return (
                <ProductViewModal
                    isOpen
                    onClose={handleClose}
                    product={reference.data}
                    onApprove={noop}
                    onReject={noop}
                    onPause={noop}
                    loading={false}
                />
            );
        case "supplier":
            return (
                <SupplierViewModal
                    isOpen
                    onClose={handleClose}
                    supplier={reference.data}
                    onApprove={noop}
                    onReject={noop}
                    loading={false}
                />
            );
        case "supplier_document":
            return (
                <DocumentViewModal
                    isOpen
                    onClose={handleClose}
                    document={reference.data}
                    onApprove={noop}
                    onReject={noop}
                />
            );
        case "certification":
            return (
                <CertificationViewModal
                    isOpen
                    onClose={handleClose}
                    certification={reference.data}
                    onApprove={noop}
                    onReject={noop}
                    loading={false}
                />
            );
        default:
            return null;
    }
}
