import { useEffect, useState } from "react";

import { X } from "lucide-react";

import ConfirmModal from "../../common/ConfirmModal";
import RejectModal from "../../common/RejectModal";
import DateField from "../../common/DateField";
import InfoField from "../../common/InfoField";
import {
    CATEGORY_SCOPE,
    getScopeLabel,
} from "./categoryHelpers";

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

export default function CategoryViewModal({
    isOpen,
    onClose,
    category,
    onApprove,
    onReject,
    onLock,
    onUnlock,
    onUpdate,
    onDelete,
    loading,
    readOnly = false,
    closeOnAction = true,
}) {
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [rejectConfig, setRejectConfig] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        sort_order: "0",
    });
    const [formError, setFormError] = useState("");

    useEffect(() => {
        if (!isOpen || !category) {
            setIsEditing(false);
            setFormError("");
            return;
        }

        setForm({
            name: category.name ?? "",
            description: category.description ?? "",
            sort_order: String(category.sort_order ?? 0),
        });
        setIsEditing(false);
        setFormError("");
    }, [isOpen, category]);

    if (!isOpen || !category) return null;

    const isSystemScope = category.scope === CATEGORY_SCOPE.SYSTEM;
    const isCustomScope = category.scope === CATEGORY_SCOPE.CUSTOM;
    const isPending = category.status === "pending";
    const isActive = category.status === "active";
    const isInactive = category.status === "inactive";

    const openReject = ({ title, message, action }) => {
        setRejectConfig({ title, message, action });
    };

    const handleRejectConfirm = async (reason) => {
        if (rejectConfig?.action) {
            await rejectConfig.action(reason);
        }
        setRejectConfig(null);
        if (closeOnAction) {
            onClose();
        }
    };

    const openConfirm = ({
        title,
        message,
        confirmText,
        variant,
        action,
    }) => {
        setConfirmConfig({
            title,
            message,
            confirmText,
            variant,
            action,
        });
    };

    const handleConfirm = async () => {
        if (confirmConfig?.action) {
            await confirmConfig.action();
        }
        setConfirmConfig(null);
        if (closeOnAction) {
            onClose();
        }
    };

    const handleStartEdit = () => {
        setForm({
            name: category.name ?? "",
            description: category.description ?? "",
            sort_order: String(category.sort_order ?? 0),
        });
        setFormError("");
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setForm({
            name: category.name ?? "",
            description: category.description ?? "",
            sort_order: String(category.sort_order ?? 0),
        });
        setFormError("");
        setIsEditing(false);
    };

    const handleSaveUpdate = async () => {
        if (!form.name.trim()) {
            setFormError("Vui lòng nhập tên danh mục.");
            return;
        }

        try {
            setFormError("");
            await onUpdate(category, {
                name: form.name,
                description: form.description,
                sort_order: form.sort_order,
            });
            setIsEditing(false);
        } catch (error) {
            setFormError(error?.message ?? "Không thể cập nhật danh mục.");
        }
    };

    const createdByLabel = category.created_by
        ? category.created_by.profile_name ||
        category.created_by.full_name ||
        category.created_by.username
        : "—";

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                <div className="flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
                    <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-6 py-4">
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900">
                                {isEditing ? "Cập nhật danh mục hệ thống" : "Danh mục sản phẩm"}
                            </h2>
                            <p className="mt-1 text-xs text-neutral-500">
                                Phạm vi: {getScopeLabel(category.scope)}
                            </p>
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
                                <FormField label="Tên danh mục" required>
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
                                <InfoField label="Phạm vi" value={getScopeLabel(category.scope)} />

                                <InfoField label="Tên danh mục" value={category.name} />

                                <InfoField label="Mô tả" value={category.description} />

                                <InfoField
                                    label="Số sản phẩm"
                                    value={String(category.product_count ?? 0)}
                                />

                                {isCustomScope ? (
                                    <InfoField label="Người đăng ký" value={createdByLabel} />
                                ) : null}

                                <div className="grid grid-cols-2 gap-4">
                                    <DateField
                                        label="Ngày tạo"
                                        value={category.created_at}
                                    />
                                    <DateField
                                        label="Ngày được duyệt"
                                        value={category.verified_at}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {!readOnly ? (
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
                            ) : null}

                            {!isEditing && isSystemScope ? (
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
                                                title: "Xóa danh mục hệ thống",
                                                message: `Bạn có chắc chắn muốn xóa "${category.name}"? Hành động này không thể hoàn tác.`,
                                                confirmText: "Xóa",
                                                variant: "danger",
                                                action: () => onDelete(category),
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
                                                    title: "Khóa danh mục",
                                                    message: `Bạn có chắc chắn muốn khóa "${category.name}" không?`,
                                                    confirmText: "Khóa",
                                                    variant: "warning",
                                                    action: () => onLock(category),
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
                                                    title: "Mở khóa danh mục",
                                                    message: `Bạn có chắc chắn muốn mở khóa "${category.name}" không?`,
                                                    confirmText: "Mở khóa",
                                                    variant: "success",
                                                    action: () => onUnlock(category),
                                                })
                                            }
                                            className="cursor-pointer rounded-xl bg-emerald-500 px-6 py-2.5 font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                                        >
                                            Mở khóa
                                        </button>
                                    ) : null}
                                </>
                            ) : null}

                            {!isEditing && isCustomScope && isPending ? (
                                <>
                                    <button
                                        onClick={() =>
                                            openConfirm({
                                                title: "Duyệt danh mục",
                                                message: `Bạn có chắc chắn muốn duyệt "${category.name}" không?`,
                                                confirmText: "Duyệt",
                                                variant: "success",
                                                action: () => onApprove(category),
                                            })
                                        }
                                        className="cursor-pointer rounded-xl bg-emerald-500 px-6 py-2.5 font-semibold text-white hover:bg-emerald-400"
                                    >
                                        Duyệt
                                    </button>

                                    <button
                                        onClick={() =>
                                            openReject({
                                                title: "Từ chối danh mục",
                                                message: `Bạn có chắc chắn muốn từ chối "${category.name}" không?`,
                                                action: (reason) =>
                                                    onReject(category, reason),
                                            })
                                        }
                                        className="cursor-pointer rounded-xl bg-red-500 px-6 py-2.5 font-semibold text-white hover:bg-red-400"
                                    >
                                        Từ chối
                                    </button>
                                </>
                            ) : null}

                            {!isEditing && isCustomScope && isActive ? (
                                <button
                                    onClick={() =>
                                        openConfirm({
                                            title: "Khóa danh mục",
                                            message: `Bạn có chắc chắn muốn khóa "${category.name}" không?`,
                                            confirmText: "Khóa",
                                            variant: "warning",
                                            action: () => onLock(category),
                                        })
                                    }
                                    className="cursor-pointer rounded-xl bg-gray-500 px-6 py-2.5 font-semibold text-white hover:bg-gray-400"
                                >
                                    Khóa
                                </button>
                            ) : null}

                            {!isEditing && isCustomScope && isInactive ? (
                                <button
                                    onClick={() =>
                                        openConfirm({
                                            title: "Mở khóa danh mục",
                                            message: `Bạn có chắc chắn muốn mở khóa "${category.name}" không?`,
                                            confirmText: "Mở khóa",
                                            variant: "success",
                                            action: () => onUnlock(category),
                                        })
                                    }
                                    className="cursor-pointer rounded-xl bg-emerald-500 px-6 py-2.5 font-semibold text-white hover:bg-emerald-400"
                                >
                                    Mở khóa
                                </button>
                            ) : null}
                        </div>
                    ) : null}
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

            <RejectModal
                isOpen={rejectConfig !== null}
                onClose={() => setRejectConfig(null)}
                onConfirm={handleRejectConfirm}
                title={rejectConfig?.title}
                message={rejectConfig?.message}
                loading={loading}
            />
        </>
    );
}
