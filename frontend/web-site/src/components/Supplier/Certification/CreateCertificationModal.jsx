import { useState, useEffect, useRef } from "react";
import {
  X, ShieldCheck, Hash, Building2, CalendarDays, FileText,
  CloudUpload, Trash2, CheckCircle, Loader2, Info, Save, ImageIcon,
} from "lucide-react";
import {certificationService} from "../../../services/api/CertificationService";
// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CERT_TYPES = [
  "VietGAP", "GlobalGAP", "Organic",
  "Hữu cơ Việt Nam", "HACCP", "ISO 22000", "Khác",
];

const PRODUCT_TYPES = [
  "Cà chua", "Táo", "Bí đỏ",
  "Dưa leo", "Ớt chuông", "Khoai tây", "Rau cải", "Khác",
];
// ─────────────────────────────────────────────
// API helpers  ← CHỖ NÀY ĐỂ GẮN API SAU
// ─────────────────────────────────────────────

/**
 * POST /certifications/
 * Body: FormData  (multipart vì có file ảnh)
 *   - name            : string
 *   - certificate_code: string
 *   - issued_by       : string
 *   - issue_date      : "YYYY-MM-DD"
 *   - expiry_date     : "YYYY-MM-DD"
 *   - description     : string
 *   - image           : File  (1 file duy nhất)
 *
 * Response: Certification object (xem schema bên dưới)
 */
