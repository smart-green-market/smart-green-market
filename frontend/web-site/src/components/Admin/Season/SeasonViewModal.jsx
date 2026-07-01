import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal";
import InfoField from "../../common/InfoField";
import {
    MONTH_OPTIONS,
    SEASON_STATUS,
    formatMonthRange,
} from "./seasonHelpers";

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

export default function SeasonViewModal({
    isOpen,
    onClose,
    season,
    onUpdate,
    onDelete,
    onToggleStatus,
    loading,
}) {
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        code: "",
        name: "",
        description: "",
        start_month: "",
        end_month: "",
        sort_order: "0",
    });
    const [formError, setFormError] = useState("");

    useEffect(() => {
        if (!isOpen || !season) {
            setIsEditing(false);
            setFormError("");
            return;
        }

        setForm({
            code: season.code ?? "",
            name: season.name ?? "",
            description: season.description ?? "",
            start_month: String(season.start_month ?? ""),
            end_month: String(season.end_month ?? ""),
            sort_order: String(season.sort_order ?? 0),
        });
        setIsEditing(false);
        setFormError("");
    }, [isOpen, season]);

    if (!isOpen || !season) return null;

    const isActive = season.status === SEASON_STATUS.ACTIVE;
    const isInactive = season.status === SEASON_STATUS.INACTIVE;

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

    const resetFormFromSeason = () => ({
        code: season.code ?? "",
        name: season.name ?? "",
        description: season.description ?? "",
        start_month: String(season.start_month ?? ""),
        end_month: String(season.end_month ?? ""),
        sort_order: String(season.sort_order ?? 0),
    });

    const handleStartEdit = () => {
        setForm(resetFormFromSeason());
        setFormError("");
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setForm(resetFormFromSeason());
        setFormError("");
        setIsEditing(false);
    };

    const handleSaveUpdate = async () => {
        if (!form.name.trim()) {
            setFormError("Vui lòng nhập tên mùa.");
            return;
        }

        if (!form.start_month || !form.end_month) {
            setFormError("Vui lòng chọn khoảng tháng.");
            return;
        }

        if (Number(form.start_month) > Number(form.end_month)) {
            setFormError("Tháng bắt đầu không được lớn hơn tháng kết thúc.");
            return;
        }

        try {
            setFormError("");
            await onUpdate(season, form);
            setIsEditing(false);
        } catch (error) {
            setFormError(error?.message ?? "Không thể cập nhật mùa.");
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                <div className="flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
                    <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-6 py-4">
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900">
                                {isEditing ? "Cập nhật mùa" : "Chi tiết mùa"}
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
                                <FormField label="Tên mùa" required>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                name: event.target.value,
                                            }))
                                        }
                                        className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                                    />
                                </FormField>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Tháng bắt đầu" required>
                                        <select
                                            value={form.start_month}
                                            onChange={(event) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    start_month: event.target.value,
                                                }))
                                            }
                                            className="cursor-pointer rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                                        >
                                            <option value="">Chọn tháng</option>
                                            {MONTH_OPTIONS.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </FormField>

                                    <FormField label="Tháng kết thúc" required>
                                        <select
                                            value={form.end_month}
                                            onChange={(event) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    end_month: event.target.value,
                                                }))
                                            }
                                            className="cursor-pointer rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                                        >
                                            <option value="">Chọn tháng</option>
                                            {MONTH_OPTIONS.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </FormField>
                                </div>

                                <FormField label="Mô tả">
                                    <textarea
                                        value={form.description}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                description: event.target.value,
                                            }))
                                        }
                                        rows={3}
                                        className="resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                                    />
                                </FormField>
                            </>
                        ) : (
                            <>
                                <InfoField label="Tên mùa" value={season.name} />
                                <InfoField
                                    label="Khoảng tháng"
                                    value={formatMonthRange(
                                        season.start_month,
                                        season.end_month,
                                    )}
                                />
                                <InfoField
                                    label="Mô tả"
                                    value={season.description || "—"}
                                />
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
                                            title: "Xóa mùa",
                                            message: `Bạn có chắc chắn muốn xóa "${season.name}"? Hành động này không thể hoàn tác.`,
                                            confirmText: "Xóa",
                                            variant: "danger",
                                            action: () => onDelete(season),
                                        })
                                    }
                                    className="cursor-pointer rounded-xl bg-red-600 px-6 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    Xóa
                                </button>

                                {/* {isActive ? (
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() =>
                                            openConfirm({
                                                title: "Khóa mùa",
                                                message: `Bạn có chắc chắn muốn khóa "${season.name}" không?`,
                                                confirmText: "Khóa",
                                                variant: "warning",
                                                action: () =>
                                                    onToggleStatus(
                                                        season,
                                                        SEASON_STATUS.INACTIVE,
                                                    ),
                                            })
                                        }
                                        className="cursor-pointer rounded-xl bg-gray-500 px-6 py-2.5 font-semibold text-white hover:bg-gray-400 disabled:opacity-50"
                                    >
                                        Khóa
                                    </button>
                                ) : null} */}

                                {/* {isInactive ? (
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() =>
                                            openConfirm({
                                                title: "Mở khóa mùa",
                                                message: `Bạn có chắc chắn muốn mở khóa "${season.name}" không?`,
                                                confirmText: "Mở khóa",
                                                variant: "success",
                                                action: () =>
                                                    onToggleStatus(
                                                        season,
                                                        SEASON_STATUS.ACTIVE,
                                                    ),
                                            })
                                        }
                                        className="cursor-pointer rounded-xl bg-emerald-500 px-6 py-2.5 font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                                    >
                                        Mở khóa
                                    </button>
                                ) : null} */}
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
