// src/components/OrderListError.jsx

/**
 * Trạng thái lỗi — hiển thị khi gọi API getOrders() thất bại.
 *
 * Props:
 * - message: string — nội dung lỗi muốn hiển thị
 * - onRetry: () => void — gọi lại API khi bấm "Thử lại"
 */
export default function OrderListError({ message, onRetry }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-200 bg-rose-50 px-6 py-16 text-center">
      <p className="text-sm font-medium text-rose-600">
        {message || "Không tải được danh sách đơn hàng."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl bg-emerald-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
      >
        Thử lại
      </button>
    </div>
  );
}
