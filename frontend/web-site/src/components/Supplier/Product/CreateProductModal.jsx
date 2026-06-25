import { useState, useEffect } from "react";
import {
  X, Info, Tag, ToggleLeft, ImageIcon, Lightbulb,
  Plus, CloudUpload, Loader2, Thermometer, Star, User, Search,
} from "lucide-react";

import { categoryService } from "../../../services/api/categoryService";
import { productService } from "../../../services/api/productService";
import {
  parseSupplierApiErrors,
  validateProductForm,
  errorsToSummary,
  extractSupplierApiMessage,
} from "../../../utils/supplierValidation";
import { productMasterService } from "../../../services/api/Admin/productMasterService";
import  ConfirmModal  from "../../common/ConfirmModal"

const inputCls =
  "w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors placeholder:text-zinc-300 disabled:bg-zinc-50 disabled:text-zinc-400";
const selectCls =
  "w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors bg-white disabled:bg-zinc-50 disabled:text-zinc-400";
const labelCls = "text-xs text-zinc-500 block mb-1";

// Chặn ký tự không hợp lệ trong input số (e, E, +, -)
const blockInvalidNumberKeys = (e) => {
  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
};

// Chặn thêm dấu thập phân cho số nguyên
const blockDecimalKeys = (e) => {
  if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
};

const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "box", label: "thùng" },
  { value: "bunch", label: "bó" },
  { value: "piece", label: "cái / trái" },
];

/**
 * Props:
 *   isOpen    : boolean
 *   onClose   : () => void
 *   onSuccess : (createdProduct) => void
 *   mode      : "catalog" | "personal"
 */
