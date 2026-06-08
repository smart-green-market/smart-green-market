import { useState } from "react";
import { X, Package, Tag, Building2, Clock } from "lucide-react";

import ConfirmModal from "../../common/ConfirmModal";
import InfoField from "../../common/InfoField";
import DateField from "../../common/DateField";
import StatusBadge from "../../common/StatusBadge";
import ProductImageGallery from "./ProductImageGallery";

// ── Section: tiêu đề nhóm + grid nội dung ───────────────────────────────────
function Section({ title, icon: Icon, children }) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Icon size={15} className="text-emerald-700" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                    {title}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-4">{children}</div>
        </div>
    );
}

export default function ProductViewModal({
    isOpen,
    onClose,
    product,
    onApprove,
    onReject,
    onPause,
    loading = false,
    error = "",
}) {
    const [confirmConfig, setConfirmConfig] = useState(null);

    if (!isOpen || !product) return null;

    // ── Trạng thái ──────────────────────────────────────────────────────────
    const isPending = product.status === "pending";
    const isActive = product.status === "active";
    const isInactive =
        product.status === "inactive" || product.status === "paused";
    const isRejected = product.status === "rejected";

    // ── Confirm ─────────────────────────────────────────────────────────────
    const openConfirm = (cfg) => setConfirmConfig(cfg);

    const handleConfirm = async () => {
        if (confirmConfig?.action) {
            await confirmConfig.action();
        }
        setConfirmConfig(null);
        onClose();
    };

    const tempValue =
        product.min_storage_temp != null && product.max_storage_temp != null
            ? `${product.min_storage_temp}°C — ${product.max_storage_temp}°C`
            : null;

    return (
        <>
            {/* OVERLAY */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                {/* PANEL */}
                <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
                    {/* HEADER */}
                    <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Package size={18} className="text-emerald-700" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-emerald-950 font-['Geist',sans-serif]">
                                    Chi tiết sản phẩm
                                </h2>
                                {product.slug && (
                                    <p className="text-xs text-neutral-400 font-mono">
                                        {product.slug}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            onClick={onClose}
                            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
                        <div className="p-6 flex flex-col gap-6">
                            {/* TOP: ảnh + tên + trạng thái + mô tả */}
                            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5">
                                <ProductImageGallery
                                    images={product.images}
                                    alt={product.name}
                                />

                                <div className="flex flex-col gap-3 min-w-0">
                                    <h3 className="text-xl font-bold text-emerald-950 font-['Geist',sans-serif] leading-tight">
                                        {product.name}
                                    </h3>

                                    <StatusBadge status={product.status} />

                                    {product.description && (
                                        <p className="text-sm text-neutral-500 leading-relaxed">
                                            {product.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-neutral-100" />

                            {/* THÔNG TIN SẢN PHẨM */}
                            <Section title="Thông tin sản phẩm" icon={Tag}>
                                <InfoField label="Đơn vị" value={product.unit} />
                                <InfoField
                                    label="Danh mục"
                                    value={product.category_name}
                                />
                                <InfoField
                                    label="Bảo quản (ngày)"
                                    value={product.storage_duration_days}
                                />
                                <InfoField
                                    label="Nhiệt độ bảo quản"
                                    value={tempValue}
                                />
                            </Section>

                            {/* NHÀ CUNG CẤP */}
                            <Section title="Nhà cung cấp" icon={Building2}>
                                <InfoField
                                    label="Tên công ty"
                                    value={product.supplier?.company_name}
                                />
                                <InfoField
                                    label="Mã số thuế"
                                    value={product.supplier?.tax_code}
                                />
                                <InfoField
                                    label="Điện thoại"
                                    value={product.supplier?.phone}
                                />
                                <InfoField
                                    label="Địa chỉ"
                                    value={product.supplier?.address}
                                />
                            </Section>

                            {/* THỜI GIAN */}
                            <Section title="Thời gian" icon={Clock}>
                                <DateField
                                    label="Ngày tạo"
                                    value={product.created_at}
                                />
                                <DateField
                                    label="Duyệt lúc"
                                    value={product.verified_at}
                                />
                            </Section>

                            {/* LÝ DO TỪ CHỐI */}
                            {product.rejection_reason && (
                                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                                    <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">
                                        Lý do từ chối
                                    </p>
                                    <p className="text-sm text-red-600">
                                        {product.rejection_reason}
                                    </p>
                                </div>
                            )}

                            {/* ERROR */}
                            {error && (
                                <div className="px-4 py-3 rounded-xl bg-red-100 border border-red-200 text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3 shrink-0 bg-stone-50">
                        {/* Pending → Duyệt / Từ chối */}
                        {isPending && (
                            <>
                                <button
                                    disabled={loading}
                                    onClick={() =>
                                        openConfirm({
                                            title: "Từ chối sản phẩm",
                                            message: `Bạn có chắc chắn muốn từ chối "${product.name}"?`,
                                            confirmText: "Từ chối",
                                            variant: "danger",
                                            action: () => onReject(product),
                                        })
                                    }
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    Từ chối
                                </button>

                                <button
                                    disabled={loading}
                                    onClick={() =>
                                        openConfirm({
                                            title: "Duyệt sản phẩm",
                                            message: `Bạn có chắc chắn muốn duyệt "${product.name}"?`,
                                            confirmText: "Duyệt",
                                            variant: "success",
                                            action: () => onApprove(product),
                                        })
                                    }
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    Duyệt
                                </button>
                            </>
                        )}

                        {/* Active → Tạm ngưng */}
                        {isActive && (
                            <button
                                disabled={loading}
                                onClick={() =>
                                    openConfirm({
                                        title: "Tạm ngưng sản phẩm",
                                        message: `Bạn có chắc chắn muốn tạm ngưng "${product.name}"?`,
                                        confirmText: "Tạm ngưng",
                                        variant: "warning",
                                        action: () => onPause(product),
                                    })
                                }
                                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Tạm ngưng
                            </button>
                        )}

                        {/* Inactive / Rejected → Kích hoạt lại */}
                        {(isInactive || isRejected) && (
                            <button
                                disabled={loading}
                                onClick={() =>
                                    openConfirm({
                                        title: "Kích hoạt sản phẩm",
                                        message: `Bạn có chắc chắn muốn kích hoạt "${product.name}"?`,
                                        confirmText: "Kích hoạt",
                                        variant: "success",
                                        action: () => onApprove(product),
                                    })
                                }
                                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Kích hoạt
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* CONFIRM */}
            <ConfirmModal
                isOpen={confirmConfig !== null}
                onClose={() => setConfirmConfig(null)}
                onConfirm={handleConfirm}
                title={confirmConfig?.title}
                message={confirmConfig?.message}
                confirmText={confirmConfig?.confirmText}
                cancelText="Hủy"
                variant={confirmConfig?.variant}
            />
        </>
    );
}
