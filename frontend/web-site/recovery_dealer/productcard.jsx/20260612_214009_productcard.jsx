import { Minus, Plus, ShoppingCart } from "lucide-react";

export default function ProductCard({
  product,
  inputQty = 0,
  onQtyChange,
  onQtyAdjust,
  onAddToCart,
}) {
  const isOverStock = inputQty > product.stock;

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
          <p className="text-xs text-neutral-400 mt-0.5 font-medium">
            Mã: {product.code} | Đơn vị: {product.unit}
          </p>
        </div>

        <div className="mt-4 flex justify-between items-baseline">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Giá nhập
            </p>
            <p className="text-emerald-700 font-bold text-lg leading-tight mt-0.5">
              {Number(product.price).toLocaleString("vi-VN")} đ
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Stock NCC
            </p>
            <p className="text-neutral-700 font-bold text-sm leading-tight mt-0.5">
              {product.stock.toLocaleString("vi-VN")} {product.unit} {"/tháng"}
            </p>
            
          </div>
        </div>

        {/* Quantity Selector and Add Button */}
        <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
          <div
            className={`flex items-center border rounded-lg overflow-hidden h-9 transition-colors ${
              isOverStock ? "border-red-500 bg-red-50/10" : "border-neutral-200"
            }`}
          >
            <button
              onClick={() => onQtyAdjust(-1)}
              className="px-2.5 h-full bg-neutral-50 text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200 transition-colors font-bold text-xs"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="text"
              value={inputQty}
              onChange={(e) => onQtyChange(e.target.value)}
              className={`w-12 text-center text-xs font-bold h-full bg-transparent outline-none ${
                isOverStock ? "text-red-600" : "text-neutral-700"
              }`}
            />
            <p>kg</p> 
            <button
              onClick={() => onQtyAdjust(1)}
              className="px-2.5 h-full bg-neutral-50 text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200 transition-colors font-bold text-xs"
            >
              <Plus className="w-3 h-3" />
            </button>
            
          </div>
           

          <button
            onClick={onAddToCart}
            className="flex items-center gap-1.5 px-4 h-9 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
           

            <ShoppingCart className="w-3.5 h-3.5" /> Thêm
          </button>
        </div>
      </div>
    </div>
  );
}
