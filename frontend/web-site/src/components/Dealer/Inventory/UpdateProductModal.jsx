import { useState } from "react";
import { Tag, X, ClipboardList } from "lucide-react";

export default function UpdateProductModal({ data, onClose, onSave }) {
  // Helper to parse currency string (e.g., "30,000 đ" -> 30000)
  const parseCurrency = (str) => {
    if (!str) return 0;
    if (typeof str === "number") return str;
    return parseInt(str.replace(/[^0-9]/g, ""), 10) || 0;
  };

  const [adjustment, setAdjustment] = useState(0); // Số lượng hao hụt
  const [reason, setReason] = useState("");
  const [priceRetail, setPriceRetail] = useState(parseCurrency(data.priceRetail));
  const [discount, setDiscount] = useState(data.discount || 0);
  const [discountDate, setDiscountDate] = useState(data.discountDate || "");

  const handleSubmit = () => {
    const parsedShrinkage = parseInt(adjustment, 10) || 0;
    const finalStock = Math.max(0, data.stock - parsedShrinkage);
    
    // Auto-update status based on new stock level
    const finalStatus =
      finalStock === 0
        ? "Hết hàng"
        : finalStock <= 10
        ? "Sắp hết hàng"
        : "Còn hàng";

    // If stock is 0, freshness might be affected
    let finalFreshness = data.freshness;
    let finalFreshnessColor = data.freshnessColor;
    if (finalStock === 0) {
      finalFreshness = "Hết hàng";
      finalFreshnessColor = "text-red-650 bg-red-50";
    }

    const updated = {
      ...data,
      stock: finalStock,
      status: finalStatus,
      freshness: finalFreshness,
      freshnessColor: finalFreshnessColor,
      priceRetail: priceRetail.toLocaleString("vi-VN") + " đ",
      discount: parseInt(discount, 10) || 0,
      discountDate: discountDate || ""
    };

    onSave(updated);
    onClose();
  };

  return (
    // Overlay
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4 font-['Geist',sans-serif]"
      onClick={onClose}
    >
      {/* Modal box */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-600" /> Cập nhật Lô hàng {data.batchCode}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata banner */}
          <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-xl p-3.5 mb-5 text-xs">
            <p className="font-bold text-emerald-900 text-sm">{data.productName}</p>
            <p className="text-neutral-500 font-semibold mt-1">Phân loại: {data.category}</p>
            <p className="text-neutral-400 mt-0.5">Nhà cung cấp: {data.supplier}</p>
          </div>

          {/* Section: Cập nhật tồn kho & Hao hụt */}
          <div className="mb-6">
            <h3 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>Tồn kho & Hao hụt</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
                  Số lượng hiện tại
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={`${data.stock} ${data.unit}`}
                    disabled
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs bg-neutral-50 text-neutral-450 font-bold outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
                  Số lượng hao hụt ({data.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  max={data.stock}
                  value={adjustment}
                  onChange={(e) => setAdjustment(Math.min(data.stock, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-bold"
                />
              </div>
            </div>

            {adjustment > 0 && (
              <div className="mt-3">
                <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
                  Lý do hao hụt
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-medium"
                >
                  <option value="">Chọn lý do...</option>
                  <option value="damage">Hàng dập nát / hư hỏng</option>
                  <option value="expired">Quá hạn sử dụng</option>
                  <option value="recount">Chênh lệch khi kiểm kho</option>
                  <option value="return">Trả lại nhà cung cấp</option>
                </select>
              </div>
            )}
          </div>

          {/* Section: Cấu hình giá bán */}
          <div className="mb-6">
            <h3 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider mb-3">
              Giá bán lẻ sản phẩm
            </h3>
            <div>
              <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
                Giá bán hiện tại (VNĐ / {data.unit})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={priceRetail}
                  onChange={(e) => setPriceRetail(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full border border-neutral-200 rounded-xl pl-3 pr-12 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-bold text-emerald-800"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400">
                  VNĐ
                </span>
              </div>
            </div>
          </div>

          {/* Section: Áp dụng khuyến mãi */}
          <div className="mb-2">
            <h3 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chương trình khuyến mãi</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
                  Mức giảm giá (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
                  Thời gian áp dụng
                </label>
                <input
                  type="date"
                  value={discountDate}
                  onChange={(e) => setDiscountDate(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-medium text-neutral-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 bg-neutral-50 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-200/50 rounded-xl transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-100"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}