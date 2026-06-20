import React from "react";
import { formatCurrency } from "./OrderItemRow";

/**
 * OrderSummary
 * Khối tóm tắt đơn hàng (tạm tính, phí vận chuyển, giảm giá, tổng cộng)
 * và nút "Đặt hàng".
 *
 * Props:
 * - itemCount: số lượng sản phẩm đã chọn
 * - subtotal: tạm tính
 * - shippingFee: phí vận chuyển (0 = miễn phí)
 * - discount: số tiền giảm giá (>= 0)
 * - total: tổng cộng
 * - onSubmit: () => void  -- gọi khi bấm "Đặt hàng"
 * - submitting: boolean -- trạng thái đang gửi đơn
 * - disabled: boolean -- disable nút đặt hàng (ví dụ chưa chọn địa chỉ)
 */
export default function OrderSummary({
  itemCount = 0,
  subtotal = 0,
  shippingFee = 0,
  discount = 0,
  total = 0,
  onSubmit,
  submitting = false,
  disabled = false,
}) {
  return (
    <section className="sticky top-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-800">
        Tóm tắt đơn hàng
      </h2>

      <dl className="space-y-3 text-sm">
        <Row label="Sản phẩm đã chọn" value={itemCount} />
        <Row label="Tạm tính" value={formatCurrency(subtotal)} />
        <Row
          label="Phí vận chuyển"
          value={shippingFee === 0 ? "Miễn phí" : formatCurrency(shippingFee)}
          valueClassName={shippingFee === 0 ? "text-emerald-600" : ""}
        />
        {discount > 0 && (
          <Row
            label="Giảm giá"
            value={`- ${formatCurrency(discount)}`}
            valueClassName="text-rose-500"
          />
        )}
      </dl>

      <div className="my-4 border-t border-slate-100" />

      <div className="mb-5 flex items-center justify-between">
        <span className="text-base font-bold text-slate-800">
          Tổng cộng
        </span>
        <span className="text-xl font-bold text-emerald-700">
          {formatCurrency(total)}
        </span>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || submitting}
        className="w-full rounded-xl bg-emerald-800 py-3 text-center font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting ? "Đang đặt hàng..." : "Đặt hàng"}
      </button>

      {disabled && !submitting && (
        <p className="mt-2 text-center text-xs text-rose-500">
          Vui lòng chọn địa chỉ nhận hàng trước khi đặt hàng
        </p>
      )}
    </section>
  );
}

function Row({ label, value, valueClassName = "" }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-medium text-slate-700 ${valueClassName}`}>
        {value}
      </dd>
    </div>
  );
}
