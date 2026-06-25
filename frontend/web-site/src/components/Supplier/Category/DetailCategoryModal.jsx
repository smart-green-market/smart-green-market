import { useEffect } from "react";
import { X, Tag, Calendar, Hash, AlignLeft, ShieldCheck, Pencil, Trash2 } from "lucide-react";

const STATUS_CONFIG = {
  active:   { label: "Hoạt động", cls: "pill-g"  },
  pending:  { label: "Chờ duyệt", cls: "pill-a"  },
  rejected: { label: "Từ chối",   cls: "pill-r"  },
};

function Field({ icon: Icon, label, children }) {
  return (
    <div className="cd-field">
      <div className="cd-field-label">
        <Icon size={12} className="cd-field-ico" />
        {label}
      </div>
      <div className="cd-field-value">{children}</div>
    </div>
  );
}

export default function DetailCategoryModal({ category, onClose, onEdit, onDelete }) {
  // Đóng bằng Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!category) return null;

  const st = STATUS_CONFIG[category.status] ?? STATUS_CONFIG.pending;

  return (
    <>
      <style>{`
        /* ── OVERLAY ─────────────────────────────────────────────── */
        .cdm-overlay {
          position:fixed; inset:0; z-index:50;
          background:rgba(0,0,0,.35);
          display:flex; align-items:center; justify-content:center;
          padding:16px;
          animation:cdm-fade-in .15s ease;
        }
        @keyframes cdm-fade-in { from{opacity:0} to{opacity:1} }

        /* ── MODAL BOX ───────────────────────────────────────────── */
        .cdm-box {
          background:#fff;
          border-radius:14px;
          border:0.5px solid #e5e7eb;
          width:100%; max-width:520px;
          box-shadow:0 20px 60px rgba(0,0,0,.12);
          display:flex; flex-direction:column;
          animation:cdm-slide-up .18s ease;
          overflow:hidden;
        }
        @keyframes cdm-slide-up {
          from{opacity:0;transform:translateY(10px)}
          to{opacity:1;transform:translateY(0)}
        }

        /* ── HEADER ──────────────────────────────────────────────── */
        .cdm-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 18px;
          border-bottom:0.5px solid #e5e7eb;
        }
        .cdm-header-left { display:flex; align-items:center; gap:10px; }
        .cdm-header-ico {
          width:32px; height:32px; border-radius:9px;
          background:#d1fae5; color:#166534;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
        }
        .cdm-title {
          font-size:14px; font-weight:700; color:#111827;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          max-width:320px;
        }
        .cdm-close {
          width:28px; height:28px; border-radius:7px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          border:none; background:transparent; color:#9ca3af;
          cursor:pointer; transition:background .1s, color .1s;
        }
        .cdm-close:hover { background:#f3f4f6; color:#111827; }

        /* ── BODY ────────────────────────────────────────────────── */
        .cdm-body {
          padding:18px;
          display:flex; flex-direction:column; gap:0;
          overflow-y:auto; max-height:70vh;
        }

        /* Status badge row */
        .cdm-status-row {
          display:flex; align-items:center; gap:8px;
          margin-bottom:18px;
        }
        .cdm-id-badge {
          font-size:11px; font-weight:600; color:#166534;
          font-family:monospace;
          background:#f0fdf4; border:0.5px solid #bbf7d0;
          border-radius:6px; padding:3px 8px;
        }

        /* Status pills (reuse prod style) */
        .pill-g  { background:#d1fae5; color:#166534; }
        .pill-a  { background:#FAEEDA; color:#854F0B; }
        .pill-r  { background:#FCEBEB; color:#A32D2D; }
        .status-pill {
          display:inline-block;
          padding:4px 11px; border-radius:20px;
          font-size:11px; font-weight:600; white-space:nowrap;
        }

        /* Divider */
        .cdm-divider {
          height:0.5px; background:#f3f4f6; margin:14px 0;
        }

        /* Field grid */
        .cdm-grid {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:14px 24px;
        }
        .cdm-grid.full { grid-template-columns:1fr; }

        /* Single field */
        .cd-field { display:flex; flex-direction:column; gap:5px; }
        .cd-field-label {
          display:flex; align-items:center; gap:5px;
          font-size:10px; font-weight:600; color:#9ca3af;
          text-transform:uppercase; letter-spacing:.5px;
        }
        .cd-field-ico { flex-shrink:0; }
        .cd-field-value {
          font-size:13px; color:#111827; font-weight:500;
          line-height:1.5;
        }
        .cd-field-value.dim { color:#6b7280; font-weight:400; }
        .cd-field-value.desc {
          color:#374151; font-weight:400;
          white-space:pre-wrap; word-break:break-word;
        }

        /* ── FOOTER ──────────────────────────────────────────────── */
        .cdm-footer {
          display:flex; align-items:center; justify-content:flex-end;
          gap:8px; padding:14px 18px;
          border-top:0.5px solid #e5e7eb;
        }
        .cdm-btn {
          height:34px; padding:0 16px; border-radius:8px;
          font-size:13px; font-weight:600; cursor:pointer;
          display:inline-flex; align-items:center; gap:6px;
          border:none; transition:background .1s, color .1s;
        }
        .cdm-btn.ghost {
          background:#f3f4f6; color:#374151;
        }
        .cdm-btn.ghost:hover { background:#e5e7eb; }
        .cdm-btn.primary {
          background:#0f3d20; color:#fff;
        }
        .cdm-btn.primary:hover { background:#166534; }
        .cdm-btn.danger {
          background:#FCEBEB; color:#A32D2D;
        }
        .cdm-btn.danger:hover { background:#f9c6c6; }
      `}</style>

      {/* Overlay — click ngoài để đóng */}
      <div className="cdm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="cdm-box">

          {/* Header */}
          <div className="cdm-header">
            <div className="cdm-header-left">
              <div className="cdm-header-ico">
                <Tag size={15} />
              </div>
              <span className="cdm-title">{category.name}</span>
            </div>
            <button className="cdm-close" onClick={onClose}>
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="cdm-body">

            {/* ID + Trạng thái */}
            <div className="cdm-status-row">
              <span className="cdm-id-badge">#{category.id}</span>
              <span className={`status-pill ${st.cls}`}>{st.label}</span>
            </div>

            {/* Grid thông tin chính */}
            <div className="cdm-grid">
              <Field icon={Hash} label="Thứ tự hiển thị">
                <span className={category.sort_order != null ? "" : "dim"}>
                  {category.sort_order ?? "—"}
                </span>
              </Field>

              <Field icon={ShieldCheck} label="Xác minh bởi">
                <span className={category.verified_by_username ? "" : "dim"}>
                  {category.verified_by_username || "Chưa xác minh"}
                </span>
              </Field>

              <Field icon={Calendar} label="Ngày tạo">
                <span className={category.created_at ? "" : "dim"}>
                  {category.created_at
                    ? new Date(category.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                      })
                    : "—"}
                </span>
              </Field>

              <Field icon={Calendar} label="Cập nhật lần cuối">
                <span className={category.updated_at ? "" : "dim"}>
                  {category.updated_at
                    ? new Date(category.updated_at).toLocaleDateString("vi-VN", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                      })
                    : "—"}
                </span>
              </Field>
            </div>

            <div className="cdm-divider" />

            {/* Mô tả — full width */}
            <div className="cdm-grid full">
              <Field icon={AlignLeft} label="Mô tả">
                <span className={`cd-field-value desc ${!category.description ? "dim" : ""}`}>
                  {category.description || "Không có mô tả."}
                </span>
              </Field>
            </div>

          </div>

          {/* Footer */}
          <div className="cdm-footer">
            <button className="cdm-btn ghost" onClick={onClose}>
              Đóng
            </button>
            <button className="cdm-btn danger" onClick={() => { onClose(); onDelete(category); }}>
              <Trash2 size={13} /> Xóa
            </button>
            <button className="cdm-btn primary" onClick={() => { onClose(); onEdit(category); }}>
              <Pencil size={13} /> Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </>
  );
}