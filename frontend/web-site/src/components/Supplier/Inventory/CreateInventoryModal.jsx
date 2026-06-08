import { useState, useEffect } from "react";
import { X, RefreshCw, Info, Tag, ToggleLeft, ImageIcon, Lightbulb, Plus, CloudUpload } from "lucide-react";

/**
 * CreateInventoryModal — Standalone modal, không cần import Modal base
 * Props:
 *   isOpen    : boolean
 *   onClose   : () => void
 *   onConfirm : (formData) => void
 */
export default function CreateInventoryModal({ isOpen, onClose, onConfirm }) {
  const [status, setStatus] = useState("active");
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    name: "",
    group: "",
    sku: "AG-12345-LEAF",
    description: "",
    certification: "VietGAP",
    unit: "kg",
    shelfLife: "",
    wholesalePrice: "",
    retailPrice: "",
  });

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const generateSku = () => {
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    setForm((f) => ({ ...f, sku: `SU-${rand}-LEAF` }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...previews].slice(0, 3));
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirm = () => {
    onConfirm?.({ ...form, status, images });
    onClose();
  };

  const inputClass =
    "w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors placeholder:text-zinc-300";
  const selectClass =
    "w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors bg-white";
  const labelClass = "text-xs text-zinc-500 block mb-1";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "modalIn 0.18s ease-out both", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <div>
            <h2 className="text-emerald-950 text-lg font-bold font-['Geist',sans-serif]">
              Thêm Lô Hàng Mới
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Vui lòng điền đầy đủ các thông tin bắt buộc để niêm yết sản phẩm lên hệ thống.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors flex-shrink-0 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-px bg-neutral-100 mx-6 flex-shrink-0" />

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-[1fr_236px] gap-4">

            {/* ── Cột trái ── */}
            <div className="flex flex-col gap-4">

              {/* Thông tin cơ bản */}
              <div className="border border-zinc-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
                  <Info className="w-4 h-4 text-green-700 flex-shrink-0" />
                  <span className="text-sm font-semibold text-zinc-800">Thông tin cơ bản</span>
                </div>

                {/* Tên rau */}
                <div className="mb-3">
                  <label className={labelClass}>Tên rau (*)</label>
                  <input
                    type="text"
                    placeholder="Nhập tên sản phẩm (VD: Xà lách lụa)"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                  />
                </div>

                {/* Nhóm + SKU */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>Nhóm rau (*)</label>
                    <select
                      value={form.group}
                      onChange={(e) => setForm({ ...form, group: e.target.value })}
                      className={selectClass}
                    >
                      <option value="">Chọn nhóm rau</option>
                      <option>Rau lá</option>
                      <option>Rau củ</option>
                      <option>Rau quả</option>
                      <option>Rau thơm</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>SKU (Mã lô)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.sku}
                        onChange={(e) => setForm({ ...form, sku: e.target.value })}
                        className={inputClass}
                      />
                      <button
                        onClick={generateSku}
                        title="Tạo SKU mới"
                        className="px-2.5 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-500 hover:text-zinc-700 transition-colors flex-shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mô tả */}
                <div>
                  <label className={labelClass}>Mô tả chi tiết</label>
                  <textarea
                    placeholder="Thông tin về đặc điểm, công dụng, cách bảo quản..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              {/* Phân loại & Giá */}
              <div className="border border-zinc-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
                  <Tag className="w-4 h-4 text-green-700 flex-shrink-0" />
                  <span className="text-sm font-semibold text-zinc-800">Phân loại &amp; Giá</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>Số lượng (*)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.Count}
                        onChange={(e) => setForm({ ...form, Count: e.target.value })}
                        className={`${inputClass} pr-7`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Đơn vị tính (*)</label>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className={selectClass}
                    >
                      <option>kg</option>
                      <option>bó</option>
                      <option>cái</option>
                      <option>túi</option>
                      <option>hộp</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Thời hạn bảo quản</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Số ngày"
                        value={form.shelfLife}
                        onChange={(e) => setForm({ ...form, shelfLife: e.target.value })}
                        className={inputClass}
                      />
                      <span className="text-xs text-zinc-400 whitespace-nowrap">ngày</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Giá bán (*)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.wholesalePrice}
                        onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })}
                        className={`${inputClass} pr-7`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">đ</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Chứng nhận/Quy trình</label>
                    <select
                      value={form.certification}
                      onChange={(e) => setForm({ ...form, certification: e.target.value })}
                      className={selectClass}
                    >
                      <option>VietGAP</option>
                      <option>Organic</option>
                      <option>GlobalGAP</option>
                      <option>Hữu cơ</option>
                      <option>Bình thường</option>
                    </select>
                  </div>
                  {/* <div>
                    <label className={labelClass}>Giá bán lẻ</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.retailPrice}
                        onChange={(e) => setForm({ ...form, retailPrice: e.target.value })}
                        className={`${inputClass} pr-7`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">đ</span>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>

            {/* ── Cột phải ── */}
            <div className="flex flex-col gap-3">

              {/* Trạng thái */}
              <div className="border border-zinc-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
                  <ToggleLeft className="w-4 h-4 text-green-700 flex-shrink-0" />
                  <span className="text-sm font-semibold text-zinc-800">Trạng thái</span>
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      status === "active"
                        ? "border-green-600 bg-green-50"
                        : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modal-status"
                      value="active"
                      checked={status === "active"}
                      onChange={() => setStatus("active")}
                      className="mt-0.5 accent-green-700"
                    />
                    <div>
                      <div className="text-xs font-semibold text-green-900">Đang kinh doanh</div>
                      <div className="text-xs text-green-700 mt-0.5">Sản phẩm sẽ hiển thị trên hệ thống</div>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      status === "paused"
                        ? "border-green-600 bg-green-50"
                        : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modal-status"
                      value="paused"
                      checked={status === "paused"}
                      onChange={() => setStatus("paused")}
                      className="mt-0.5 accent-green-700"
                    />
                    <div>
                      <div className="text-xs font-semibold text-zinc-700">Tạm ngừng</div>
                      <div className="text-xs text-zinc-400 mt-0.5">Tạm thời ẩn khỏi danh sách bán</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Hình ảnh */}
              {/* <div className="border border-zinc-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-green-700 flex-shrink-0" />
                    <span className="text-sm font-semibold text-zinc-800">Hình ảnh</span>
                  </div>
                  <span className="text-xs text-zinc-400">Tối đa 3 ảnh</span>
                </div>

                <label className="border-2 border-dashed border-zinc-200 rounded-lg p-4 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors block mb-3 group">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={images.length >= 3}
                  />
                  <CloudUpload className="w-6 h-6 text-zinc-400 group-hover:text-green-600 mx-auto mb-1.5 transition-colors" />
                  <div className="text-xs font-medium text-zinc-600 group-hover:text-green-700 transition-colors">
                    Kéo thả hoặc Click để tải lên
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">PNG, JPG tối đa 2MB</div>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {images.map((src, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-zinc-100 relative group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-zinc-200 flex items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <Plus className="w-5 h-5 text-zinc-400" />
                    </label>
                  )}
                </div>
              </div> */}

              {/* Mẹo tối ưu */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex gap-2">
                  <Lightbulb className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-green-900 mb-1">Mẹo tối ưu</div>
                    <p className="text-xs text-green-700 leading-relaxed">
                      Sản phẩm có ảnh nền trắng và đầy đủ chứng nhận VietGAP thường có tỉ lệ chốt đơn cao hơn 45% so với sản phẩm thông thường.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-px bg-neutral-100 mx-6 flex-shrink-0" />
        <div className="px-6 py-4 flex justify-end gap-3 bg-stone-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg transition-colors"
          >
            Lưu sản phẩm
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}