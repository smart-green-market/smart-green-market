import { useState, useEffect, useRef } from "react";
import {
  X, Check, ChevronLeft, ChevronRight, ZoomIn,
  Package, Tag, Thermometer, ShieldCheck,
  Calendar, Hash, AlertCircle, CheckCircle,
  XCircle, Loader2, Pencil, Save, Ban, Lock, LockOpen, ImageIcon, CircleDotDashed, Edit
} from "lucide-react";
import { productService } from "../../../services/api/productService";
import UpdateProductImagesModal from "./UpdateProductImagesModal";
import {
  parseSupplierApiErrors,
  validateProductForm,
  errorsToSummary,
  extractSupplierApiMessage,
} from "../../../utils/supplierValidation";
import {
  canLockProduct,
  canUnlockProduct,
} from "./productSellingUtils";
import { farmingProcessService } from "../../../services/api/cultivationService";
import { parseCultivationList } from "../Cultivation/cultivationUtils";
import CreateCultivationModal from "../Cultivation/CreateCultivationModal"
import EditCultivationModal from "../Cultivation/EditCultivationModal";
/* ─── Status helpers ─── */
const STATUS_MAP = {
  pending: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Đã duyệt", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected: { label: "Từ chối", color: "bg-red-100 text-red-700 border-red-200" },
  active: { label: "Đang bán", color: "bg-green-100 text-green-700 border-green-200" },
  inactive: { label: "Ngừng bán", color: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] ?? { label: status, color: "bg-zinc-100 text-zinc-500 border-zinc-200" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.color}`}>
      {status === "pending" && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === "approved" && <CheckCircle className="w-3 h-3" />}
      {status === "rejected" && <XCircle className="w-3 h-3" />}
      {s.label}
    </span>
  );
};

/* ─── Read-only field (locked) ─── */
function LockedField({ label, value, children }) {
  return (
    <div className="group relative">
      <div className="text-xs text-zinc-400 mb-0.5 flex items-center gap-1">
        <Lock className="w-3 h-3" />
        {label}
      </div>
      <div className="flex items-center gap-2 min-h-[28px]">
        {children ?? (
          <span className="text-sm font-mono font-semibold text-zinc-500 flex-1 leading-snug bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5">
            {value || "—"}
          </span>
        )}
      </div>
    </div>
  );
}

function LockedStatusField({ label, status }) {
  return (
    <LockedField label={label}>
      <div className="flex items-center flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5">
        <StatusBadge status={status} />
      </div>
    </LockedField>
  );
}

/* ─── Inline editable field ─── */
function EditableField({ label, value, onSave, type = "text", options, suffix, multiline }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef(null);

  useEffect(() => { setDraft(value ?? ""); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    onSave(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };
  const handleBlur = () => {
    if (editing) commit();
  };

  const inputClass =
    "w-full text-sm border border-green-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white transition-all";

  return (
    <div className="group relative">
      <div className="text-xs text-zinc-400 mb-0.5">{label}</div>
      {editing ? (
        <div className="flex items-start gap-2">
          <div className="flex-1">
            {options ? (
              <select ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={handleBlur} className={inputClass}>
                {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
              </select>
            ) : multiline ? (
              <textarea ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={handleBlur} rows={3}
                className={`${inputClass} resize-none`} />
            ) : (
              <div className="relative">
                <input ref={ref} type={type} value={draft} onChange={e => setDraft(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
                  className={`${inputClass} ${suffix ? "pr-8" : ""}`} />
                {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">{suffix}</span>}
              </div>
            )}
          </div>
          <div className="flex gap-1 pt-0.5">
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={commit} className="w-7 h-7 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center transition-colors">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={cancel} className="w-7 h-7 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 rounded-lg flex items-center justify-center transition-colors">
              <Ban className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 min-h-[28px]">
          <span className={`text-sm font-medium text-zinc-800 flex-1 leading-snug ${!value ? "text-zinc-400 italic" : ""}`}>
            {suffix && value ? `${value} ${suffix}` : (value || "—")}
          </span>
          <button onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-zinc-100 hover:bg-green-100 hover:text-green-700 text-zinc-400 flex items-center justify-center transition-all flex-shrink-0">
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Image gallery lightbox ─── */
function ImageGallery({ images }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  useEffect(() => { setActive(0); }, [images]);

  if (!images?.length) return (
    <div className="aspect-[4/3] bg-zinc-100 rounded-xl flex flex-col items-center justify-center gap-2">
      <Package className="w-10 h-10 text-zinc-300" />
      <span className="text-xs text-zinc-400">Chưa có hình ảnh</span>
    </div>
  );

  const thumb = images.find(i => i.is_thumbnail) ?? images[0];
  const current = images[active] ?? thumb;

  return (
    <div>
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100 cursor-zoom-in group"
        onClick={() => setZoom(true)}>
        <img src={current.image_url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/50 text-white rounded-lg p-1.5"><ZoomIn className="w-4 h-4" /></div>
        </div>
        {images.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); setActive(a => (a - 1 + images.length) % images.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={e => { e.stopPropagation(); setActive(a => (a + 1) % images.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {images.map((img, i) => (
            <button key={img.id ?? i} onClick={() => setActive(i)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${i === active ? "border-green-600 scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}>
              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom overlay */}
      {zoom && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setZoom(false)}>
          <img src={current.image_url} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Section wrapper ─── */
function Section({ icon, title, children, action }) {
  return (
    // <div className="border border-zinc-200 rounded-xl p-4">
    //   <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
    //     {icon}
    //     <span className="text-sm font-semibold text-zinc-800">{title}</span>
    //   </div>
    //   {children}
    // </div>
    <div className="bg-white rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-semibold text-lg">
            {title}
          </h2>
        </div>

        {action}
      </div>

      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-xs text-zinc-400">
        {icon}{label}
      </div>
      <div className="text-sm font-medium text-zinc-800">{value || "—"}</div>
    </div>
  );
}

/* ─── Main modal ─── */
export default function DetailProductModal({
  isOpen,
  onClose,
  product: initialProduct,
  onUpdate,
  onLockSelling,
  onUnlockSelling,
  togglingSelling = false,
}) {
  const [product, setProduct] = useState(initialProduct);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [cultivationSteps, setCultivationSteps] = useState([]);
  const [loadingCultivation, setLoadingCultivation] = useState(false);
  const [createRow, setCreateRow] = useState(null);
  const [editRow,setEditRow] = useState(null);
  useEffect(() => {
    setProduct(initialProduct);
    setSaved(false);
    setError("");
    setShowImageModal(false);
    setCultivationSteps([]);
  }, [initialProduct]);

  useEffect(() => {
    if (!isOpen) return;
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !product?.id) return;

    const fetchCultivation = async () => {
      setLoadingCultivation(true);
      try {
        const res = await farmingProcessService.getAll({ supplier_product: product.id });
        const steps = parseCultivationList(res)
          .filter((s) => Number(s.supplier_product) === Number(product.id))
          .sort((a, b) => a.step_order - b.step_order);
        setCultivationSteps(steps);
      } catch (err) {
        console.error("Lỗi tải quy trình canh tác:", err);
        setCultivationSteps([]);
      } finally {
        setLoadingCultivation(false);
      }
    };

    fetchCultivation();
  }, [isOpen, product?.id]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await farmingProcessService.getAll();
      setData(parseCultivationList(res));
    } catch (err) {
      console.error("Lỗi khi tải quy trình canh tác:", err);
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen || !product) return null;

  const field = (key) => product[key] ?? "";
  const update = (key, val) => setProduct(p => ({ ...p, [key]: val }));

  const buildUpdatePayload = () => {
    const payload = {
      name: product.name?.trim() ?? "",
      slug: product.slug ?? "",
      description: product.description ?? "",
    };

    const catId = product.category?.id ?? product.category;
    if (catId != null && catId !== "") {
      payload.category = Number(catId);
    }

    if (product.wholesale_price != null && product.wholesale_price !== "") {
      payload.wholesale_price = String(product.wholesale_price);
    }

    if (product.daily_production_capacity != null && product.daily_production_capacity !== "") {
      payload.daily_production_capacity = Number(product.daily_production_capacity);
    }

    if (product.storage_duration_days != null && product.storage_duration_days !== "") {
      payload.storage_duration_days = Number(product.storage_duration_days);
    }

    if (product.min_storage_temp != null && product.min_storage_temp !== "" && product.min_storage_temp !== "-") {
      payload.min_storage_temp = product.min_storage_temp;
    }

    if (product.max_storage_temp != null && product.max_storage_temp !== "" && product.max_storage_temp !== "-") {
      payload.max_storage_temp = product.max_storage_temp;
    }

    return payload;
  };

  const handleSave = async () => {
    setError("");
    const errs = validateProductForm({
      name: product.name,
      category: product.category?.id ?? product.category,
      wholesale_price: product.wholesale_price,
      daily_production_capacity: product.daily_production_capacity,
      description: product.description,
      storage_duration_days: product.storage_duration_days,
      min_storage_temp: product.min_storage_temp,
      max_storage_temp: product.max_storage_temp,
    });
    if (Object.keys(errs).length) {
      setError(errorsToSummary(errs));
      return;
    }

    setSaving(true);
    try {
      const payload = buildUpdatePayload();
      const updated = await productService.updateProduct(product.id, payload);

      // Ưu tiên state local (đã chỉnh sửa) — tránh API trả dữ liệu cũ ghi đè lên UI
      const mergedProduct = {
        ...(updated && typeof updated === "object" ? updated : {}),
        ...product,
        category: (updated?.category && typeof updated.category === "object") ? updated.category : product.category,
        images: (updated?.images?.length > 0) ? updated.images : product.images,
        supplier: (updated?.supplier && typeof updated.supplier === "object") ? updated.supplier : product.supplier,
        updated_at: updated?.updated_at ?? product.updated_at,
      };

      setProduct(mergedProduct);
      onUpdate?.(mergedProduct);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Lỗi cập nhật sản phẩm:", err);
      const parsed = parseSupplierApiErrors(err?.response?.data, {
        fallback: "Cập nhật sản phẩm thất bại. Vui lòng kiểm tra lại thông tin.",
      });
      setError(parsed.general || parsed.summary || extractSupplierApiMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const category = product.category ?? {};

  const fmt = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "modalIn 0.18s ease-out both", maxHeight: "92vh" }}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-emerald-950">{product.name || "Chi tiết sản phẩm"}</h2>
                <StatusBadge status={product.status} />
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" />ID: {product.id}</span>
                {product.slug && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{product.slug}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Tạo: {fmt(product.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${saved
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-green-700 hover:bg-green-800 text-white shadow-sm"
                } disabled:opacity-60`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Đang lưu…" : saved ? "Đã lưu!" : "Lưu thay đổi"}
            </button>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mb-3 flex-shrink-0 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="h-px bg-zinc-100 mx-6 flex-shrink-0" />

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-[1fr_260px] gap-5">

            {/* ── Left ── */}
            <div className="flex flex-col gap-4">

              {/* Thông tin sản phẩm */}
              <Section icon={<Package className="w-4 h-4 text-green-700" />} title="Thông tin sản phẩm">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {/* Mã sản phẩm — READ ONLY */}
                  <LockedField label="Mã sản phẩm (không thể thay đổi)" value={product.code || `#${product.id}`} />

                  <EditableField label="Tên sản phẩm"
                    value={field("name")}
                    onSave={v => update("name", v)} />

                  <EditableField label="Giá sỉ"
                    value={field("wholesale_price")}
                    onSave={v => update("wholesale_price", v === "" ? null : v)}
                    type="number" suffix="đ" />

                  <EditableField label="Năng suất"
                    value={field("daily_production_capacity")}
                    onSave={v => update("daily_production_capacity", v === "" ? null : Number(v))}
                    type="number" suffix="kg/tháng" />

                  <div className="col-span-2">
                    <EditableField label="Mô tả chi tiết"
                      value={field("description")}
                      onSave={v => update("description", v)}
                      multiline />
                  </div>
                </div>
              </Section>

              {/* Thông tin bảo quản */}
              <Section icon={<Thermometer className="w-4 h-4 text-green-700" />} title="Thông tin bảo quản">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <EditableField label="Thời hạn bảo quản"
                    value={field("storage_duration_days")}
                    onSave={v => update("storage_duration_days", parseInt(v) || 0)}
                    type="number" suffix="ngày" />
                  <EditableField label="Nhiệt độ tối thiểu"
                    value={field("min_storage_temp")}
                    onSave={v => update("min_storage_temp", v)}
                    type="number" suffix="°C" />
                  <EditableField label="Nhiệt độ tối đa"
                    value={field("max_storage_temp")}
                    onSave={v => update("max_storage_temp", v)}
                    type="number" suffix="°C" />
                </div>
              </Section>

              {/* Trạng thái */}
              <Section icon={<ShieldCheck className="w-4 h-4 text-green-700" />} title="Trạng thái & Phê duyệt">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <LockedStatusField
                    label="Trạng thái duyệt (không thể thay đổi)"
                    status={product.status}
                  />

                  <div>
                    <div className="text-xs text-zinc-400 mb-2">Trạng thái bán hàng</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={product.status} />
                      {canLockProduct(product.status) && (
                        <button
                          type="button"
                          onClick={() => onLockSelling?.(product)}
                          disabled={togglingSelling}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
                            border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Khóa bán
                        </button>
                      )}
                      {canUnlockProduct(product.status) && (
                        <button
                          type="button"
                          onClick={() => onUnlockSelling?.(product)}
                          disabled={togglingSelling}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
                            border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          <LockOpen className="w-3.5 h-3.5" />
                          Mở khóa bán
                        </button>
                      )}
                      {!canLockProduct(product.status) && !canUnlockProduct(product.status) && (
                        <span className="text-xs text-zinc-400">
                          Chỉ khóa/mở khóa khi sản phẩm đang bán hoặc đã tạm ngừng bán.
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 mb-0.5">Người duyệt</div>
                    <div className="text-sm font-medium text-zinc-700">{product.verified_by_username ?? "—"}</div>
                  </div>
                  {product.rejection_reason && (
                    <div className="col-span-2">
                      <EditableField label="Lý do từ chối"
                        value={field("rejection_reason")}
                        onSave={v => update("rejection_reason", v)} multiline />
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-zinc-400 mb-0.5">Thời gian duyệt</div>
                    <div className="text-sm font-medium text-zinc-700">{fmt(product.verified_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 mb-0.5">Cập nhật lần cuối</div>
                    <div className="text-sm font-medium text-zinc-700">{fmt(product.updated_at)}</div>
                  </div>
                </div>
              </Section>

              {/* Quy trình canh tác */}
              <Section
                icon={<CircleDotDashed className="w-4 h-4 text-green-700" />}
                title="Quy trình canh tác"
                action={
                  <button
                    onClick={() => setCreateRow({})}
                    className="px-4 py-2 bg-emerald-800 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
                  >
                    + Thêm quy trình mới
                  </button>}
              >
                {loadingCultivation ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tải quy trình canh tác...
                  </div>
                ) : cultivationSteps.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">Chưa có quy trình canh tác cho sản phẩm này.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {cultivationSteps.map((step) => (
                      <div key={step.id} className="flex gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {step.step_order}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-800">{step.process_name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 whitespace-pre-wrap">
                            {step.description || "—"}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditRow(step)}
                          className="ml-auto flex items-center justify-center w-8 h-8 rounded-md bg-gray-500 text-white hover:bg-gray-300 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            {/* ── Right ── */}
            <div className="flex flex-col gap-3">
              {/* Gallery */}
              <div className="border border-zinc-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
                  <span className="text-sm font-semibold text-zinc-800">Hình ảnh</span>
                  <span className="text-xs text-zinc-400 ml-auto">{product.images?.length ?? 0} ảnh</span>
                </div>
                <ImageGallery images={product.images} />
                <button
                  type="button"
                  onClick={() => setShowImageModal(true)}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-green-700
                    border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Cập nhật hình ảnh
                </button>
              </div>

              {/* Danh mục */}
              <div className="border border-zinc-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
                  <Tag className="w-4 h-4 text-green-700" />
                  <span className="text-sm font-semibold text-zinc-800">Danh mục</span>
                </div>
                <div className="flex flex-col gap-2">
                  <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Tên danh mục" value={category.name} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Trạng thái:</span>
                    <StatusBadge status={category.status} />
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
                <div className="text-xs font-semibold text-green-900 mb-2">Thông tin nhanh</div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Mã sản phẩm</span>
                    <span className="font-mono font-semibold text-zinc-800">{product.code || `#${product.id}`}</span>
                  </div>
                  {product.slug && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Slug</span>
                      <span className="font-mono text-zinc-600 truncate ml-2 max-w-[120px]" title={product.slug}>{product.slug}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Giá sỉ</span>
                    <span className="font-semibold text-zinc-800">
                      {product.wholesale_price != null && product.wholesale_price !== ""
                        ? `${Number(product.wholesale_price).toLocaleString("vi-VN")} đ`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Ngày tạo</span>
                    <span className="text-zinc-700">{fmt(product.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Hint */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Hover vào từng trường để chỉnh sửa. Nhấn <strong>Lưu thay đổi</strong> để cập nhật lên hệ thống. Mã sản phẩm <strong>không thể thay đổi</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="h-px bg-zinc-100 mx-6 flex-shrink-0" />
        <div className="px-6 py-3.5 flex justify-between items-center bg-stone-50 rounded-b-2xl flex-shrink-0">
          <span className="text-xs text-zinc-400">
            Cập nhật: {fmt(product.updated_at)}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">
              Đóng
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>

      <UpdateProductImagesModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        product={product}
        onSuccess={(updated) => {
          setProduct(updated);
          onUpdate?.(updated);
        }}
      />
      <CreateCultivationModal
        isOpen={createRow !== null}
        onClose={() => setCreateRow(null)}
        onSuccess={fetchData}
        productId={product.id}
      />
      <EditCultivationModal
              isOpen={editRow !== null}
              onClose={() => setEditRow(null)}
              process={editRow}
              onSuccess={fetchData}
              productId={product.id}
            />
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}