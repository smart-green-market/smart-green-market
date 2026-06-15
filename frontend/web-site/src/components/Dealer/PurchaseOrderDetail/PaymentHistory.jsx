import React from "react";
import { CreditCard, FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default function PaymentHistory({ payments }) {
  if (!payments || payments.length === 0) {
    return null;
  }

  const mapPaymentMethod = (method) => {
    const map = {
      bank_transfer: "Chuyển khoản",
      cash: "Tiền mặt",
      e_wallet: "Ví điện tử",
    };
    return map[method] || method;
  };

  const mapPaymentType = (type) => {
    const map = {
      deposit: "Đặt cọc",
      final_payment: "Thanh toán cuối",
    };
    return map[type] || type;
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100">
            <CheckCircle2 className="w-3 h-3" /> Đã duyệt
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-red-100">
            <AlertTriangle className="w-3 h-3" /> Từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-100">
            <Clock className="w-3 h-3 animate-pulse" /> Chờ duyệt
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs mb-6 overflow-hidden">
      {/* Tiêu đề bảng */}
      <div className="px-6 py-5 border-b border-neutral-50 flex items-center justify-between">
        <h2 className="font-extrabold text-neutral-900 text-base uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          LỊCH SỬ THANH TOÁN
        </h2>
        <span className="bg-neutral-50 text-neutral-600 px-3 py-0.5 rounded-full text-xs font-bold border border-neutral-100">
          {payments.length} lượt giao dịch
        </span>
      </div>

      {/* Nội dung danh sách thanh toán */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-neutral-700 font-bold text-xs uppercase tracking-wider border-b border-neutral-100">
              <th className="py-3.5 px-5 text-left whitespace-nowrap">Thời gian gửi</th>
              <th className="py-3.5 px-4 text-left whitespace-nowrap">Đợt thanh toán</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Số tiền</th>
              <th className="py-3.5 px-4 text-left whitespace-nowrap">Phương thức</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Biên lai</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Trạng thái</th>
              <th className="py-3.5 px-5 text-left whitespace-nowrap">Thông tin bổ sung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="hover:bg-neutral-50/50 transition-colors"
              >
                {/* Thời gian */}
                <td className="py-4 px-5 text-left font-medium text-neutral-500 whitespace-nowrap">
                  {new Date(payment.created_at).toLocaleString("vi-VN")}
                </td>

                {/* Đợt thanh toán */}
                <td className="py-4 px-4 text-left font-semibold text-neutral-800">
                  {mapPaymentType(payment.payment_type)}
                </td>

                {/* Số tiền */}
                <td className="py-4 px-4 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                  {Number(payment.amount).toLocaleString("vi-VN")} đ
                </td>

                {/* Phương thức */}
                <td className="py-4 px-4 text-left font-semibold text-neutral-600">
                  <div className="flex flex-col">
                    <span>{mapPaymentMethod(payment.payment_method)}</span>
                    {payment.payment_provider && (
                      <span className="text-[10px] text-neutral-400 font-bold uppercase">
                        {payment.payment_provider}
                      </span>
                    )}
                  </div>
                </td>

                {/* Biên lai */}
                <td className="py-4 px-4 text-center">
                  {payment.receipt_file ? (
                    <a
                      href={payment.receipt_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-100 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> Xem ảnh
                    </a>
                  ) : (
                    <span className="text-neutral-400 text-xs">Không có file</span>
                  )}
                </td>

                {/* Trạng thái */}
                <td className="py-4 px-4 text-center">
                  {renderStatusBadge(payment.status)}
                </td>

                {/* Lý do từ chối / Mã giao dịch */}
                <td className="py-4 px-5 text-left text-xs leading-relaxed max-w-xs">
                  <div className="flex flex-col gap-1">
                    {payment.transaction_code && (
                      <div>
                        <span className="font-medium text-neutral-400">Mã GD: </span>
                        <span className="font-bold text-neutral-700">{payment.transaction_code}</span>
                      </div>
                    )}
                    {payment.note && (
                      <div>
                        <span className="font-medium text-neutral-400">Ghi chú: </span>
                        <span className="font-medium text-neutral-600 italic">"{payment.note}"</span>
                      </div>
                    )}
                    {payment.status === "rejected" && payment.rejection_reason && (
                      <div className="bg-red-50 text-red-700 p-2 rounded-lg border border-red-100 mt-1 font-semibold">
                        Lý do từ chối: {payment.rejection_reason}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
