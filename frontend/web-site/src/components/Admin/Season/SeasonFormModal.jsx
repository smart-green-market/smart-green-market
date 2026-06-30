import { useEffect, useMemo, useState } from "react";
import { CalendarRange, X } from "lucide-react";
import {
    formatMonthRange,
    getAvailableSeasonPresets,
    getSeasonPresetByKey,
} from "./seasonHelpers";

const EMPTY_FORM = {
    preset_key: "",
    code: "",
    name: "",
    description: "",
    start_month: "",
    end_month: "",
    sort_order: "0",
};

export default function SeasonFormModal({
    isOpen,
    onClose,
    onSubmit,
    existingSeasons = [],
    title = "Thêm mùa",
    submitLabel = "Tạo mùa",
}) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const availablePresets = useMemo(
        () => getAvailableSeasonPresets(existingSeasons),
        [existingSeasons],
    );

    useEffect(() => {
        if (!isOpen) {
            setForm(EMPTY_FORM);
            setError("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        if (loading) return;
        setForm(EMPTY_FORM);
        setError("");
        onClose();
    };

    const handlePresetChange = (presetKey) => {
        const preset = getSeasonPresetByKey(presetKey);
        if (!preset) {
            setForm((prev) => ({ ...prev, preset_key: "" }));
            return;
        }

        setForm({
            preset_key: presetKey,
            code: preset.code,
            name: preset.name,
            description: preset.description,
            start_month: String(preset.start_month),
            end_month: String(preset.end_month),
            sort_order: String(preset.sort_order ?? 0),
        });
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.preset_key) {
            setError("Vui lòng chọn tên mùa.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            await onSubmit(form);
            setForm(EMPTY_FORM);
            onClose();
        } catch (err) {
            setError(err?.message ?? "Không thể tạo mùa.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
                        <CalendarRange className="h-5 w-5 text-emerald-700" />
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="cursor-pointer rounded-full p-2 transition-colors hover:bg-neutral-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-6">
                        {error ? (
                            <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        ) : null}

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-neutral-700">
                                Tên mùa <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.preset_key}
                                onChange={(event) =>
                                    handlePresetChange(event.target.value)
                                }
                                className="cursor-pointer rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                            >
                                <option value="">Chọn mùa...</option>
                                {availablePresets.map((preset) => (
                                    <option key={preset.key} value={preset.key}>
                                        {preset.name}
                                    </option>
                                ))}
                            </select>
                            {availablePresets.length === 0 ? (
                                <p className="text-xs text-amber-700">
                                    Tất cả mùa có sẵn đã được thêm vào hệ thống.
                                </p>
                            ) : null}
                        </div>

                        {form.preset_key ? (
                            <>
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
                                    <p>
                                        <span className="font-semibold">Khoảng tháng:</span>{" "}
                                        {formatMonthRange(form.start_month, form.end_month)}
                                    </p>
                                    <p className="mt-1 text-emerald-800/80">
                                        {form.description}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-neutral-700">
                                        Mô tả bổ sung
                                    </label>
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
                                </div>
                            </>
                        ) : null}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="cursor-pointer rounded-xl border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || availablePresets.length === 0}
                            className="cursor-pointer rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                        >
                            {loading ? "Đang xử lý..." : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
