import { useState, useEffect } from "react";
import { Edit3, X } from "lucide-react";
import { toast } from "sonner";
import { dealerProductService } from "../../../services/api/dealerProductService";

export default function EditProductModal({ data, onClose, onSave }) {
  const [title, setTitle] = useState(data?.title || "");
  const [description, setDescription] = useState(data?.description || "");
  const [retailPrice, setRetailPrice] = useState(data?.retail_price || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Tên sản phẩm không được để trống.");
      return;
    }
    if (!retailPrice) {
      toast.error("Giá bán lẻ không được để trống.");
      return;
    }

    setLoading(true);
    try {
      const updatedData = {
        title,
        description,
        retail_price: retailPrice
      };
      await dealerProductService.update(data.id, updatedData);
      toast.success("Cập nhật thông tin thành công!");
      onSave({ ...data, ...updatedData });
      onClose();
    } catch (error) {
      toast.error("Lỗi cập nhật thông tin sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4 font-['Geist',sans-serif]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-600" /> Sửa nhanh thông tin shop
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="bg-sky-50/40 border border-sky-100/50 rounded-xl p-3.5 mb-5 text-xs">
            <p className="font-bold text-sky-900 text-sm">Gốc: {data.supplier_product_name}</p>
            <p className="text-neutral-500 font-semibold mt-1">Danh mục: {data.category_name}</p>
            <p className="text-neutral-400 mt-0.5">Đơn vị tính: {data.supplier_product_unit}</p>
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
              Tên sản phẩm hiển thị trên shop
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-bold text-neutral-800"
              placeholder="VD: Cải thìa hữu cơ tươi..."
            />
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
              Giá bán lẻ (VNĐ / {data.supplier_product_unit})
            </label>
            <input
              type="number"
              value={retailPrice}
              onChange={(e) => setRetailPrice(e.target.value)}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-bold text-emerald-700"
              placeholder="VD: 45000"
            />
          </div>

          <div className="mb-2">
            <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
              Mô tả sản phẩm
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-medium text-neutral-700 resize-none"
              placeholder="Nhập mô tả chi tiết để thu hút khách hàng..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 bg-neutral-50 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-200/50 rounded-xl transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
