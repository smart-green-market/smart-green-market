import { CheckCheck } from "lucide-react";
import Overlay from "../shared/Overlay";
import { fmtPrice } from "../utils";

export default function ConfirmOrderModal({
  approved, rejected, total,
  depositPct,
  totalAmount,
  loading,
  onClose,
  onConfirm,
}) {
  const depositAmount = Math.round(parseFloat(totalAmount) * depositPct / 100);

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 py-6 flex flex-col gap-4 items-center text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCheck size={26} className="text-emerald-700" />
          </div>
          <div className="w-full">
            <h2 className="text-lg font-bold text-gray-900">Xác nhận đơn hàng?</h2>
            <p className="text-sm text-neutral-500 mt-1">
              <span className="text-emerald-700 font-bold">{approved} sản phẩm duyệt</span>
              {rejected > 0 && <span className="text-red-500 font-bold">, {rejected} từ chối</span>}
              <span className="text-neutral-400"> / tổng {total}</span>
            </p>

            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-emerald-800 font-medium">Tiền cọc yêu cầu</span>
              <div className="text-right">
                <p className="text-base font-extrabold text-emerald-800">{fmtPrice(depositAmount)}</p>
                <p className="text-xs text-emerald-600">{depositPct}% tổng đơn</p>
              </div>
            </div>

            {rejected > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                Sản phẩm bị từ chối sẽ được thông báo đến người mua.
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Quay lại
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
