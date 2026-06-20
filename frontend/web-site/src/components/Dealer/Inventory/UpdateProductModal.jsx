import { useState, useEffect } from "react";
import { Tag, X, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { categoryService } from "../../../services/api/categoryService";
import { dealerProductService } from "../../../services/api/dealerProductService";

export default function UpdateProductModal({ data, onClose, onSave }) {


  const [adjustment, setAdjustment] = useState(0); // Số lượng hao hụt
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState(data.discount === undefined ? "" : data.discount);
  const [discountDate, setDiscountDate] = useState(data.discountDate || "");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(data.category || "");

  useEffect(() => {
    const fetchCats = async () => {
      setLoadingCategories(true);
      try {
        const cats = await categoryService.getAll();
        setCategories(cats || []);
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCats();
  }, []);

  const handleSubmit = async () => {
    const parsedShrinkage = parseInt(adjustment, 10) || 0;

    if (parsedShrinkage > 0) {
      if (!reason) {
        toast.error("Vui lòng chọn lý do hao hụt.", { position: "top-center", duration: 5000 },);
        return;
      }
      if (reason === "Khác" && !note.trim()) {
        toast.error("Vui lòng nhập chi tiết (Ghi chú) cho lý do Khác.", { position: "top-center", duration: 5000 },);
        return;
      }
    }

    // Lấy ID lô hàng và ID sản phẩm đại lý
    const batchId = data.originalData?.id;
    const dealerProductId = data.originalData?.dealer_product || data.originalData?.dealer_product_id;
    console.log("Shipment (lô hàng) ID:", batchId);
    console.log("Dealer Product ID:", dealerProductId);

    // Kiểm tra và thực hiện cập nhật danh mục nếu có thay đổi
    const categoryChanged = selectedCategory !== data.category;
    if (categoryChanged && selectedCategory) {
      const chosenCat = categories.find(c => c.name === selectedCategory);
      const categoryId = chosenCat ? chosenCat.id : null;

      if (dealerProductId && categoryId) {
        try {
          await dealerProductService.update(dealerProductId, {
            category: categoryId
          });
          toast.success("Cập nhật danh mục sản phẩm thành công!");
        } catch (error) {
          console.error("Lỗi khi cập nhật danh mục sản phẩm:", error);
          toast.error("Không thể cập nhật danh mục cho sản phẩm.");
          return; // Dừng xử lý nếu gọi API lỗi
        }
      }
    }

    const finalStock = Math.max(0, data.stock - parsedShrinkage);

    const finalStatus =
      finalStock === 0
        ? "Hết hàng"
        : finalStock <= 10
          ? "Sắp hết hàng"
          : "Còn hàng";

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
      category: selectedCategory,
      discount: parseInt(discount, 10) || 0,
      discountDate: discountDate || "",
      wastageData: parsedShrinkage > 0 ? {
        quantity: parsedShrinkage,
        reason: reason || "Khác",
        note: note
      } : null
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

          {/* Section: Chọn danh mục */}
          <div className="mb-5">
            <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
              Danh mục của lô hàng
            </label>
            {loadingCategories ? (
              <div className="text-xs text-neutral-400 font-medium">Đang tải danh mục...</div>
            ) : (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-medium text-neutral-700 bg-white"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") setAdjustment("");
                    else setAdjustment(Math.min(data.stock, Math.max(0, parseInt(val, 10) || 0)));
                  }}
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
                  <option value="" disabled>Chọn lý do...</option>
                  <option value="Hàng dập nát / hư hỏng">Hàng dập nát / hư hỏng</option>
                  <option value="Quá hạn sử dụng">Quá hạn sử dụng</option>
                  <option value="Chênh lệch khi kiểm kho">Chênh lệch khi kiểm kho</option>
                  <option value="Trả lại nhà cung cấp">Trả lại nhà cung cấp</option>
                  <option value="Khác">Khác</option>
                </select>
                <label className="text-xs font-bold text-neutral-600 mt-3 mb-1.5 block">
                  Chi tiết (Ghi chú)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows="2"
                  placeholder="Nhập chi tiết về tình trạng hao hụt..."
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-medium resize-none"
                />
              </div>
            )}
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") setDiscount("");
                    else setDiscount(Math.min(100, Math.max(0, parseInt(val, 10) || 0)));
                  }}
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