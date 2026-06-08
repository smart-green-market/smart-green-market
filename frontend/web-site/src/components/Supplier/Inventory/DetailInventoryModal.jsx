import { useState, useEffect, useRef } from "react";
import {
  X, Edit3, Check, ChevronLeft, ChevronRight, ZoomIn,
  Package, Tag, Clock, Thermometer, ShieldCheck, Building2,
  User, Phone, MapPin, Calendar, Hash, AlertCircle, CheckCircle,
  XCircle, Loader2, Pencil, Save, Ban
} from "lucide-react";

/** ─── helpers ─── */
const STATUS_MAP = {
  pending: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Đã duyệt", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected: { label: "Từ chối", color: "bg-red-100 text-red-700 border-red-200" },
  active: { label: "Đang bán", color: "bg-green-100 text-green-700 border-green-200" },
  inactive: { label: "Tạm ngừng", color: "bg-zinc-100 text-zinc-500 border-zinc-200" },
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

/** Inline editable field */
function EditableField({ label, value, onSave, type = "text", options, suffix, multiline }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value ?? ""); setEditing(false); };

  const inputClass =
    "w-full text-sm border border-green-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white transition-all";

  return (
    <div className="group relative">
      <div className="text-xs text-zinc-400 mb-0.5">{label}</div>
      {editing ? (
        <div className="flex items-start gap-2">
          <div className="flex-1">
            {options ? (
              <select ref={ref} value={draft} onChange={e => setDraft(e.target.value)} className={inputClass}>
                {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
              </select>
            ) : multiline ? (
              <textarea ref={ref} value={draft} onChange={e => setDraft(e.target.value)} rows={3}
                className={`${inputClass} resize-none`} />
            ) : (
              <div className="relative">
                <input ref={ref} type={type} value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
                  className={`${inputClass} ${suffix ? "pr-8" : ""}`} />
                {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">{suffix}</span>}
              </div>
            )}
          </div>
          <div className="flex gap-1 pt-0.5">
            <button onClick={commit} className="w-7 h-7 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center transition-colors">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={cancel} className="w-7 h-7 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 rounded-lg flex items-center justify-center transition-colors">
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

/** Image lightbox strip */
function ImageGallery({ images }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
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
        <div className="flex gap-2 mt-2">
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

/** ─── Main modal ─── */
export default function InventoryDetailModal({ isOpen, onClose, product: initialProduct, onUpdate }) {
  const [product, setProduct] = useState(initialProduct);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setProduct(initialProduct); }, [initialProduct]);

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

  if (!isOpen || !product) return null;

  const field = (key, subkey) => subkey
    ? product[key]?.[subkey] ?? ""
    : product[key] ?? "";

  const update = (key, val) => setProduct(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: PATCH /supplier-products/{id}/
      await new Promise(r => setTimeout(r, 800)); // mock
      onUpdate?.(product);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const supplier = product.supplier ?? {};
  const category = product.category ?? {};

  const fmt = (dateStr) => dateStr
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
                <h2 className="text-lg font-bold text-emerald-950">{product.name || "Chi tiết lô hàng"}</h2>
                <StatusBadge status={product.status} />
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" />ID: {product.id}</span>
                <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{product.slug}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Tạo: {fmt(product.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {/* Save button */}
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${saved
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-green-700 hover:bg-green-800 text-white shadow-sm"
                } disabled:opacity-60`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Đang lưu…" : saved ? "Đã lưu" : "Lưu thay đổi"}
            </button>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="h-px bg-zinc-100 mx-6 flex-shrink-0" />

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-[1fr_260px] gap-5">

            {/* ── Left ── */}
            <div className="flex flex-col gap-4">

              {/* Thông tin chính */}
              <Section icon={<Package className="w-4 h-4 text-green-700" />} title="Thông tin lô hàng">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <EditableField label="Mã lô hàng (*)" value={field("id")}
                    onSave={v => update("id", v)} />
                  <EditableField label="Tên sản phẩm" value={field("name")}
                    onSave={v => update("name", v)} />
                  <EditableField label="Tồn kho" value={field("stock")}
                    onSave={v => update("stock", v)}
                    type="number" />
                  <EditableField label="Đơn vị tính" value={field("unit")}
                    onSave={v => update("unit", v)}
                    options={["kg", "bó", "cái", "túi", "hộp", "thùng"]} />
                  <div className="col-span-2">
                    <EditableField label="Mô tả chi tiết" value={field("description")}
                      onSave={v => update("description", v)} multiline />
                  </div>
                </div>
              </Section>

              {/* Bảo quản */}
              {/* <Section icon={<Thermometer className="w-4 h-4 text-green-700" />} title="Thông tin bảo quản">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <EditableField label="Thời hạn bảo quản" value={field("storage_duration_days")}
                    onSave={v => update("storage_duration_days", parseInt(v) || 0)}
                    type="number" suffix="ngày" />
                  <EditableField label="Nhiệt độ tối thiểu" value={field("min_storage_temp")}
                    onSave={v => update("min_storage_temp", v)}
                    type="number" suffix="°C" />
                  <EditableField label="Nhiệt độ tối đa" value={field("max_storage_temp")}
                    onSave={v => update("max_storage_temp", v)}
                    type="number" suffix="°C" />
                </div>
              </Section> */}

              {/* Trạng thái & phê duyệt */}
              <Section icon={<ShieldCheck className="w-4 h-4 text-green-700" />} title="Thông tin bán hàng">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <EditableField label="Trạng thái" value={field("status")}
                    onSave={v => update("status", v)}
                    options={[
                      { value: "pending", label: "Chờ duyệt" },
                      { value: "approved", label: "Đã duyệt" },
                      { value: "rejected", label: "Từ chối" },
                      { value: "active", label: "Đang bán" },
                      { value: "inactive", label: "Tạm ngừng" },
                    ]} />
                  <div>
                    <div className="text-xs text-zinc-400 mb-0.5">Giá bán</div>
                    <div className="text-sm font-medium text-zinc-700">{product.verified_by_username ?? "—"}</div>
                  </div>
                  {product.rejection_reason && (
                    <div className="col-span-2">
                      <EditableField label="Lý do từ chối" value={field("rejection_reason")}
                        onSave={v => update("rejection_reason", v)} multiline />
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-zinc-400 mb-0.5">Ngày nhập</div>
                    <div className="text-sm font-medium text-zinc-700">{fmt(product.verified_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 mb-0.5">Thời gian bảo quản</div>
                    <div className="text-sm font-medium text-zinc-700">{fmt(product.updated_at)}</div>
                  </div>
                </div>
              </Section>
            </div>

            {/* ── Right ── */}
            <div className="flex flex-col gap-3">
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
                    <span className="text-zinc-500">ID sản phẩm</span>
                    <span className="font-mono font-semibold text-zinc-800">#{product.id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Slug</span>
                    <span className="font-mono text-zinc-600 truncate ml-2">{product.slug}</span>
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
                  Hover vào từng trường để chỉnh sửa. Nhấn <strong>Lưu thay đổi</strong> để cập nhật lên hệ thống.
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

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}

/** ─── Small helpers ─── */
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