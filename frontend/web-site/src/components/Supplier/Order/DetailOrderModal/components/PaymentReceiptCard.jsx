import { CreditCard, ShieldCheck, Ban, Loader2, ZoomIn } from "lucide-react";
import { PAYMENT_TYPE, PAYMENT_METHOD } from "../constants";
import { fmtPrice, fmtDate } from "../utils";

export default function PaymentReceiptCard({
  payment,
  depositPercent,
  supplierBank,
  statusBadge,
  canVerify,
  verifyLoading,
  onZoom,
  onApprove,
  onReject,
}) {
  const isDeposit = payment.payment_type === "deposit";
  const title = isDeposit
    ? `Tiền cọc${depositPercent ? ` (${depositPercent}%)` : ""}`
    : "Thanh toán cuối";

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center gap-2 flex-wrap ${
        canVerify
          ? isDeposit ? "border-amber-100 bg-amber-50" : "border-emerald-100 bg-emerald-50"
          : "border-neutral-100 bg-neutral-50"
      }`}>
        <ShieldCheck
          size={15}
          className={canVerify ? (isDeposit ? "text-amber-600" : "text-emerald-700") : "text-neutral-400"}
        />
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
        {canVerify && (
          <span className="ml-auto text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200">
            Cần xác nhận
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
        {/* Hình ảnh chứng từ */}
        <div className="flex flex-col items-center gap-3 px-6 py-5">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide self-start">Hình ảnh chứng từ</p>
          {payment.receipt_file ? (
            <div className="relative w-full group cursor-pointer" onClick={() => onZoom(payment.receipt_file)}>
              <img
                src={payment.receipt_file}
                alt="Chứng từ thanh toán"
                className="w-full max-h-72 object-contain rounded-xl border border-neutral-200 bg-neutral-50"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center">
                <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </div>
          ) : (
            <div className="w-full h-40 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-neutral-400 text-xs gap-2">
              <CreditCard size={24} />
              Chưa có hình chứng từ
            </div>
          )}

          {canVerify && (
            <div className="flex gap-2 w-full mt-1">
              <button
                type="button"
                onClick={onReject}
                disabled={verifyLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                <Ban size={13} /> Từ chối
              </button>
              <button
                type="button"
                onClick={onApprove}
                disabled={verifyLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm shadow-emerald-200"
              >
                {verifyLoading
                  ? <><Loader2 size={13} className="animate-spin" /> Đang duyệt...</>
                  : <><ShieldCheck size={13} /> {isDeposit ? "Duyệt cọc" : "Duyệt thanh toán"}</>
                }
              </button>
            </div>
          )}
        </div>

        {/* Chi tiết thanh toán */}
        <div className="flex flex-col gap-4 px-6 py-5">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Chi tiết thanh toán</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Loại</span>
              <span className="text-sm font-semibold text-gray-900">
                {PAYMENT_TYPE[payment.payment_type] ?? payment.payment_type}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Phương thức</span>
              <span className="text-sm font-semibold text-gray-900">
                {PAYMENT_METHOD[payment.payment_method] ?? payment.payment_method}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Số tiền</span>
              <span className="text-xl font-extrabold text-emerald-800">{fmtPrice(payment.amount)}</span>
            </div>
            {payment.transaction_code && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Mã giao dịch</span>
                <span className="text-sm font-semibold text-gray-900 font-mono">{payment.transaction_code}</span>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Thời gian gửi</span>
              <span className="text-sm font-medium text-gray-700">{fmtDate(payment.paid_at)}</span>
            </div>
            {payment.verified_at && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Xác minh lúc</span>
                <span className="text-sm font-medium text-gray-700">{fmtDate(payment.verified_at)}</span>
              </div>
            )}
            {payment.note && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Ghi chú</span>
                <span className="text-sm text-gray-700 italic">{payment.note}</span>
              </div>
            )}
            {payment.rejection_reason && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-red-400 uppercase tracking-wide">Lý do từ chối</span>
                <span className="text-sm text-red-600">{payment.rejection_reason}</span>
              </div>
            )}
          </div>

          {supplierBank && (
            <div className="mt-auto bg-neutral-50 rounded-xl border border-neutral-200 px-4 py-3 flex flex-col gap-1.5">
              <p className="text-[11px] text-neutral-400 uppercase tracking-wide font-medium">Tài khoản nhận tiền</p>
              <p className="text-sm font-bold text-gray-900">{supplierBank.account_name}</p>
              <p className="text-xs text-neutral-500">{supplierBank.bank_name} · {supplierBank.account_number}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
