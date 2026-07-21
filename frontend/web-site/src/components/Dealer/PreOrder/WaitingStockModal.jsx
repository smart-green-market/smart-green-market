import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  PackageSearch,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { dealerProductService } from "../../../services/api/dealerProductService";

export default function WaitingStockModal({ isOpen, onClose, dealerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!dealerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await dealerProductService.getWaitingStock(dealerId);
      setData(res);
    } catch (err) {
      console.error("Lỗi tải thống kê sản phẩm đặt trước:", err);
      setError("Không thể tải thông tin thống kê. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && dealerId) {
      fetchData();
    }
  }, [isOpen, dealerId]);

  if (!isOpen) return null;

  const results = data?.results || [];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs font-['Geist',sans-serif] animate-in fade-in duration-200">
      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl border border-neutral-100 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top gradient border for premium aesthetic */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-stone-50/50 mt-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <PackageSearch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-stone-900 tracking-tight">
                Thống kê nông sản đặt trước (Chờ nhập hàng)
              </h2>
              <p className="text-xs font-medium text-stone-500 mt-0.5">
                Danh sách nông sản đang có nhu cầu đặt trước vượt tồn kho hiện tại.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-stone-500 hover:text-emerald-600 hover:bg-stone-100 rounded-xl transition-all disabled:opacity-50"
              title="Làm mới"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-200 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-9 h-9 text-emerald-600 animate-spin mb-4" />
              <p className="text-sm font-semibold text-stone-500">
                Đang tổng hợp danh sách đặt trước...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-700">{error}</p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Thử lại
              </button>
            </div>
          ) : (
            /* Product Table */
            <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left whitespace-nowrap text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      <th className="px-5 py-4">Nông sản</th>
                      <th className="px-5 py-4 text-center">Tồn khả dụng</th>
                      <th className="px-5 py-4 text-center">Nhu cầu chờ</th>
                      <th className="px-5 py-4 text-center">Đơn chờ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-stone-500 font-medium">
                          Chưa có sản phẩm nào đang chờ nhập hàng.
                        </td>
                      </tr>
                    ) : (
                      results.map((row) => {
                        const images = row.images || [];
                        const imgUrl =
                          row.thumbnail ||
                          images.find((img) => img.is_thumbnail)?.image_url ||
                          images[0]?.image_url;

                        const isDepleted = Number(row.available_quantity || 0) <= 0;

                        return (
                          <tr key={row.id} className="hover:bg-emerald-50/10 transition-colors">
                            {/* Product Information */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center shrink-0">
                                  {imgUrl ? (
                                    <img
                                      src={imgUrl}
                                      alt={row.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="text-[10px] font-semibold text-stone-400">N/A</div>
                                  )}
                                </div>
                                <div className="flex flex-col whitespace-normal max-w-sm">
                                  <span className="font-bold text-stone-800 text-xs line-clamp-1" title={row.title}>
                                    {row.title}
                                  </span>
                                  <span className="text-[10px] text-stone-400 mt-0.5">
                                    {row.category?.name || "Chưa phân loại"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Available Quantity */}
                            <td className="px-5 py-4 text-center">
                              {isDepleted ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                  Hết hàng
                                </span>
                              ) : (
                                <span className="font-semibold text-stone-600 bg-stone-100 px-2 py-1 rounded-md text-[10px]">
                                  {row.available_quantity} {row.supplier_product_unit || "kg"}
                                </span>
                              )}
                            </td>

                            {/* Waiting Stock Quantity */}
                            <td className="px-5 py-4 text-center">
                              <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-[10px] border border-emerald-100">
                                {row.waiting_stock_quantity} {row.supplier_product_unit || "kg"}
                              </span>
                            </td>

                            {/* Waiting Order Count */}
                            <td className="px-5 py-4 text-center">
                              <span className="font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-md text-[10px]">
                                {row.waiting_stock_order_count}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-stone-100 bg-stone-50/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
