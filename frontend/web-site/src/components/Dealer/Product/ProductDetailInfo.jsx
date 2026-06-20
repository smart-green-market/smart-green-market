import { useState, useEffect } from "react";
import { Info, Edit3, CheckCircle2, X } from "lucide-react";
import { dealerProductService } from "../../../services/api/dealerProductService";
import { toast } from "sonner";
import { categoryService } from "../../../services/api/categoryService";

export default function ProductDetailInfo({ product, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [retailPrice, setRetailPrice] = useState(product?.retail_price || "");
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setTitle(product?.title || "");
    setDescription(product?.description || "");
    setRetailPrice(product?.retail_price || "");
    setCategoryId(product?.category_id || "");
  }, [product]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await categoryService.getAll();
        setCategories(cats || []);
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
      }
    };
    if (isEditing && categories.length === 0) {
      fetchCats();
    }
  }, [isEditing, categories.length]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedData = {
        title,
        description,
        retail_price: retailPrice,
        category: categoryId
      };
      const res = await dealerProductService.update(product.id, updatedData);
      toast.success("Cập nhật thông tin thành công!");
      setIsEditing(false);
      onUpdate({ ...product, ...updatedData, category_name: categories.find(c => String(c.id) === String(categoryId))?.name || product.category_name });
    } catch (error) {
      toast.error("Lỗi cập nhật thông tin sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle(product?.title || "");
    setDescription(product?.description || "");
    setRetailPrice(product?.retail_price || "");
    setCategoryId(product?.category_id || "");
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-xs relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-600" /> Thông tin trưng bày
        </h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-bold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 rounded-lg text-xs font-bold transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Lưu
            </button>
          </div>
        )}
      </div>

      {/* Thông tin gốc (ReadOnly) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-sky-50/50 rounded-xl border border-sky-100 text-xs">
        <div>
          <span className="block text-neutral-500 mb-1">Gốc từ NCC</span>
          <span className="font-bold text-sky-900">{product.supplier_product_name}</span>
        </div>
        <div>
          <span className="block text-neutral-500 mb-1">Đơn vị</span>
          <span className="font-bold text-sky-900">{product.supplier_product_unit}</span>
        </div>
        <div>
          <span className="block text-neutral-500 mb-1">Bảo quản (Ngày)</span>
          <span className="font-bold text-sky-900">{product.storage_duration_days} ngày</span>
        </div>
        <div>
          <span className="block text-neutral-500 mb-1">Nhiệt độ</span>
          <span className="font-bold text-sky-900">{product.min_storage_temp}°C - {product.max_storage_temp}°C</span>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Tên hiển thị trên Shop</label>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-emerald-300 rounded-xl px-3 py-2 text-sm font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            ) : (
              <p className="text-sm font-bold text-neutral-800 px-3 py-2 bg-neutral-50 rounded-xl border border-transparent">
                {product.title}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Danh mục</label>
            {isEditing ? (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-emerald-300 rounded-xl px-3 py-2 text-sm font-medium text-neutral-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-medium text-neutral-800 px-3 py-2 bg-neutral-50 rounded-xl border border-transparent">
                {product.category?.name || "Chưa phân loại"}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Giá bán lẻ (VNĐ)</label>
            {isEditing ? (
              <input
                type="number"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                className="w-full border border-emerald-300 rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            ) : (
              <p className="text-sm font-bold text-emerald-700 px-3 py-2 bg-neutral-50 rounded-xl border border-transparent">
                {new Intl.NumberFormat("vi-VN").format(product.retail_price || 0)} đ
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Mô tả sản phẩm</label>
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-emerald-300 rounded-xl px-3 py-2 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
            />
          ) : (
            <p className="text-sm text-neutral-600 px-3 py-2 bg-neutral-50 rounded-xl border border-transparent min-h-[100px] whitespace-pre-wrap">
              {product.description || "Chưa có mô tả chi tiết."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
