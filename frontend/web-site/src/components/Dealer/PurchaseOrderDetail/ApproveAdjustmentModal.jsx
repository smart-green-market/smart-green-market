import { useState, useEffect } from "react";
import { X, CheckCircle } from "lucide-react";

export default function ApproveAdjustmentModal({
  isOpen,
  onClose,
  onConfirm,
  loading: externalLoading = false,
}) {
  const [note, setNote] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);

  const loading = externalLoading || internalLoading;

  useEffect(() => {
    if (!isOpen) {
      setNote("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmSubmit = async () => {
    try {
      setInternalLoading(true);
      await onConfirm?.({ note: note.trim() });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-150 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Xác nhận thay đổi đơn hàng</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-neutral-600 leading-relaxed">
            Bạn đồng ý xác nhận các thay đổi điều chỉnh từ Nhà cung cấp cho đơn hàng này?
          </p>

          <div className="space-y-1.5">
            <label htmlFor="adjustment-note" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Ghi chú phản hồi (không bắt buộc)
            </label>
            <textarea
              id="adjustment-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú phản hồi của bạn..."
              className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-neutral-300"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-neutral-100 bg-neutral-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 cursor-pointer rounded-xl border border-neutral-300 px-4 py-2.5 text-xs font-bold text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleConfirmSubmit}
            disabled={loading}
            className="flex-1 cursor-pointer rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:bg-neutral-300 text-xs font-bold text-white transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
