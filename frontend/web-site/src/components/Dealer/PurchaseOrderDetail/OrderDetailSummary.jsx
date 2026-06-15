import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function OrderDetailSummary({
  orderData,
  rawSubtotal,
  depositAmount,
  remainingAmount,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Thẻ ghi chú và các yêu cầu tiêu chuẩn nông sản */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-xs">
        <h3 className="font-bold text-neutral-400 text-xs flex items-center gap-2 mb-4 uppercase tracking-wider">
          <AlertCircle className="w-4 h-4 text-neutral-400" /> GHI CHÚ & YÊU CẦU
        </h3>
        <div className="flex flex-col gap-3.5">
          {orderData.notes && orderData.notes.length > 0 ? (
            orderData.notes.map((note, index) => (
              <div
                key={index}
                className="flex gap-2.5 items-start text-xs font-semibold text-neutral-600"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span className="whitespace-pre-wrap leading-relaxed">{note}</span>
              </div>
            ))
          ) : (
            // Các tiêu chuẩn mặc định nếu không có ghi chú cụ thể từ backend
            <>
              <div className="flex gap-2.5 items-start text-xs font-semibold text-neutral-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  Rau đạt chuẩn VietGAP, có giấy chứng nhận kèm theo.
                </span>
              </div>
              <div className="flex gap-2.5 items-start text-xs font-semibold text-neutral-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  Hàng còn hạn dùng tối thiểu 7 ngày kể từ thời điểm nhận.
                </span>
              </div>
              <div className="flex gap-2.5 items-start text-xs font-semibold text-neutral-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  Sơ chế sạch sẽ, không giập nát, đóng gói theo quy chuẩn
                  5kg/túi.
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Thẻ tóm tắt thanh toán */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-xs flex flex-col justify-center">
        <div className="flex justify-between items-baseline pt-2">
          <span className="font-bold text-neutral-800 text-sm uppercase tracking-wider">
            Tổng tiền thanh toán
          </span>
          <div className="text-right">
            <span className="font-extrabold text-emerald-700 text-2xl">
              {rawSubtotal.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs text-emerald-700 font-extrabold ml-1 uppercase">
              VNĐ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
