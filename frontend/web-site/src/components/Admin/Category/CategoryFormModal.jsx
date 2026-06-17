import { useState } from "react";
import { Tag, X } from "lucide-react";

const EMPTY_FORM = {
    name: "",
    description: "",
    sort_order: "0",
};

export default function CategoryFormModal({
    isOpen,
    onClose,
    onSubmit,
    title = "Thêm danh mục hệ thống",
    submitLabel = "Tạo danh mục",
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
        if (!form.name.trim()) {
            setError("Vui lòng nhập tên danh mục.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            await onSubmit({
                name: form.name,
                description: form.description,
                sort_order: form.sort_order,
            });
            setForm(EMPTY_FORM);
            onClose();
        } catch (err) {
            setError(err?.message ?? "Không thể tạo danh mục.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="flex w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
                        <Tag className="h-5 w-5 text-emerald-700" />
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
                    <div className="flex flex-col gap-4 p-6">
                        {error ? (
                            <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        ) : null}

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-neutral-700">
                                Tên danh mục <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, name: e.target.value }))
                                }
                                placeholder="Ví dụ: Rau củ quả"
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
                                placeholder="Mô tả ngắn về danh mục..."
                                className="resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-neutral-700">
                                Thứ tự hiển thị
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={form.sort_order}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        sort_order: e.target.value,
                                    }))
                                }
                                className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
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
