import React from "react";
import { ShoppingBag } from "lucide-react";

/**
 * CheckoutHeader
 * Tiêu đề đầu trang đặt hàng.
 */
export default function CheckoutHeader() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <ShoppingBag size={22} />
      </span>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Đặt hàng</h1>
        <p className="text-sm text-slate-400">
          Kiểm tra thông tin trước khi hoàn tất đơn hàng
        </p>
      </div>
    </div>
  );
}
