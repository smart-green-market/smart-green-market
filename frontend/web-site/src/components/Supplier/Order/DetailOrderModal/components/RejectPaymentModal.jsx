import { useState } from "react";
import { Ban } from "lucide-react";
import Overlay from "../shared/Overlay";

export default function RejectPaymentModal({ title, loading, onClose, onReject }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = () => {
    const trimmed = reason.trim();
    if (!trimmed) { setErr("Vui lòng nhập lý do từ chối"); return; }
    onReject(trimmed);
  };

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 py-6 flex flex-col gap-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <Ban size={26} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-4">{title}</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Hãy nhập lý do để thông báo đến đại lý.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setErr(""); }}
              placeholder="VD: Số tiền không khớp với yêu cầu"
              className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none resize-none transition-colors ${
                err ? "border-red-400" : "border-neutral-200 focus:border-red-400"
              }`}
            />
            {err && <p className="text-xs text-red-500">{err}</p>}
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
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
