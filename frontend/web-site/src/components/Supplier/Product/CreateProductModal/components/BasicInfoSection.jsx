import { Info, Loader2, Search } from "lucide-react";
import Section from "./Section";
import { labelCls, UNIT_OPTIONS } from "../constants";

const Req = () => <span className="text-red-500 ml-0.5">*</span>;

/**
 * Props:
 *   isPersonal           : boolean
 *   form                 : object
 *   set                  : (key, value) => void
 *   fieldErrors          : object
 *   saving               : boolean
 *   accentColor          : string
 *   inputClsMode         : string
 *   selectClsMode        : string
 *   // data
 *   categories           : Category[]
 *   products             : ProductMaster[]   (đã lọc bỏ đang bán)
 *   systemCategories     : Category[]
 *   loadingProducts      : boolean
 *   loadingSellingIds    : boolean
 *   selectedProductId    : string
 *   selectedSystemCategoryId : string
 *   // handlers
 *   onSelectProduct      : (id: string) => void
 *   onSelectSystemCategory : (id: string) => void
 *   setFieldErrors       : (fn) => void
 */
export default function BasicInfoSection({
  isPersonal,
  form,
  set,
  fieldErrors,
  saving,
  accentColor,
  inputClsMode,
  selectClsMode,
  categories,
  products,
  systemCategories,
  loadingProducts,
  loadingSellingIds,
  selectedProductId,
  selectedSystemCategoryId,
  onSelectProduct,
  onSelectSystemCategory,
  setFieldErrors,
}) {
  const isLoadingAny = loadingSellingIds || loadingProducts;

  const errCls = (field) =>
    fieldErrors[field] ? "!border-red-400 !bg-red-50 focus:!ring-red-300" : "";

  const ErrMsg = ({ field }) =>
    fieldErrors[field]
      ? <p className="text-xs text-red-500 mt-1">{fieldErrors[field]}</p>
      : null;

  return (
    <Section icon={<Info className={`w-4 h-4 ${accentColor}`} />} title="Thông tin cơ bản">

      {/* Danh mục */}
      <div className="mb-3">
        <label className={labelCls}>
          {isPersonal ? <>Danh mục cá nhân <Req /></> : <>Nhóm rau — danh mục <Req /></>}
        </label>
        <select
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          className={`${selectClsMode} ${errCls("category")}`}
          disabled={saving}
        >
          <option value="">
            {categories.length === 0
              ? (isPersonal ? "Bạn chưa có danh mục cá nhân nào" : "Đang tải danh mục...")
              : "— Chọn danh mục —"}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}{isPersonal ? " (cá nhân)" : ""}
            </option>
          ))}
        </select>
        <ErrMsg field="category" />
        {isPersonal && categories.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            Bạn cần tạo danh mục cá nhân trước. Hãy vào mục <strong>Danh mục</strong> để thêm mới.
          </p>
        )}
      </div>

      {/* ── Catalog mode: chọn product master ── */}
      {!isPersonal ? (
        <div className="mb-3">
          <label className={labelCls}>
            Sản phẩm có sẵn trong danh mục <Req />
          </label>

          {isLoadingAny ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Đang tải sản phẩm...
            </div>
          ) : (
            <>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  onSelectProduct(e.target.value);
                  if (fieldErrors.product_master) {
                    setFieldErrors((prev) => ({ ...prev, product_master: "" }));
                  }
                }}
                className={`${selectClsMode} ${fieldErrors.product_master ? "!border-red-400 !bg-red-50" : ""}`}
                disabled={saving || !form.category || products.length === 0}
              >
                {!form.category ? (
                  <option value="">— Chọn danh mục trước —</option>
                ) : products.length === 0 ? (
                  <option value="">Tất cả sản phẩm trong danh mục này đã được niêm yết</option>
                ) : (
                  products.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                  ))
                )}
              </select>
              <ErrMsg field="product_master" />
              {form.category && products.length === 0 && !isLoadingAny && (
                <p className="text-xs text-amber-600 mt-1">
                  Bạn đã niêm yết tất cả sản phẩm trong danh mục này.
                </p>
              )}
            </>
          )}
          <p className="text-xs text-zinc-400 mt-1">Chỉ hiển thị sản phẩm bạn chưa đang bán.</p>
        </div>

      ) : (
        /* ── Personal mode: nhập tên + unit + product master tham khảo ── */
        <>
          {/* Tên sản phẩm */}
          <div className="mb-3">
            <label className={labelCls}>Tên sản phẩm <Req /></label>
            <input
              type="text"
              placeholder="VD: Cà chua bi nhà kính loại A"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={`${inputClsMode} ${errCls("name")}`}
              disabled={saving}
            />
            <ErrMsg field="name" />
          </div>

          {/* Đơn vị tính */}
          <div className="mb-3">
            <label className={labelCls}>Đơn vị tính</label>
            <select
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              className={selectClsMode}
              disabled={saving}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>

          {/* Liên kết product master tham khảo */}
          <div className="mb-3 border border-dashed border-blue-200 rounded-lg p-3 bg-blue-50/40">
            <div className="flex items-center gap-1.5 mb-2">
              <Search className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-blue-700">
                Liên kết sản phẩm tham khảo
                <span className="ml-1 font-normal text-blue-400">(tùy chọn)</span>
              </span>
            </div>
            <p className="text-xs text-blue-600 mb-2">
              Chọn danh mục hệ thống để tìm sản phẩm tham khảo, giúp admin duyệt nhanh hơn.
            </p>

            {/* System category */}
            <div className="mb-2">
              <label className="text-xs text-zinc-400 block mb-1">Danh mục hệ thống</label>
              <select
                value={selectedSystemCategoryId}
                onChange={(e) => onSelectSystemCategory(e.target.value)}
                className={selectClsMode}
                disabled={saving}
              >
                <option value="">— Chọn danh mục hệ thống —</option>
                {systemCategories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Product master tham khảo */}
            {selectedSystemCategoryId && (
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Sản phẩm tham khảo</label>
                {loadingProducts ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang tải...
                  </div>
                ) : (
                  <select
                    value={selectedProductId}
                    onChange={(e) => onSelectProduct(e.target.value)}
                    className={selectClsMode}
                    disabled={saving || products.length === 0}
                  >
                    <option value="">— Không liên kết —</option>
                    {products.length === 0
                      ? <option disabled>Không có sản phẩm trong danh mục này</option>
                      : products.map((p) => (
                          <option key={p.id} value={String(p.id)}>{p.name}</option>
                        ))
                    }
                  </select>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Mô tả */}
      <div>
        <label className={labelCls}>Mô tả chi tiết</label>
        <textarea
          placeholder="Thông tin về đặc điểm, công dụng, cách bảo quản..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className={`${inputClsMode} resize-none`}
          disabled={saving}
        />
      </div>
    </Section>
  );
}