async function apiCreateCertification(payload) {
  // TODO: thay BASE_URL và bỏ comment khi tích hợp thật
  // const BASE_URL = import.meta.env.VITE_API_URL;
  // const token    = localStorage.getItem("access_token");
  //
  // const body = new FormData();
  // body.append("name",             payload.name);
  // body.append("certificate_code", payload.certificate_code);
  // body.append("issued_by",        payload.issued_by);
  // body.append("issue_date",       payload.issue_date);       // "YYYY-MM-DD"
  // body.append("expiry_date",      payload.expiry_date);      // "YYYY-MM-DD"
  // body.append("description",      payload.description ?? "");
  // if (payload.image) body.append("image", payload.image);   // File object
  //
  // const res = await fetch(`${BASE_URL}/certifications/`, {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${token}` },
  //   body,
  // });
  // if (!res.ok) throw new Error(await res.text());
  // return res.json();
  //
  // ── RESPONSE SCHEMA (để tham khảo) ──────────────────────────
  // {
  //   id              : number,
  //   is_expired      : boolean,
  //   status          : "pending" | "approved" | "rejected" | "revoked",
  //   images          : [{ id, certification, image_url, sort_order, created_at }],
  //   name            : string,
  //   certificate_code: string,
  //   issued_by       : string,
  //   issue_date      : "YYYY-MM-DD",
  //   expiry_date     : "YYYY-MM-DD",
  //   description     : string,
  //   verified_at     : string | null,
  //   rejection_reason: string | null,
  //   revoked_at      : string | null,
  //   revoke_reason   : string | null,
  //   created_at      : string,
  //   updated_at      : string,
  //   deleted_at      : string | null,
  //   supplier        : number,
  //   verified_by     : number | null,
  //   revoked_by      : number | null,
  // }

  // ── MOCK (xóa khi dùng thật) ─────────────────────────────────
  await new Promise((r) => setTimeout(r, 900));
  return { id: Math.floor(Math.random() * 1000), status: "pending", ...payload };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const inputClass =
  "w-full text-sm border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all placeholder:text-zinc-300 bg-white";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1.5";

const fmtSize = (n) =>
  n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${(n / 1024).toFixed(0)} KB`;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
/**
 * Props:
 *   isOpen    : boolean
 *   onClose   : () => void
 *   onSuccess : (createdCertification) => void   ← nhận lại object từ API
 */
export default function AddCertificationModal({ isOpen, onClose, onSuccess }) {
  // ── form state — map 1-1 với API fields ──
  const [form, setForm] = useState({
    name: "",              // API: name
    product: "",           // API: product  (thêm field này để chọn sản phẩm được chứng nhận)
    certificate_code: "",  // API: certificate_code
    issued_by: "",         // API: issued_by
    issue_date: "",        // API: issue_date  "YYYY-MM-DD"
    expiry_date: "",       // API: expiry_date "YYYY-MM-DD"
    description: "",       // API: description
  });

  // ── image state (1 file duy nhất) ──
  const [imageFile, setImageFile]     = useState(null);   // File object → gửi lên API
  const [imagePreview, setImagePreview] = useState(null); // ObjectURL   → chỉ để hiển thị
  const [imageStatus, setImageStatus] = useState(null);   // null | "uploading" | "ready"

  // ── submit state ──
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState(null);

  const fileRef = useRef(null);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Cleanup object URL khi unmount / đổi file
  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  if (!isOpen) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── image handlers ──
  const handleImageFile = (f) => {
    if (!f) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    setImageStatus("uploading");
    // Giả lập upload local; khi dùng API thật có thể bỏ timeout này
    setTimeout(() => setImageStatus("ready"), 800);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleImageFile(e.dataTransfer.files[0]);
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageStatus(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── submit ──
  // ── submit ──
// ── submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
        const formData = new FormData();
        
        // 1. Lấy dữ liệu từ state 'form' của bạn
        formData.append("name", form.name); 
        formData.append("certificate_code", form.certificate_code); 
        formData.append("issued_by", form.issued_by); 
        formData.append("issue_date", form.issue_date); 
        formData.append("expiry_date", form.expiry_date); 
        formData.append("description", form.description);
        
        // Nếu backend có yêu cầu gửi tên sản phẩm thì bật dòng này lên:
        // if (form.product) formData.append("product", form.product);

        // 2. Lấy file ảnh từ state 'imageFile' của bạn
        if (imageFile) {
            formData.append("images", imageFile); 
        }

        // 3. GỌI API
        const response = await certificationService.create(formData);
        
        console.log("Tạo chứng nhận thành công:", response);
        
        // Cập nhật UI thành công, đóng modal và báo lại cho bảng
        setSaved(true);
        setTimeout(() => {
            onSuccess(response); 
            onClose();
        }, 500); // Đợi nửa giây cho đẹp UI rồi mới đóng

    } catch (error) {
        console.error("CHI TIẾT LỖI HOÀN CHỈNH:", error);
        if (error.response) {
             console.error("Lỗi từ Backend (Data):", error.response.data);
             alert("Lỗi Backend: " + JSON.stringify(error.response.data));
        } else {
             console.error("Lỗi Code hoặc Mạng:", error.message);
             alert("Lỗi hệ thống: " + error.message);
        }
    } finally {
        setSaving(false);
    }
  };

  // ── image preview area ──
  const isImage = imageFile?.type?.startsWith("image/");
  const isPdf   = imageFile?.type === "application/pdf";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "modalIn 0.18s ease-out both", maxHeight: "92vh" }}
      >

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-950">Thêm Chứng Nhận</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cung cấp thông tin chứng nhận để tăng giá trị thương hiệu và độ tin cậy.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors ml-4 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-px bg-zinc-100 mx-6 flex-shrink-0" />

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── Hàng 1: form trái / ảnh phải ── */}
          <div className="grid grid-cols-2 gap-5">

            {/* Cột trái — các field */}
            <div className="flex flex-col gap-4">

              {/* name */}
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
                    Tên chứng nhận (*)
                  </span>
                </label>
                <select
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Chọn loại chứng nhận</option>
                  {CERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* certificate_code */}
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-green-700" />
                    Mã chứng nhận (*)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập mã số chứng nhận..."
                  value={form.certificate_code}
                  onChange={(e) => set("certificate_code", e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* issued_by */}
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-green-700" />
                    Đơn vị cấp (*)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Cơ quan hoặc tổ chức cấp chứng nhận..."
                  value={form.issued_by}
                  onChange={(e) => set("issued_by", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
                   Sản phẩm được chứng nhận 
                  </span>
                </label>
                <select
                  value={form.product}
                  onChange={(e) => set("product", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Chọn loại sản phẩm</option>
                  {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {/* issue_date + expiry_date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-green-700" />
                      Ngày cấp (*)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => set("issue_date", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-green-700" />
                      Ngày hết hạn (*)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => set("expiry_date", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* description */}
              <div className="flex-1 flex flex-col">
                <label className={labelClass}>Mô tả ngắn</label>
                <textarea
                  placeholder="Ghi chú thêm về phạm vi chứng nhận hoặc nội dung chi tiết..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  className={`${inputClass} resize-none flex-1`}
                />
              </div>
            </div>

            {/* Cột phải — upload 1 ảnh chứng nhận */}
            <div className="flex flex-col gap-3">
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-green-700" />
                    Ảnh / File chứng nhận
                  </span>
                </label>

                {/* Drop zone — chỉ hiện khi chưa có file */}
                {!imageFile && (
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-zinc-200 rounded-xl p-6 flex flex-col items-center gap-2.5 cursor-pointer
                               hover:border-green-400 hover:bg-green-50 transition-all group"
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,application/pdf"
                      className="hidden"
                      onChange={(e) => handleImageFile(e.target.files[0])}
                    />
                    <div className="w-11 h-11 bg-zinc-100 group-hover:bg-green-100 rounded-xl flex items-center justify-center transition-colors">
                      <CloudUpload className="w-5 h-5 text-zinc-400 group-hover:text-green-600 transition-colors" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-medium text-zinc-700 group-hover:text-green-800 transition-colors">
                        Kéo &amp; Thả hoặc{" "}
                        <span className="text-green-700 underline underline-offset-2">Chọn file</span>
                      </span>
                      <p className="text-xs text-zinc-400 mt-0.5">JPG, PNG, PDF — tối đa 5MB</p>
                    </div>
                  </label>
                )}

                {/* Preview — hiện khi đã chọn file */}
                {imageFile && (
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    {/* Ảnh preview hoặc PDF placeholder */}
                    <div className="bg-zinc-50 flex items-center justify-center" style={{ minHeight: 160 }}>
                      {isImage ? (
                        <img
                          src={imagePreview}
                          alt="preview"
                          className="max-h-44 w-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-8">
                          <div className="w-12 h-14 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                            <span className="text-red-600 font-bold text-xs">PDF</span>
                          </div>
                          <span className="text-xs text-zinc-500 px-3 text-center break-all line-clamp-2">
                            {imageFile.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* File meta + actions */}
                    <div className="px-3 py-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-700 truncate">{imageFile.name}</p>
                        <p className="text-xs text-zinc-400">{fmtSize(imageFile.size)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {imageStatus === "uploading" && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Loader2 className="w-3 h-3 animate-spin" />Đang xử lý
                          </span>
                        )}
                        {imageStatus === "ready" && (
                          <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                            <CheckCircle className="w-3 h-3" />Sẵn sàng
                          </span>
                        )}
                        <button
                          onClick={removeImage}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />Gỡ
                        </button>
                      </div>
                    </div>

                    {/* Đổi file */}
                    <label className="block text-center py-2 border-t border-zinc-100 text-xs text-green-700 cursor-pointer hover:bg-green-50 transition-colors">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,application/pdf"
                        className="hidden"
                        onChange={(e) => handleImageFile(e.target.files[0])}
                      />
                      Đổi file khác
                    </label>
                  </div>
                )}
              </div>

              {/* Info cards nhỏ */}
              <div className="flex flex-col gap-2 mt-auto">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex gap-2">
                  <Info className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-green-900 mb-0.5">Quy chuẩn VietGAP</div>
                    <p className="text-xs text-green-700 leading-relaxed">
                      Chứng nhận VietGAP giúp tăng tỉ lệ chốt đơn lên đến 45%.
                    </p>
                    <button className="text-xs text-green-700 font-medium mt-1 hover:underline">
                      Xem tài liệu →
                    </button>
                  </div>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex gap-2">
                  <CalendarDays className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Hệ thống sẽ nhắc nhở trước <strong className="text-zinc-700">30 ngày</strong> khi chứng nhận sắp hết hạn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="h-px bg-zinc-100 mx-6 flex-shrink-0" />
        <div className="px-6 py-4 flex justify-end gap-3 bg-stone-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded-xl transition-colors disabled:opacity-70 min-w-[152px] justify-center"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu…</>
            ) : saved ? (
              <><CheckCircle className="w-4 h-4" />Đã lưu!</>
            ) : (
              <><Save className="w-4 h-4" />Lưu chứng nhận</>
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