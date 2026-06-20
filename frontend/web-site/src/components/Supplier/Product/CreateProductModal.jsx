
import { useState, useEffect } from "react";
import {
  X, Info, Tag, ToggleLeft, ImageIcon, Lightbulb,
  Plus, CloudUpload, Loader2, Thermometer, Star,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Import service  ← điều chỉnh đường dẫn nếu cần
// ─────────────────────────────────────────────────────────────
import { categoryService } from "../../../services/api/categoryService";
import { productService } from "../../../services/api/productService";
import {
  parseSupplierApiErrors,
  validateProductForm,
  errorsToSummary,
  extractSupplierApiMessage,
} from "../../../utils/supplierValidation";
// ─────────────────────────────────────────────────────────────
// API response schema (để tham khảo, không cần sửa)
// POST /supplier-products/  →  multipart/form-data
// {
//   id, status, name, slug, unit, description,
//   storage_duration_days, min_storage_temp, max_storage_temp,
//   verified_at, rejection_reason, created_at, updated_at,
//   supplier, category, verified_by,
//   images: [{ id, supplier_product, image_url, is_thumbnail, sort_order, created_at }]
// }
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Shared style tokens
// ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors placeholder:text-zinc-300 disabled:bg-zinc-50 disabled:text-zinc-400";
const selectCls =
  "w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors bg-white disabled:bg-zinc-50 disabled:text-zinc-400";
const labelCls = "text-xs text-zinc-500 block mb-1";

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
/**
 * Props:
 *   isOpen    : boolean
 *   onClose   : () => void
 *   onSuccess : (createdProduct) => void   ← nhận object từ API để parent reload list
 */
export default function CreateProductModal({ isOpen, onClose, onSuccess }) {
  // ── form state — key = tên field API ──────────────────────
  const [form, setForm] = useState({
    name: "",                  // API: name
    category: "",              // API: category (integer ID)
    wholesale_price: "",       // API: wholesale_price
    daily_production_capacity: "", // API: daily_production_capacity
    description: "",           // API: description
    storage_duration_days: "", // API: storage_duration_days
    min_storage_temp: "",      // API: min_storage_temp  (decimal string)
    max_storage_temp: "",      // API: max_storage_temp  (decimal string)
  });

  // ── images: [{ file: File, preview: string }] — tối đa 3 ──
  const [images, setImages] = useState([]);
  const [thumbnailIdx, setThumbnailIdx] = useState(0); // index ảnh thumbnail

  // ── misc ──
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [categories, setCategories] = useState([]); // fetch từ GET /categories/

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose, saving]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Cleanup object URLs
  useEffect(() => {
    return () => { images.forEach((img) => URL.revokeObjectURL(img.preview)); };
  }, [images]);

  // Fetch danh sách categories khi modal mở — dùng categoryService.getsupplierCategories()
  // GET /categories/ → res.data.results → [{ id, name, status }]
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    categoryService
      .getsupplierCategories()
      .then((list) => {
        if (!cancelled) setCategories(list ?? []);
      })
      .catch((err) => {
        console.error("[CreateProductModal] fetch categories error:", err);
        if (!cancelled) setCategories([]);
      });
    return () => { cancelled = true; };
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((e) => ({ ...e, [k]: "" }));
    if (error) setError(null);
  };

  // ── image handlers ──────────────────────────────────────────
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const toAdd = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((prev) => {
      const next = [...prev, ...toAdd].slice(0, 5);
      return next;
    });
  };

  const removeImage = (idx) => {
    URL.revokeObjectURL(images[idx].preview);
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (thumbnailIdx >= next.length) setThumbnailIdx(Math.max(0, next.length - 1));
      return next;
    });
  };

  // ── submit ──────────────────────────────────────────────────
  // ── submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);
    const errs = validateProductForm(form);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setError(errorsToSummary(errs));
      return;
    }
    setFieldErrors({});

    setSaving(true);
    try {
      // =========================================================
      // BƯỚC 1: GỬI THÔNG TIN SẢN PHẨM (TEXT) TRƯỚC
      // =========================================================
      const productFd = new FormData();
      const name = form.name.trim();
      const slug = Math.floor(1000000000 + Math.random() * 9000000000).toString();

      productFd.append("name", name);
      productFd.append("slug", slug);
      productFd.append("category", parseInt(form.category, 10));
      productFd.append("wholesale_price", form.wholesale_price);
      productFd.append("daily_production_capacity", parseFloat(form.daily_production_capacity));
      if (form.description.trim()) productFd.append("description", form.description.trim());
      if (form.storage_duration_days !== "") productFd.append("storage_duration_days", parseInt(form.storage_duration_days, 10));
      if (form.min_storage_temp !== "") productFd.append("min_storage_temp", form.min_storage_temp);
      if (form.max_storage_temp !== "") productFd.append("max_storage_temp", form.max_storage_temp);

      // Gọi API tạo sản phẩm
      const newProduct = await productService.addProduct(productFd);

      // Lấy ID của sản phẩm vừa tạo thành công
      // (Tùy thuộc vào Backend trả về, thường sẽ nằm ở newProduct.id hoặc newProduct.data.id)
      const productId = newProduct?.id;

      if (!productId) {
        throw new Error("Tạo sản phẩm thành công nhưng không lấy được ID để upload ảnh.");
      }

      // =========================================================
      // BƯỚC 2: DÙNG ID SẢN PHẨM ĐỂ UPLOAD LẦN LƯỢT CÁC ẢNH
      // =========================================================
      if (images.length > 0) {
        // Tạo ra một mảng chứa các Promise upload ảnh
        const uploadPromises = images.map((img, index) => {
          const imageFd = new FormData();

          // Gắn ID sản phẩm vào ảnh (Tên key 'supplier_product' phải khớp với Backend)
          imageFd.append("supplier_product", productId);
          imageFd.append("images", img.file, img.file.name);

          // Đánh dấu ảnh nào là thumbnail (nếu BE có hỗ trợ trường này)
          imageFd.append("is_thumbnail", index === thumbnailIdx ? "true" : "false");
          imageFd.append("sort_order", index);

          // Trả về request upload (chưa chạy ngay)
          return productService.addImageProduct(imageFd);
        });

        // Chạy song song tất cả các request upload ảnh
        await Promise.all(uploadPromises);
      }

      // Báo về Component cha (Product.jsx) để load lại danh sách mới
      onSuccess?.(newProduct);
      onClose();

    } catch (err) {
      console.error("[CreateProductModal] submit error:", err);
      const parsed = parseSupplierApiErrors(err?.response?.data, {
        fallback: "Lưu sản phẩm thất bại. Vui lòng kiểm tra lại thông tin.",
      });
      if (Object.keys(parsed.fieldErrors).length) setFieldErrors(parsed.fieldErrors);
      setError(parsed.general || parsed.summary || extractSupplierApiMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => !saving && onClose()} />

      {/* Panel */}
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "modalIn 0.18s ease-out both", maxHeight: "92vh" }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <div>
            <h2 className="text-emerald-950 text-lg font-bold">Thêm Sản Phẩm Mới</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Vui lòng điền đầy đủ các thông tin bắt buộc để niêm yết sản phẩm lên hệ thống.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors flex-shrink-0 ml-4 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-px bg-neutral-100 mx-6 flex-shrink-0" />

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* Error banner */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 flex items-start gap-2">
              <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-[1fr_236px] gap-4">

            {/* ── Cột trái ── */}
            <div className="flex flex-col gap-4">

              {/* Thông tin cơ bản */}
              <Section icon={<Info className="w-4 h-4 text-green-700" />} title="Thông tin cơ bản">

                {/* name */}
                <div className="mb-3">
                  <label className={labelCls}>Tên sản phẩm (*)</label>
                  <input
                    type="text"
                    placeholder="Nhập tên sản phẩm (VD: Xà lách lụa)"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className={`${inputCls} ${fieldErrors.name ? "border-red-400 bg-red-50" : ""}`}
                    disabled={saving}
                  />
                  {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
                </div>

                {/* category */}
                <div className="mb-3">
                  <label className={labelCls}>Nhóm rau — danh mục (*)</label>
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className={`${selectCls} ${fieldErrors.category ? "border-red-400 bg-red-50" : ""}`}
                    disabled={saving}
                  >
                    <option value="">
                      {categories.length === 0 ? "Đang tải danh mục..." : "Chọn nhóm rau"}
                    </option>
                    {categories
                      .filter((c) => c.status === "active")
                      .map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  {fieldErrors.category && <p className="text-xs text-red-500 mt-1">{fieldErrors.category}</p>}
                </div>

                {/* description */}
                <div>
                  <label className={labelCls}>Mô tả chi tiết</label>
                  <textarea
                    placeholder="Thông tin về đặc điểm, công dụng, cách bảo quản..."
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    className={`${inputCls} resize-none`}
                    disabled={saving}
                  />
                </div>
              </Section>

              {/* Phân loại & Năng suất */}
              <Section icon={<Tag className="w-4 h-4 text-green-700" />} title="Phân loại & Năng suất">
                <div className="grid grid-cols-2 gap-3">

                  {/* wholesale_price */}
                  <div>
                    <label className={labelCls}>Giá sỉ (*)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="VD: 15000"
                        value={form.wholesale_price}
                        onChange={(e) => set("wholesale_price", e.target.value)}
                        className={`${inputCls} pr-8 ${fieldErrors.wholesale_price ? "border-red-400 bg-red-50" : ""}`}
                        disabled={saving}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">đ</span>
                    </div>
                    {fieldErrors.wholesale_price && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.wholesale_price}</p>
                    )}
                  </div>

                  {/* daily_production_capacity */}
                  <div>
                    <label className={labelCls}>Năng suất (*)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="VD: 500"
                        value={form.daily_production_capacity}
                        onChange={(e) => set("daily_production_capacity", e.target.value)}
                        className={`${inputCls} ${fieldErrors.daily_production_capacity ? "border-red-400 bg-red-50" : ""}`}
                        disabled={saving}
                      />
                      <span className="text-xs text-zinc-400 whitespace-nowrap">kg/tháng</span>
                    </div>
                    {fieldErrors.daily_production_capacity && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.daily_production_capacity}</p>
                    )}
                  </div>

                  {/* storage_duration_days */}
                  <div>
                    <label className={labelCls}>Thời hạn bảo quản</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Số ngày"
                        value={form.storage_duration_days}
                        onChange={(e) => set("storage_duration_days", e.target.value)}
                        className={`${inputCls} ${fieldErrors.storage_duration_days ? "border-red-400 bg-red-50" : ""}`}
                        disabled={saving}
                      />
                      <span className="text-xs text-zinc-400 whitespace-nowrap">ngày</span>
                    </div>
                    {fieldErrors.storage_duration_days && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.storage_duration_days}</p>
                    )}
                  </div>
                </div>
              </Section>

              {/* Nhiệt độ bảo quản */}
              <Section icon={<Thermometer className="w-4 h-4 text-green-700" />} title="Nhiệt độ bảo quản">
                <div className="grid grid-cols-2 gap-3">

                  {/* min_storage_temp */}
                  <div>
                    <label className={labelCls}>Nhiệt độ tối thiểu</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="VD: 2"
                        value={form.min_storage_temp}
                        onChange={(e) => set("min_storage_temp", e.target.value)}
                        className={`${inputCls} pr-8 ${fieldErrors.min_storage_temp ? "border-red-400 bg-red-50" : ""}`}
                        disabled={saving}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">°C</span>
                    </div>
                    {fieldErrors.min_storage_temp && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.min_storage_temp}</p>
                    )}
                  </div>

                  {/* max_storage_temp */}
                  <div>
                    <label className={labelCls}>Nhiệt độ tối đa</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="VD: 8"
                        value={form.max_storage_temp}
                        onChange={(e) => set("max_storage_temp", e.target.value)}
                        className={`${inputCls} pr-8 ${fieldErrors.max_storage_temp ? "border-red-400 bg-red-50" : ""}`}
                        disabled={saving}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">°C</span>
                    </div>
                    {fieldErrors.max_storage_temp && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.max_storage_temp}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  Để trống nếu không có yêu cầu nhiệt độ bảo quản cụ thể.
                </p>
              </Section>
            </div>

            {/* ── Cột phải ── */}
            <div className="flex flex-col gap-3">

              {/* Hình ảnh — tối đa 3, chọn thumbnail */}
              <div className="border border-zinc-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-green-700 flex-shrink-0" />
                    <span className="text-sm font-semibold text-zinc-800">Hình ảnh</span>
                  </div>
                  <span className="text-xs text-zinc-400">{images.length}/5 ảnh</span>
                </div>

                {/* Drop zone */}
                <label
                  className={`border-2 border-dashed border-zinc-200 rounded-lg p-4 text-center cursor-pointer
                    hover:border-green-400 hover:bg-green-50 transition-colors block mb-3 group
                    ${saving || images.length >= 5 ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={saving || images.length >= 3}
                  />
                  <CloudUpload className="w-6 h-6 text-zinc-400 group-hover:text-green-600 mx-auto mb-1.5 transition-colors" />
                  <div className="text-xs font-medium text-zinc-600 group-hover:text-green-700 transition-colors">
                    Kéo thả hoặc Click để tải lên
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">PNG, JPG — tối đa 2MB/ảnh</div>
                </label>

                {/* Preview grid */}
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <div
                        className={`aspect-square rounded-lg overflow-hidden bg-zinc-100 border-2 transition-colors cursor-pointer
                          ${thumbnailIdx === i ? "border-green-500" : "border-transparent"}`}
                        onClick={() => setThumbnailIdx(i)}
                        title="Đặt làm ảnh đại diện"
                      >
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      </div>

                      {/* Thumbnail star badge */}
                      {thumbnailIdx === i && (
                        <div className="absolute top-1 left-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                          <Star className="w-2.5 h-2.5 text-white fill-white" />
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={() => removeImage(i)}
                        disabled={saving}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center
                          opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}

                  {/* Add slot */}
                  {images.length < 5 && (
                    <label
                      className={`aspect-square rounded-lg border-2 border-dashed border-zinc-200 flex items-center justify-center
                        cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors
                        ${saving ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={saving}
                      />
                      <Plus className="w-5 h-5 text-zinc-400" />
                    </label>
                  )}
                </div>

                {images.length > 0 && (
                  <p className="text-xs text-zinc-400 mt-2 text-center">
                    Click ảnh để đặt làm <span className="text-green-700 font-medium">ảnh đại diện</span>
                  </p>
                )}
              </div>

              {/* Mẹo tối ưu */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex gap-2">
                  <Lightbulb className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-green-900 mb-1">Mẹo tối ưu</div>
                    <p className="text-xs text-green-700 leading-relaxed">
                      Sản phẩm có ảnh nền trắng và đầy đủ thông tin nhiệt độ bảo quản thường được duyệt nhanh hơn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ghi chú trạng thái */}
              <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50">
                <div className="flex items-center gap-2 mb-1">
                  <ToggleLeft className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-zinc-600">Trạng thái sau khi tạo</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Sản phẩm mới sẽ ở trạng thái <span className="font-semibold text-amber-600">Chờ duyệt</span> và hiển thị sau khi admin phê duyệt.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="h-px bg-neutral-100 mx-6 flex-shrink-0" />
        <div className="px-6 py-4 flex justify-end gap-3 bg-stone-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg transition-colors disabled:opacity-70 min-w-[130px] justify-center"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</>
            ) : (
              "Lưu sản phẩm"
            )}
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

// ─────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────
function Section({ icon, title, children }) {
  return (
    <div className="border border-zinc-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
        {icon}
        <span className="text-sm font-semibold text-zinc-800">{title}</span>
      </div>
      {children}
    </div>
  );
}