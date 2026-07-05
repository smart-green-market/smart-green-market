import { ShoppingCart, Trash2, X, Check } from "lucide-react";

export default function DraftInvoice({
  cartItems = [],
  totalItemsCount = 0,
  rawSubtotal = 0,
  vatAmount = 0,
  discountAmount = 0,
  finalTotal = 0,
  onRemoveItem,
  onCancel,
  onCreate,
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <h2 className="font-bold text-neutral-800 text-sm flex items-center gap-2 mb-4 border-b border-neutral-50 pb-3 uppercase tracking-wider">
          <span className="p-1 bg-neutral-100 rounded-md text-neutral-600">
            <ShoppingCart className="w-4 h-4" />
          </span>
          Phiếu nhập dự thảo
        </h2>

        {/* Draft Items List */}
        {cartItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 font-medium">
            Chưa có sản phẩm nào được chọn.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-50 max-h-60 overflow-y-auto pr-1">
            {cartItems.map(({ product, quantity, subtotal, discountAmount }) => (
              <div
                key={product.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded-lg bg-neutral-50"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-neutral-800 text-xs line-clamp-1">
                    {product.name}
                  </h4>
                  <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                    {quantity} {product.unit} x{" "}
                    {Number(product.price).toLocaleString("vi-VN")} đ
                  </p>
                  {discountAmount > 0 && (
                    <p className="text-[10px] text-emerald-600 font-medium">
                      Giảm: -{Number(discountAmount).toLocaleString("vi-VN")} đ
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-bold text-neutral-800 text-xs">
                    {subtotal.toLocaleString("vi-VN")} đ
                  </span>
                  <button
                    onClick={() => onRemoveItem(product.id)}
                    className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calculations Summary */}
      <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-col gap-2.5">
        <div className="flex justify-between text-xs text-neutral-500 font-medium">
          <span>Tạm tính ({totalItemsCount} sản phẩm):</span>
          <span className="font-bold text-neutral-700">
            {rawSubtotal.toLocaleString("vi-VN")} đ
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-xs text-emerald-600 font-medium">
            <span>Đã giảm (theo SL):</span>
            <span className="font-bold">
              -{discountAmount.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}

        <div className="flex justify-between items-baseline mt-2 pt-3 border-t border-neutral-100">
          <span className="font-bold text-neutral-800 text-sm">
            Tổng cộng:
          </span>
          <span className="font-extrabold text-emerald-700 text-xl">
            {finalTotal.toLocaleString("vi-VN")} đ
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2.5 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 min-w-[100px] px-2 py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-800 rounded-xl min-h-[44px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Hủy đơn</span>
          </button>
          <button
            onClick={onCreate}
            className="flex-1 min-w-[130px] px-2 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl min-h-[44px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Tạo phiếu nhập</span>
          </button>
        </div>
      </div>
    </div>
  );
}
