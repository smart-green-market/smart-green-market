import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal";
import InfoField from "../../common/InfoField";
import CategorySearchSelect from "./CategorySearchSelect";
import { PRODUCT_MASTER_STATUS } from "./productMasterHelpers";

function FormField({ label, children, required = false }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-neutral-700">
                {label}
                {required ? <span className="text-red-500"> *</span> : null}
            </label>
            {children}
        </div>
    );
}

export default function ProductMasterViewModal({
    isOpen,
    onClose,
    product,
    onUpdate,
    onDelete,
    onToggleStatus,
    loading,
}) {
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        category_id: "",
        name: "",
        default_unit: "",
        description: "",
        sort_order: "0",
    });
    const [formError, setFormError] = useState("");

    useEffect(() => {
        if (!isOpen || !product) {
            setIsEditing(false);
            setFormError("");
            return;
        }

        setForm({
            category_id: String(product.category_id ?? ""),
            name: product.name ?? "",
            default_unit: product.default_unit ?? "",
            description: product.description ?? "",
            sort_order: String(product.sort_order ?? 0),
        });
        setIsEditing(false);
        setFormError("");
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const isActive = product.status === PRODUCT_MASTER_STATUS.ACTIVE;
    const isInactive = product.status === PRODUCT_MASTER_STATUS.INACTIVE;

    const openConfirm = ({
        title,
        message,
        confirmText,
        variant,
        action,
    }) => {
        setConfirmConfig({ title, message, confirmText, variant, action });
    };

    const handleConfirm = async () => {
        if (confirmConfig?.action) {
            await confirmConfig.action();
        }
        setConfirmConfig(null);
    };

    const handleStartEdit = () => {
        setForm({
            category_id: String(product.category_id ?? ""),
            name: product.name ?? "",
            default_unit: product.default_unit ?? "",
            description: product.description ?? "",
            sort_order: String(product.sort_order ?? 0),
        });
        setFormError("");
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setForm({
            category_id: String(product.category_id ?? ""),
            name: product.name ?? "",
            default_unit: product.default_unit ?? "",
            description: product.description ?? "",
            sort_order: String(product.sort_order ?? 0),
        });
        setFormError("");
        setIsEditing(false);
    };

    const handleSaveUpdate = async () => {
        if (!form.category_id) {
            setFormError("Vui lòng chọn danh mục.");
            return;
        }

        if (!form.name.trim()) {
            setFormError("Vui lòng nhập tên sản phẩm.");
            return;
        }

        if (!form.default_unit.trim()) {
            setFormError("Vui lòng nhập đơn vị mặc định.");
            return;
        }

        try {
            setFormError("");
            await onUpdate(product, form);
            setIsEditing(false);
        } catch (error) {
            setFormError(error?.message ?? "Không thể cập nhật sản phẩm.");
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                <div className="flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
                    <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-6 py-4">
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900">
                                {isEditing
                                    ? "Cập nhật danh mục sản phẩm"
                                    : "Chi tiết danh mục sản phẩm"}
                            </h2>
                        </div>
                        <button
                            disabled={loading}
                            onClick={onClose}
                            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-neutral-100"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-5 overflow-y-auto p-6">
                        {formError ? (
                            <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                                {formError}
                            </div>
                        ) : null}

                        {isEditing ? (
                            <>
                                <FormField label="Danh mục" required>
                                    <CategorySearchSelect
                                        value={form.category_id}
                                        selectedLabel={product.category_name}
                                        onChange={(categoryId) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                category_id: categoryId,
                                            }))
                                        }
                                        disabled={loading}
                                    />
                                </FormField>

                                <FormField label="Tên sản phẩm" required>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                                    />
                                </FormField>

                                <FormField label="Đơn vị mặc định" required>
                                    <input
                                        type="text"
                                        value={form.default_unit}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                default_unit: e.target.value,
                                            }))
                                        }
                                        className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                                    />
                                </FormField>

                                <FormField label="Mô tả">
                                    <textarea
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        rows={3}
                                        className="resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                                    />
                                </FormField>
                            </>
                        ) : (
                            <>
                                <InfoField
                                    label="Danh mục"
                                    value={product.category_name}
                                />
                                <InfoField label="Tên sản phẩm" value={product.name} />
                                <InfoField
                                    label="Đơn vị mặc định"
                                    value={product.default_unit}
                                />
                                <InfoField
                                    label="Mô tả"
                                    value={product.description || "—"}
                                />
                                <InfoField label="Slug" value={product.slug || "—"} />
                            </>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-wrap justify-center gap-3 border-t border-neutral-200 px-6 py-4">
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleCancelEdit}
                                    className="cursor-pointer rounded-xl border border-neutral-300 px-6 py-2.5 font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleSaveUpdate}
                                    className="cursor-pointer rounded-xl bg-emerald-800 px-6 py-2.5 font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                                >
                                    {loading ? "Đang lưu..." : "Lưu cập nhật"}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleStartEdit}
                                    className="cursor-pointer rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Cập nhật
                                </button>

                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() =>
                                        openConfirm({
                                            title: "Xóa danh mục sản phẩm",
                                            message: `Bạn có chắc chắn muốn xóa danh mục sản phẩm "${product.name}"? Hành động này không thể hoàn tác.`,
                                            confirmText: "Xóa",
                                            variant: "danger",
                                            action: () => onDelete(product),
                                        })
                                    }
                                    className="cursor-pointer rounded-xl bg-red-600 px-6 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    Xóa
                                </button>

                                {isActive ? (
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() =>
                                            openConfirm({
                                                title: "Khóa sản phẩm",
                                                message: `Bạn có chắc chắn muốn khóa "${product.name}" không?`,
                                                confirmText: "Khóa",
                                                variant: "warning",
                                                action: () =>
                                                    onToggleStatus(
                                                        product,
                                                        PRODUCT_MASTER_STATUS.INACTIVE,
                                                    ),
                                            })
                                        }
                                        className="cursor-pointer rounded-xl bg-gray-500 px-6 py-2.5 font-semibold text-white hover:bg-gray-400 disabled:opacity-50"
                                    >
                                        Khóa
                                    </button>
                                ) : null}

                                {isInactive ? (
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() =>
                                            openConfirm({
                                                title: "Mở khóa sản phẩm",
                                                message: `Bạn có chắc chắn muốn mở khóa "${product.name}" không?`,
                                                confirmText: "Mở khóa",
                                                variant: "success",
                                                action: () =>
                                                    onToggleStatus(
                                                        product,
                                                        PRODUCT_MASTER_STATUS.ACTIVE,
                                                    ),
                                            })
                                        }
                                        className="cursor-pointer rounded-xl bg-emerald-500 px-6 py-2.5 font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                                    >
                                        Mở khóa
                                    </button>
                                ) : null}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmConfig !== null}
                onClose={() => setConfirmConfig(null)}
                onConfirm={handleConfirm}
                title={confirmConfig?.title}
                message={confirmConfig?.message}
                confirmText={confirmConfig?.confirmText}
                cancelText="Hủy"
                variant={confirmConfig?.variant}
                loading={loading}
                showToast={false}
            />
        </>
    );
}