export default function CreateProductModal({ isOpen, onClose, onSuccess, mode = "catalog" }) {
  const isPersonal = mode === "personal";

  const [form, setForm] = useState({
    name: "",
    unit: "kg",
    category: "",
    wholesale_price: "",
    daily_production_capacity: "",
    description: "",
    storage_duration_days: "",
    min_storage_temp: "",
    max_storage_temp: "",
  });

  const [images, setImages] = useState([]);
  const [thumbnailIdx, setThumbnailIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [categories, setCategories] = useState([]);

  // product masters
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");

  // personal mode: fetch system categories để lấy product masters
  const [systemCategories, setSystemCategories] = useState([]);
  const [selectedSystemCategoryId, setSelectedSystemCategoryId] = useState("");

  // ── Reset khi đóng / đổi mode ──────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setForm({
      name: "", unit: "kg", category: "", wholesale_price: "",
      daily_production_capacity: "", description: "",
      storage_duration_days: "", min_storage_temp: "", max_storage_temp: "",
    });
    setImages([]);
    setThumbnailIdx(0);
    setError(null);
    setFieldErrors({});
    setSelectedProductId("");
    setProducts([]);
    setSelectedSystemCategoryId("");
  }, [isOpen, mode]);

  // Escape
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

  // ── Fetch danh mục của supplier ─────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    categoryService
      .getsupplierCategories()
      .then((list) => {
        if (!cancelled) {
          const all = list ?? [];
          if (isPersonal) {
            setCategories(all.filter((c) => c.status === "active" && c.scope === "custom"));
          } else {
            setCategories(all.filter((c) => c.status === "active" && c.scope === "system"));
          }
        }
      })
      .catch(() => { if (!cancelled) setCategories([]); });
    return () => { cancelled = true; };
  }, [isOpen, isPersonal]);

  // ── Fetch system categories cho personal mode (để lấy product masters tham khảo) ──
  useEffect(() => {
    if (!isOpen || !isPersonal) return;
    let cancelled = false;
    categoryService
      .getsupplierCategories()
      .then((list) => {
        if (!cancelled) {
          const sysCats = (list ?? []).filter((c) => c.status === "active" && c.scope === "system");
          setSystemCategories(sysCats);
        }
      })
      .catch(() => { if (!cancelled) setSystemCategories([]); });
    return () => { cancelled = true; };
  }, [isOpen, isPersonal]);

  // ── Fetch product masters theo category ─────────────────────
  // catalog mode  → dùng form.category (system scope)
  // personal mode → dùng selectedSystemCategoryId (riêng, không ảnh hưởng form.category)
  useEffect(() => {
    const targetCategoryId = isPersonal ? selectedSystemCategoryId : form.category;

    if (!isOpen || !targetCategoryId) {
      setProducts([]);
      if (!isPersonal) setSelectedProductId("");
      return;
    }

    let cancelled = false;
    setLoadingProducts(true);
    productMasterService
      .getByCategory_id(targetCategoryId)
      .then((list) => {
        if (!cancelled) {
          const data = list || [];
          setProducts(data);

          if (!isPersonal) {
            // catalog: auto-select first nếu chưa có lựa chọn hợp lệ
            if (data.length > 0) {
              const stillExists = data.some((p) => String(p.id) === selectedProductId);
              if (stillExists) {
                const picked = data.find((p) => String(p.id) === selectedProductId);
                setForm((f) => ({ ...f, name: picked.name }));
              } else {
                setSelectedProductId(String(data[0].id));
                setForm((f) => ({ ...f, name: data[0].name }));
              }
            } else {
              setSelectedProductId("");
              setForm((f) => ({ ...f, name: "" }));
            }
          } else {
            // personal: reset selection mỗi khi đổi system category
            setSelectedProductId("");
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setSelectedProductId("");
          if (!isPersonal) setForm((f) => ({ ...f, name: "" }));
        }
      })
      .finally(() => { if (!cancelled) setLoadingProducts(false); });

    return () => { cancelled = true; };
  }, [isOpen, form.category, selectedSystemCategoryId, isPersonal]);

  if (!isOpen) return null;

  // ── Helpers ─────────────────────────────────────────────────
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((e) => ({ ...e, [k]: "" }));
    if (error) setError(null);
  };

  // Chỉ cho phép nhập số dương, không âm
  const setPositiveNumber = (k, rawVal) => {
    // Loại bỏ ký tự không phải số hoặc dấu chấm
    const cleaned = rawVal.replace(/[^0-9.]/g, "");
    set(k, cleaned);
  };

  const setPositiveInteger = (k, rawVal) => {
    const cleaned = rawVal.replace(/[^0-9]/g, "");
    set(k, cleaned);
  };

  // Nhiệt độ: cho phép số âm
  const setTemperature = (k, rawVal) => {
    // Cho phép: dấu âm ở đầu, chữ số, dấu chấm
    const cleaned = rawVal.replace(/[^0-9.\-]/g, "").replace(/(?!^)-/g, "");
    set(k, cleaned);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const toAdd = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...toAdd].slice(0, 5));
  };

  const removeImage = (idx) => {
    URL.revokeObjectURL(images[idx].preview);
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (thumbnailIdx >= next.length) setThumbnailIdx(Math.max(0, next.length - 1));
      return next;
    });
  };

  // ── Mở confirm trước khi submit ───────────────────────────
  const handleRequestSubmit = () => {
    setError(null);
    // Validate trước, nếu lỗi thì không mở confirm
    if (!form.category) {
      setFieldErrors({ category: "Vui lòng chọn danh mục." });
      setError("Vui lòng chọn danh mục.");
      return;
    }
    if (!isPersonal && !selectedProductId) {
      setError("Vui lòng chọn sản phẩm từ danh mục.");
      return;
    }
    if (isPersonal && !form.name.trim()) {
      setFieldErrors({ name: "Vui lòng nhập tên sản phẩm." });
      setError("Vui lòng nhập tên sản phẩm.");
      return;
    }
    const price = parseFloat(form.wholesale_price);
    const capacity = parseFloat(form.daily_production_capacity);
    const inlineErrors = {};
    if (!form.wholesale_price || isNaN(price) || price <= 0) {
      inlineErrors.wholesale_price = "Giá sỉ phải là số dương lớn hơn 0.";
    }
    if (!form.daily_production_capacity || isNaN(capacity) || capacity <= 0) {
      inlineErrors.daily_production_capacity = "Năng suất phải là số dương lớn hơn 0.";
    }
    const formErrs = validateProductForm(form);
    const allErrs = { ...formErrs, ...inlineErrors };
    if (Object.keys(allErrs).length) {
      setFieldErrors(allErrs);
      setError(errorsToSummary(allErrs) || "Vui lòng kiểm tra lại các trường có lỗi.");
      return;
    }
    // Mọi thứ hợp lệ → mở confirm
    setShowConfirm(true);
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);

    if (!form.category) {
      setFieldErrors({ category: "Vui lòng chọn danh mục." });
      setError("Vui lòng chọn danh mục.");
      return;
    }
    if (!isPersonal && !selectedProductId) {
      setError("Vui lòng chọn sản phẩm từ danh mục.");
      return;
    }
    if (isPersonal && !form.name.trim()) {
      setFieldErrors({ name: "Vui lòng nhập tên sản phẩm." });
      setError("Vui lòng nhập tên sản phẩm.");
      return;
    }

    // Validate giá và năng suất
    const price = parseFloat(form.wholesale_price);
    const capacity = parseFloat(form.daily_production_capacity);
    const inlineErrors = {};
    if (!form.wholesale_price || isNaN(price) || price <= 0) {
      inlineErrors.wholesale_price = "Giá sỉ phải là số dương lớn hơn 0.";
    }
    if (!form.daily_production_capacity || isNaN(capacity) || capacity <= 0) {
      inlineErrors.daily_production_capacity = "Năng suất phải là số dương lớn hơn 0.";
    }
    if (form.storage_duration_days !== "") {
      const days = parseInt(form.storage_duration_days, 10);
      if (isNaN(days) || days < 0) {
        inlineErrors.storage_duration_days = "Thời hạn bảo quản phải là số nguyên không âm.";
      }
    }
    if (form.min_storage_temp !== "" && form.max_storage_temp !== "") {
      const minT = parseFloat(form.min_storage_temp);
      const maxT = parseFloat(form.max_storage_temp);
      if (!isNaN(minT) && !isNaN(maxT) && minT > maxT) {
        inlineErrors.max_storage_temp = "Nhiệt độ tối đa phải lớn hơn hoặc bằng nhiệt độ tối thiểu.";
      }
    }

    const formErrs = validateProductForm(form);
    const allErrs = { ...formErrs, ...inlineErrors };
    if (Object.keys(allErrs).length) {
      setFieldErrors(allErrs);
      setError(errorsToSummary(allErrs) || "Vui lòng kiểm tra lại các trường có lỗi.");
      return;
    }

    setFieldErrors({});
    setSaving(true);

    try {
      // ── Build payload đúng theo API spec ──────────────────────
      // catalog:  { category, product_master, wholesale_price, daily_production_capacity, description? }
      // personal: { category, name, unit, wholesale_price, daily_production_capacity, description?, product_master? }
      const payload = {
        category: parseInt(form.category, 10),
        wholesale_price: form.wholesale_price,
        daily_production_capacity: form.daily_production_capacity,
      };

      if (form.description.trim()) payload.description = form.description.trim();
      if (form.storage_duration_days !== "") {
        payload.storage_duration_days = parseInt(form.storage_duration_days, 10);
      }
      if (form.min_storage_temp !== "") payload.min_storage_temp = parseFloat(form.min_storage_temp);
      if (form.max_storage_temp !== "") payload.max_storage_temp = parseFloat(form.max_storage_temp);

      if (isPersonal) {
        // personal: bắt buộc name + unit, product_master chỉ là id tham khảo (tùy chọn)
        payload.name = form.name.trim();
        payload.unit = form.unit;
        if (selectedProductId) {
          payload.product_master = parseInt(selectedProductId, 10);
        }
      } else {
        // catalog: chỉ cần product_master id
        payload.product_master = parseInt(selectedProductId, 10);
      }

      const newProduct = await productService.addProduct(payload);
      const productId = newProduct?.id;
      if (!productId) throw new Error("Không lấy được ID sản phẩm vừa tạo.");

      if (images.length > 0) {
        await Promise.all(
          images.map((img, index) => {
            const imageFd = new FormData();
            imageFd.append("supplier_product", productId);
            imageFd.append("images", img.file, img.file.name);
            imageFd.append("is_thumbnail", index === thumbnailIdx ? "true" : "false");
            imageFd.append("sort_order", index);
            return productService.addImageProduct(imageFd);
          })
        );
      }

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

  // ── UI tokens ───────────────────────────────────────────────
  const headerColor = isPersonal ? "text-blue-950" : "text-emerald-950";
  const accentColor = isPersonal ? "text-blue-700" : "text-green-700";
  const ringColor   = isPersonal ? "focus:ring-blue-500" : "focus:ring-green-600";
  const btnColor    = isPersonal ? "bg-blue-700 hover:bg-blue-800" : "bg-green-700 hover:bg-green-800";
  const tipBg       = isPersonal ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200";
  const tipText     = isPersonal ? "text-blue-700" : "text-green-700";
  const tipTitle    = isPersonal ? "text-blue-900" : "text-green-900";

  const inputClsMode  = inputCls.replace("focus:ring-green-600", ringColor);
  const selectClsMode = selectCls.replace("focus:ring-green-600", ringColor);

  const errCls = (field) => fieldErrors[field] ? "border-red-400 bg-red-50" : "";
  const ErrMsg = ({ field }) =>
    fieldErrors[field] ? <p className="text-xs text-red-500 mt-1">{fieldErrors[field]}</p> : null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => !saving && onClose()} />

      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "modalIn 0.18s ease-out both", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            {isPersonal && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-blue-700" />
              </div>
            )}
            <div>
              <h2 className={`${headerColor} text-lg font-bold`}>
                {isPersonal ? "Thêm Sản Phẩm Cá Nhân" : "Thêm Sản Phẩm Mới"}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isPersonal
                  ? "Sản phẩm do bạn tự đặt tên — sẽ chờ admin duyệt trước khi hiển thị."
                  : "Vui lòng điền đầy đủ các thông tin bắt buộc để niêm yết sản phẩm lên hệ thống."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors flex-shrink-0 ml-4 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badge mode */}
        {isPersonal && (
          <div className="mx-6 mb-2 flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              <User className="w-3 h-3" />
              Sản phẩm cá nhân — danh mục riêng của bạn
            </span>
          </div>
        )}

        <div className="h-px bg-neutral-100 mx-6 flex-shrink-0" />

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 flex items-start gap-2">
              <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-[1fr_236px] gap-4">

            {/* Cột trái */}
            <div className="flex flex-col gap-4">

              {/* Thông tin cơ bản */}
              <Section icon={<Info className={`w-4 h-4 ${accentColor}`} />} title="Thông tin cơ bản">

                {/* Danh mục */}
                <div className="mb-3">
                  <label className={labelCls}>
                    {isPersonal ? "Danh mục cá nhân (*)" : "Nhóm rau — danh mục (*)"}
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

                {/* catalog: chọn product master */}
                {!isPersonal ? (
                  <div className="mb-3">
                    <label className={labelCls}>Sản phẩm có sẵn trong danh mục (*)</label>
                    {loadingProducts ? (
                      <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang tải sản phẩm...
                      </div>
                    ) : (
                      <select
                        value={selectedProductId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedProductId(id);
                          const picked = products.find((p) => String(p.id) === id);
                          if (picked) {
                            set("name", picked.name);
                            if (picked.category) {
                              const catId = picked.category.id ?? picked.category;
                              if (catId) set("category", String(catId));
                            }
                          }
                        }}
                        className={selectClsMode}
                        disabled={saving || !form.category || products.length === 0}
                      >
                        {!form.category ? (
                          <option value="">— Chọn danh mục trước —</option>
                        ) : products.length === 0 ? (
                          <option value="">Không có sản phẩm trong danh mục này</option>
                        ) : (
                          products.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.name}
                            </option>
                          ))
                        )}
                      </select>
                    )}
                    <p className="text-xs text-zinc-400 mt-1">Chọn 1 sản phẩm có từ catalog để bán.</p>
                  </div>
                ) : (
                  /* personal: nhập tên + chọn product_master tham khảo */
                  <>
                    {/* Tên sản phẩm */}
                    <div className="mb-3">
                      <label className={labelCls}>Tên sản phẩm (*)</label>
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

                    {/* Đơn vị */}
                    {/* <div className="mb-3">
                      <label className={labelCls}>Đơn vị tính (*)</label>
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
                    </div> */}

                    {/* Tham khảo product master — dropdown có system category riêng */}
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

                      {/* Chọn system category */}
                      <div className="mb-2">
                        <label className="text-xs text-zinc-400 block mb-1">Danh mục hệ thống</label>
                        <select
                          value={selectedSystemCategoryId}
                          onChange={(e) => {
                            setSelectedSystemCategoryId(e.target.value);
                            setSelectedProductId("");
                            setProducts([]);
                          }}
                          className={selectClsMode}
                          disabled={saving}
                        >
                          <option value="">— Chọn danh mục hệ thống —</option>
                          {systemCategories.map((c) => (
                            <option key={c.id} value={String(c.id)}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Chọn product master */}
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
                              onChange={(e) => setSelectedProductId(e.target.value)}
                              className={selectClsMode}
                              disabled={saving || products.length === 0}
                            >
                              <option value="">— Không liên kết —</option>
                              {products.length === 0 ? (
                                <option disabled>Không có sản phẩm trong danh mục này</option>
                              ) : (
                                products.map((p) => (
                                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                                ))
                              )}
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

              {/* Phân loại & Năng suất */}
              <Section icon={<Tag className={`w-4 h-4 ${accentColor}`} />} title="Phân loại & Năng suất">
                <div className="grid grid-cols-2 gap-3">
                  {/* Giá sỉ */}
                  <div>
                    <label className={labelCls}>Giá sỉ (*)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="VD: 15000"
                        value={form.wholesale_price}
                        onKeyDown={blockDecimalKeys}
                        onChange={(e) => setPositiveInteger("wholesale_price", e.target.value)}
                        className={`${inputClsMode} pr-8 ${errCls("wholesale_price")}`}
                        disabled={saving}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">đ</span>
                    </div>
                    <ErrMsg field="wholesale_price" />
                  </div>

                  {/* Năng suất */}
                  <div>
                    <label className={labelCls}>Năng suất (*)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="VD: 500"
                        value={form.daily_production_capacity}
                        onKeyDown={blockInvalidNumberKeys}
                        onChange={(e) => setPositiveNumber("daily_production_capacity", e.target.value)}
                        className={`${inputClsMode} ${errCls("daily_production_capacity")}`}
                        disabled={saving}
                      />
                      <span className="text-xs text-zinc-400 whitespace-nowrap">kg/tháng</span>
                    </div>
                    <ErrMsg field="daily_production_capacity" />
                  </div>

                  {/* Thời hạn bảo quản */}
                  <div>
                    <label className={labelCls}>Thời hạn bảo quản</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Số ngày"
                        value={form.storage_duration_days}
                        onKeyDown={blockDecimalKeys}
                        onChange={(e) => setPositiveInteger("storage_duration_days", e.target.value)}
                        className={`${inputClsMode} ${errCls("storage_duration_days")}`}
                        disabled={saving}
                      />
                      <span className="text-xs text-zinc-400 whitespace-nowrap">ngày</span>
                    </div>
                    <ErrMsg field="storage_duration_days" />
                  </div>
                </div>
              </Section>

              {/* Nhiệt độ bảo quản */}
              <Section icon={<Thermometer className={`w-4 h-4 ${accentColor}`} />} title="Nhiệt độ bảo quản">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nhiệt độ tối thiểu</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="VD: 2"
                        value={form.min_storage_temp}
                        onKeyDown={(e) => ["e", "E", "+"].includes(e.key) && e.preventDefault()}
                        onChange={(e) => setTemperature("min_storage_temp", e.target.value)}
                        className={`${inputClsMode} pr-8 ${errCls("min_storage_temp")}`}
                        disabled={saving}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">°C</span>
                    </div>
                    <ErrMsg field="min_storage_temp" />
                  </div>
                  <div>
                    <label className={labelCls}>Nhiệt độ tối đa</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="VD: 8"
                        value={form.max_storage_temp}
                        onKeyDown={(e) => ["e", "E", "+"].includes(e.key) && e.preventDefault()}
                        onChange={(e) => setTemperature("max_storage_temp", e.target.value)}
                        className={`${inputClsMode} pr-8 ${errCls("max_storage_temp")}`}
                        disabled={saving}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">°C</span>
                    </div>
                    <ErrMsg field="max_storage_temp" />
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mt-2">Để trống nếu không có yêu cầu cụ thể.</p>
              </Section>
            </div>

            {/* Cột phải */}
            <div className="flex flex-col gap-3">
              {/* Ảnh */}
              <div className="border border-zinc-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <ImageIcon className={`w-4 h-4 ${accentColor} flex-shrink-0`} />
                    <span className="text-sm font-semibold text-zinc-800">Hình ảnh</span>
                  </div>
                  <span className="text-xs text-zinc-400">{images.length}/5 ảnh</span>
                </div>
                <label className={`border-2 border-dashed border-zinc-200 rounded-lg p-4 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors block mb-3 group ${saving || images.length >= 5 ? "opacity-50 pointer-events-none" : ""}`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={saving || images.length >= 5}
                  />
                  <CloudUpload className="w-6 h-6 text-zinc-400 group-hover:text-green-600 mx-auto mb-1.5 transition-colors" />
                  <div className="text-xs font-medium text-zinc-600 group-hover:text-green-700 transition-colors">Kéo thả hoặc Click để tải lên</div>
                  <div className="text-xs text-zinc-400 mt-0.5">PNG, JPG — tối đa 2MB/ảnh</div>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <div
                        className={`aspect-square rounded-lg overflow-hidden bg-zinc-100 border-2 transition-colors cursor-pointer ${thumbnailIdx === i ? "border-green-500" : "border-transparent"}`}
                        onClick={() => setThumbnailIdx(i)}
                      >
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      </div>
                      {thumbnailIdx === i && (
                        <div className="absolute top-1 left-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                          <Star className="w-2.5 h-2.5 text-white fill-white" />
                        </div>
                      )}
                      <button
                        onClick={() => removeImage(i)}
                        disabled={saving}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className={`aspect-square rounded-lg border-2 border-dashed border-zinc-200 flex items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors ${saving ? "opacity-50 pointer-events-none" : ""}`}>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={saving} />
                      <Plus className="w-5 h-5 text-zinc-400" />
                    </label>
                  )}
                </div>
                {images.length > 0 && (
                  <p className="text-xs text-zinc-400 mt-2 text-center">
                    Click ảnh để đặt làm <span className={`${accentColor} font-medium`}>ảnh đại diện</span>
                  </p>
                )}
              </div>

              {/* Tip */}
              <div className={`border rounded-xl p-3 ${tipBg}`}>
                <div className="flex gap-2">
                  <Lightbulb className={`w-4 h-4 ${accentColor} flex-shrink-0 mt-0.5`} />
                  <div>
                    <div className={`text-xs font-semibold mb-1 ${tipTitle}`}>
                      {isPersonal ? "Lưu ý sản phẩm cá nhân" : "Mẹo tối ưu"}
                    </div>
                    <p className={`text-xs leading-relaxed ${tipText}`}>
                      {isPersonal
                        ? "Sản phẩm cá nhân sẽ được admin xét duyệt. Đặt tên rõ ràng, kèm ảnh thực tế để được duyệt nhanh hơn."
                        : "Sản phẩm có ảnh nền trắng và đầy đủ thông tin nhiệt độ bảo quản thường được duyệt nhanh hơn."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trạng thái */}
              <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50">
                <div className="flex items-center gap-2 mb-1">
                  <ToggleLeft className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-zinc-600">Trạng thái sau khi tạo</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Sản phẩm mới sẽ ở trạng thái{" "}
                  <span className="font-semibold text-amber-600">Chờ duyệt</span>{" "}
                  và hiển thị sau khi admin phê duyệt.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            onClick={handleRequestSubmit}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white ${btnColor} rounded-lg transition-colors disabled:opacity-70 min-w-[130px] justify-center`}
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

    {/* ConfirmModal đặt ngoài wrapper z-50 để đè lên trên */}
    <ConfirmModal
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      onConfirm={handleSubmit}
      title={isPersonal ? "Xác nhận thêm sản phẩm cá nhân" : "Xác nhận thêm sản phẩm"}
      message={
        isPersonal
          ? `Sản phẩm "${form.name}" sẽ được gửi lên để admin xét duyệt. Bạn có chắc chắn muốn tiếp tục?`
          : "Sản phẩm sẽ được thêm vào danh sách chờ duyệt. Bạn có chắc chắn muốn tiếp tục?"
      }
      confirmText="Xác nhận lưu"
      cancelText="Kiểm tra lại"
      variant="warning"
      successMessage="Thêm sản phẩm thành công! Vui lòng chờ admin phê duyệt."
      errorMessage="Thêm sản phẩm thất bại. Vui lòng thử lại."
    />
    </>
  );
}

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