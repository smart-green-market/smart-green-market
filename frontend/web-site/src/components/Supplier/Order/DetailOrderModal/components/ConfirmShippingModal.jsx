import { Truck, Loader2 } from "lucide-react";
import Overlay from "../shared/Overlay";

export default function ConfirmShippingModal({ orderCode, loading, onClose, onConfirm }) {
  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 py-6 flex flex-col gap-4 items-center text-center">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
            <Truck size={26} className="text-blue-600" />
          </div>
          <div className="w-full">
            <h2 className="text-lg font-bold text-gray-900">Chuyển sang đang giao?</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Đơn <span className="font-semibold text-gray-800">{orderCode}</span> sẽ chuyển sang trạng thái{" "}
              <span className="font-semibold text-blue-600">Đang giao</span> và thông báo tới đại lý.
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Đang xử lý...</>
              : <><Truck size={14} /> Xác nhận giao hàng</>
            }
          </button>
        </div>
      </div>
    </Overlay>
  );
}
