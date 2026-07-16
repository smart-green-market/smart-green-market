import { Minus, Plus, ShoppingCart, Tag } from "lucide-react";
import { formatTierLabel } from "../../../utils/quantityDiscountUtils";

export default function ProductCard({
  product,
  inputQty = 0,
  previewPricing,
  onQtyChange,
  onQtyAdjust,
  onAddToCart,
}) {
  const tiers = product.quantityDiscountTiers || [];
  const hasDiscount = previewPricing?.discountPerUnit > 0;
  const basePrice = product.basePrice ?? product.price;
  const capacity = product.dailyProductionCapacity ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs hover:shadow-md hover:border-neutral-200 transition-all overflow-hidden flex flex-col justify-between">
      {/* Image Header */}
      <div className="relative w-full h-44 bg-neutral-50 flex items-center justify-center">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=300&auto=format&fit=crop";
          }}
        />
        <span className="absolute top-3 right-3 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-xs">
          {product.category?.name || "Rau củ"}
        </span>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-neutral-800 text-base line-clamp-1">
            {product.name}
          </h3>
          {product.supplier?.company_name && (
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {product.supplier.company_name}
            </p>
          )}
          <p className="text-xs text-neutral-400 mt-0.5 font-medium">
            Mã: {product.code} | Đơn vị: {product.unit}
          </p>
        </div>

        <div className="mt-4 flex justify-between items-baseline">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Giá nhập
            </p>
            {hasDiscount && inputQty > 0 ? (
              <div>
                <p className="text-xs text-neutral-400 line-through">
                  {Number(basePrice).toLocaleString("vi-VN")} đ
                </p>
                <p className="text-emerald-700 font-bold text-lg leading-tight mt-0.5">
                  {Number(previewPricing.unitPrice).toLocaleString("vi-VN")} đ
                </p>
              </div>
            ) : (
              <p className="text-emerald-700 font-bold text-lg leading-tight mt-0.5">
                {Number(product.price).toLocaleString("vi-VN")} đ
              </p>
            )}
          </div>
          {capacity > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                Năng lực SX/ngày
              </p>
              <p className="text-neutral-600 font-semibold text-xs leading-tight mt-0.5">
                ~{capacity.toLocaleString("vi-VN")} {product.unit}
              </p>
            </div>
          )}
        </div>

        {tiers.length > 0 && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1 mb-1">
              <Tag className="w-3 h-3" /> Ưu đãi theo số lượng
            </p>
            <ul className="space-y-0.5">
              {tiers.slice(0, 3).map((tier) => (
                <li key={tier.id} className="text-[11px] text-amber-800">
                  {formatTierLabel(tier)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-x-1.5 gap-y-2">
          <div className="flex items-center gap-1 min-w-0">
            <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden h-8 flex-shrink-0">
              <button
                type="button"
                onClick={() => onQtyAdjust(-1)}
                className="w-7 h-full bg-neutral-50 text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200 transition-colors font-bold text-xs flex items-center justify-center"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="text"
                value={inputQty}
                onChange={(e) => onQtyChange(e.target.value)}
                className="w-8 text-center text-xs font-bold h-full bg-transparent outline-none text-neutral-700"
              />
              <button
                type="button"
                onClick={() => onQtyAdjust(1)}
                className="w-7 h-full bg-neutral-50 text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200 transition-colors font-bold text-xs flex items-center justify-center"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-neutral-500 font-semibold select-none truncate">{product.unit}</span>
          </div>

          <button
            onClick={onAddToCart}
            className="flex-1 min-w-[70px] flex items-center justify-center gap-1 px-2.5 h-8 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Thêm</span>
          </button>
        </div>
      </div>
    </div>
  );
}
