import { X, ShoppingBag, Star, ShieldCheck } from "lucide-react";

export default function ProductPreviewModal({ data, onClose }) {
  if (!data) return null;

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4 font-['Geist',sans-serif]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-[800px] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-sm font-bold text-neutral-600">
              Xem trước hiển thị trên Cửa hàng
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 md:p-8 flex-1">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Cột ảnh */}
            <div className="w-full md:w-1/2 flex flex-col gap-3">
              <div className="aspect-square rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50 relative">
                {data.thumbnail ? (
                  <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    No image
                  </div>
                )}
                {data.status !== "active" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Đang ẩn
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {data.images?.map((img) => (
                  <div key={img.id} className={`w-16 h-16 shrink-0 rounded-lg border overflow-hidden ${img.is_thumbnail ? "border-emerald-500" : "border-neutral-200"}`}>
                     <img src={img.image_url} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
              </div>
            </div>

            {/* Cột Info (giống giao diện User) */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div className="text-xs text-emerald-600 font-bold tracking-wide uppercase mb-2">
                {data.category_name || "Nông sản"}
              </div>
              <h1 className="text-2xl font-black text-neutral-900 leading-tight mb-2">
                {data.title}
              </h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-bold">{data.rating || "5.0"}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
                <div className="text-sm text-neutral-500">
                  Đã bán <span className="font-bold text-neutral-800">{data.sold || 0}</span>
                </div>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 mb-6">
                <div className="text-3xl font-black text-emerald-700">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(data.retail_price)}
                </div>
              </div>

              <div className="prose prose-sm prose-emerald text-neutral-600 mb-6">
                <p>{data.description || "Chưa có mô tả chi tiết."}</p>
              </div>

              <div className="bg-neutral-50 rounded-xl p-4 flex items-start gap-3 mb-6">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-neutral-800">Cam kết chất lượng</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Sản phẩm từ: {data.dealer?.store_name || "Cửa hàng"}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">Gốc: {data.supplier_product_name}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-neutral-100 flex gap-3 opacity-60 pointer-events-none">
                <button className="flex-1 h-12 bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                  <ShoppingBag className="w-5 h-5" /> Thêm vào giỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
