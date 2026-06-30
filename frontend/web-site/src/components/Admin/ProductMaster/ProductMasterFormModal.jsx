import { useState } from "react";
import { Package, X } from "lucide-react";
import CategorySearchSelect from "./CategorySearchSelect";
import SeasonMultiSelect from "./SeasonMultiSelect";

const EMPTY_FORM = {
    category_id: "",
    name: "",
    default_unit: "",
    description: "",
    sort_order: "0",
    season_ids: [],
};

export default function ProductMasterFormModal({
    isOpen,
    onClose,
    onSubmit,
    title = "Thêm danh mục sản phẩm",
    submitLabel = "Tạo sản phẩm",
}) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleClose = () => {
        if (loading) return;
        setForm(EMPTY_FORM);
        setError("");
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.category_id) {
            setError("Vui lòng chọn danh mục.");
            return;
        }

        if (!form.name.trim()) {
            setError("Vui lòng nhập tên sản phẩm.");
            return;
        }

        if (!form.default_unit.trim()) {
            setError("Vui lòng nhập đơn vị mặc định.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            await onSubmit(form);
            setForm(EMPTY_FORM);
            onClose();
        } catch (err) {
            setError(err?.message ?? "Không thể tạo danh mục sản phẩm.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
                        <Package className="h-5 w-5 text-emerald-700" />
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
                                Tên sản phẩm{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder="Ví dụ: Cà chua"
                                className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-neutral-700">
                                Danh mục <span className="text-red-500">*</span>
                            </label>
                            <CategorySearchSelect
                                value={form.category_id}
                                onChange={(categoryId) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        category_id: categoryId,
                                    }))
                                }
                                disabled={loading}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-neutral-700">
                                Mùa
                            </label>
                            <SeasonMultiSelect
                                value={form.season_ids}
                                onChange={(seasonIds) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        season_ids: seasonIds,
                                    }))
                                }
                                disabled={loading}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-neutral-700">
                                Đơn vị mặc định{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.default_unit}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        default_unit: e.target.value,
                                    }))
                                }
                                placeholder="Ví dụ: kg, túi, hộp"
                                className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-neutral-700">
                                Mô tả
                            </label>
                            <textarea
                                value={form.description}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                rows={3}
                                placeholder="Mô tả ngắn về sản phẩm..."
                                className="resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                            />
                        </div>
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
                            disabled={loading}
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
