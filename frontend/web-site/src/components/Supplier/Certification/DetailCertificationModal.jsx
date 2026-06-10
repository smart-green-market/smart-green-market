import { useEffect } from "react";
import {
  X, ShieldCheck, Hash, Building2, CalendarDays, FileText, 
  ImageIcon, CheckCircle, Clock, XCircle, AlertTriangle
} from "lucide-react";

// ─────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────
const labelClass = "block text-xs font-medium text-zinc-500 mb-1.5";
const valueClass = "w-full text-sm font-medium text-zinc-800 bg-zinc-50/50 border border-zinc-200/80 rounded-xl px-3.5 py-2.5";

// Cấu hình hiển thị trạng thái
const STATUS_CONFIG = {
  pending: { label: "Chờ duyệt", icon: Clock, bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  approved: { label: "Đã duyệt", icon: CheckCircle, bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  rejected: { label: "Từ chối", icon: XCircle, bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  revoked: { label: "Thu hồi", icon: AlertTriangle, bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
  expired: { label: "Hết hạn", icon: Clock, bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-200" },
};

/**
 * Props:
 * isOpen        : boolean
 * onClose       : () => void
 * certification : object (Dữ liệu chứng nhận từ API)
 */
export default function DetailCertificationModal({ isOpen, onClose, certification }) {

  // Escape key & Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !certification) return null;

  // Lấy cấu hình trạng thái
  const statusConfig = STATUS_CONFIG[certification.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  // Xử lý lấy ảnh từ API (lấy ảnh đầu tiên trong mảng images nếu có)
  const imageUrl = certification.images && certification.images.length > 0 
                    ? certification.images[0].image_url 
                    : certification.image;

  // Kiểm tra file có phải PDF không dựa trên đuôi file URL (nếu backend lưu dạng link)
  const isPdf = imageUrl && imageUrl.toLowerCase().includes(".pdf");

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
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-emerald-950">
                  {certification.name || "Chi tiết Chứng nhận"}
                </h2>
                {/* Status Badge */}
                <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Xem chi tiết thông tin và tệp đính kèm của chứng nhận.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-px bg-zinc-100 mx-6 flex-shrink-0" />

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* ── Hàng 1: Info trái / Image phải ── */}
          <div className="grid grid-cols-2 gap-6">

            {/* Cột trái — Các thông tin chi tiết */}
            <div className="flex flex-col gap-4">
              
              {/* Tên chứng nhận & Mã */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tên chứng nhận</label>
                  <div className={valueClass}>{certification.name || "---"}</div>
                </div>
                <div>
                  <label className={labelClass}>Mã chứng nhận</label>
                  <div className={`${valueClass} font-mono text-green-800`}>
                    {certification.certificate_code || certification.code || "---"}
                  </div>
                </div>
              </div>

              {/* Đơn vị cấp & Sản phẩm */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />Đơn vị cấp</span>
                  </label>
                  <div className={valueClass}>{certification.issued_by || "---"}</div>
                </div>
                <div>
                  <label className={labelClass}>Sản phẩm áp dụng</label>
                  <div className={valueClass}>{certification.product || "Tất cả"}</div>
                </div>
              </div>

              {/* Ngày cấp & Ngày hết hạn */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Ngày cấp</span>
                  </label>
                  <div className={valueClass}>{certification.issue_date || "---"}</div>
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Ngày hết hạn</span>
                  </label>
                  <div className={`${valueClass} ${certification.is_expired ? 'text-red-600' : ''}`}>
                    {certification.expiry_date || "---"}
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              <div className="flex-1 flex flex-col">
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Mô tả / Ghi chú</span>
                </label>
                <div className={`${valueClass} flex-1 min-h-[80px] whitespace-pre-wrap`}>
                  {certification.description || "Không có mô tả chi tiết."}
                </div>
              </div>

              {/* Lý do từ chối/thu hồi (nếu có) */}
              {(certification.rejection_reason || certification.revoke_reason) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
                  <div className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> 
                    {certification.revoke_reason ? "Lý do thu hồi:" : "Lý do từ chối:"}
                  </div>
                  <div className="text-sm text-red-700">
                    {certification.revoke_reason || certification.rejection_reason}
                  </div>
                </div>
              )}
            </div>

            {/* Cột phải — Ảnh / PDF đính kèm */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Tệp đính kèm
                </span>
              </label>

              <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50 h-full min-h-[280px] flex items-center justify-center relative group">
                {imageUrl ? (
                  isPdf ? (
                    // Hiển thị dạng File PDF
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-20 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-red-600 font-bold text-sm">PDF</span>
                      </div>
                      <a 
                        href={imageUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm font-semibold text-green-700 hover:underline"
                      >
                        Mở tài liệu PDF
                      </a>
                    </div>
                  ) : (
                    // Hiển thị ảnh
                    <>
                      <img
                        src={imageUrl}
                        alt="certification attachment"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a 
                          href={imageUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2 bg-white text-zinc-800 text-sm font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
                        >
                          Xem ảnh gốc
                        </a>
                      </div>
                    </>
                  )
                ) : (
                  // Không có ảnh
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                    <span className="text-sm font-medium">Không có tệp đính kèm</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="h-px bg-zinc-100 mx-6 flex-shrink-0" />
        <div className="px-6 py-4 flex justify-end gap-3 bg-stone-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900 rounded-xl transition-colors"
          >
            Đóng
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