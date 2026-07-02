import { useEffect, useState } from "react";
import { X, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
    buyerOrder,
    handleApiError,
} from "../../../services/api/Buyer/buyerOrder";

export default function CancelOrderModal({
    isOpen,
    onClose,
    dealerSlug,
    order,
    onSuccess,
}) {
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setReason("");
            setReasonError("");
        }
    }, [isOpen]);

    if (!isOpen || !order) return null;

    const handleSubmit = async () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setReasonError("Vui lòng nhập lý do hủy đơn.");
            return;
        }

        try {
            setLoading(true);
            setReasonError("");
            await buyerOrder.cancel(dealerSlug, order.id, { reason: trimmed });
            toast.success("Đã hủy đơn hàng thành công.");
            onSuccess?.();
            onClose?.();
        } catch (error) {
            toast.error(handleApiError(error, "Không thể hủy đơn hàng."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
            <div className="mx-4 w-full max-w-md overflow-hidden rounded-xl border border-red-100 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                            <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Hủy đơn hàng</h3>
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

                <div className="space-y-4 px-6 py-4">
                    <p className="text-sm text-gray-600">
                        Bạn có chắc muốn hủy đơn{" "}
                        <span className="font-semibold text-gray-900">{order.order_code}</span>?
                        Đơn đang chờ đại lý xác nhận, hệ thống sẽ hoàn tồn kho sau khi hủy.
                    </p>

                    <div className="space-y-2">
                        <label
                            htmlFor="cancel-reason"
                            className="text-sm font-medium text-neutral-700"
                        >
                            Lý do hủy đơn <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="cancel-reason"
                            rows={4}
                            value={reason}
                            onChange={(event) => {
                                setReason(event.target.value);
                                if (reasonError) setReasonError("");
                            }}
                            placeholder="Nhập lý do hủy đơn..."
                            className={`w-full resize-none rounded-lg border px-4 py-3 text-sm text-zinc-900 outline-none transition focus:ring-2 ${
                                reasonError
                                    ? "border-red-400 focus:ring-red-200"
                                    : "border-stone-300 focus:ring-red-200"
                            }`}
                        />
                        {reasonError ? (
                            <p className="text-sm text-red-600">{reasonError}</p>
                        ) : null}
                    </div>
                </div>

                <div className="flex gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 cursor-pointer rounded-xl border border-neutral-300 px-4 py-2.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                    >
                        Đóng
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? "Đang xử lý..." : "Xác nhận hủy"}
                    </button>
                </div>
            </div>
        </div>
    );
}
