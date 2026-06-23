import { useState, useEffect } from "react";
import { canLockProduct, canUnlockProduct } from "./productSellingUtils";
import { Eye, Lock, Unlock, Trash2, Award } from "lucide-react";

const STATUS_CONFIG = {
  pending:  { label: "Chờ duyệt",  cls: "pill-a" },
  active:   { label: "Đang bán",   cls: "pill-g" },
  inactive: { label: "Đã khóa",   cls: "pill-gr" },
  rejected: { label: "Từ chối",   cls: "pill-r"  },
  deleted:  { label: "Đã xóa",    cls: "pill-gr" },
};

const fmtPrice = (val) => {
  if (val == null || val === "") return "—";
  return new Intl.NumberFormat("vi-VN").format(val) + "đ";
};

const PAGE_SIZE = 8;

function Pagination({ page, total, onChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const getPages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, "…", totalPages];
    if (page >= totalPages - 2) return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };

  return (
    <div className="prod-pagination">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="pg-btn">‹</button>
      {getPages().map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="pg-ellipsis">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)} className={`pg-btn${p === page ? " on" : ""}`}>{p}</button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="pg-btn">›</button>
    </div>
  );
}

export default function ProductTable({
  data, search, statusFilter, categoryFilter,
  onView, onDelete, onLockSelling, onUnlockSelling, togglingId,
}) {
  const [page, setPage] = useState(1);

  const filtered = data.filter((row) => {
    const matchName     = (row.name ?? "").toLowerCase().includes((search ?? "").toLowerCase());
    const matchStatus   = statusFilter   ? row.status === statusFilter : true;
    const matchCategory = categoryFilter
      ? String(row.category?.id) === String(categoryFilter) || row.category?.name === categoryFilter
      : true;
    return matchName && matchStatus && matchCategory;
  });

  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <style>{`
        .prod-card {
          background:#fff;
          border:0.5px solid #e5e7eb;
          border-radius:12px;
          overflow:hidden;
        }
        .prod-card-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:11px 16px;
          border-bottom:0.5px solid #e5e7eb;
        }
        .prod-card-head-left { display:flex; align-items:center; gap:8px; }
        .prod-card-head-ico {
          width:28px; height:28px; border-radius:8px;
          background:#E6F1FB; color:#185FA5;
          display:flex; align-items:center; justify-content:center; font-size:14px;
        }
        .prod-card-head-title { font-size:13px; font-weight:600; color:#111827; }
        .prod-count { font-size:12px; color:#166534; }

        .pl-wrap { overflow-x:auto; }

        /* ── HEADER ROW ──────────────────────────────────────────
           padding    → khoảng cách trên/dưới hàng tiêu đề
           font-size  → cỡ chữ label cột (chữ hoa nhỏ)
           min-width  → chiều rộng tối thiểu trước khi scroll ngang
                        (phải khớp với .plr bên dưới)
        ─────────────────────────────────────────────────────── */
        .plh {
          display:flex; align-items:center; gap:10px;
          min-width:860px; padding:10px 18px;
          font-size:11px; color:#9ca3af;
          text-transform:uppercase; letter-spacing:.6px;
          border-bottom:0.5px solid #e5e7eb;
          background:#f9fafb;
        }

        /* ── DATA ROW ────────────────────────────────────────────
           padding   → tăng để row cao hơn, giảm để row thấp hơn
           min-width → phải khớp với .plh ở trên
        ─────────────────────────────────────────────────────── */
        .plr {
          display:flex; align-items:center; gap:10px;
          min-width:860px; padding:12px 18px;
          border-bottom:0.5px solid #f3f4f6;
          transition:background .1s;
        }
        .plr:last-child { border:none; }
        .plr:hover { background:#f9fafb; }

        /* ── COLUMNS ─────────────────────────────────────────────
           Chỉnh width để thay đổi độ rộng từng cột.
           pc-name có flex:1 → tự co giãn theo không gian còn lại.
             pc-img    → cột ảnh thumbnail
             pc-name   → cột tên sản phẩm (co giãn tự do)
             pc-cat    → cột danh mục
             pc-cap    → cột năng suất
             pc-price  → cột giá sỉ
             pc-status → cột trạng thái
             pc-act    → cột nút thao tác
        ─────────────────────────────────────────────────────── */
        .pc-img    { width:52px;  flex-shrink:0; }
        .pc-name   { flex:1;     min-width:200px; }
        .pc-cat    { width:120px; flex-shrink:0; }
        .pc-cap    { width:120px; flex-shrink:0; }
        .pc-price  { width:110px; flex-shrink:0; text-align:right; }
        .pc-status { width:110px; flex-shrink:0; text-align:center; }
        .pc-act    { width:96px;  flex-shrink:0; text-align:right; }

        /* ── THUMBNAIL ───────────────────────────────────────────
           width/height → kích thước ảnh sản phẩm
        ─────────────────────────────────────────────────────── */
        .p-thumb {
          width:44px; height:44px; border-radius:9px;
          object-fit:cover; border:0.5px solid #e5e7eb;
          display:block;
        }
        .p-thumb-placeholder {
          width:44px; height:44px; border-radius:9px;
          background:#f3f4f6; border:0.5px solid #e5e7eb;
          display:flex; align-items:center; justify-content:center;
          color:#d1d5db; font-size:11px;
        }

        /* ── NAME BLOCK ──────────────────────────────────────────
           p-name font-size → cỡ chữ tên sản phẩm
           p-sku  font-size → cỡ chữ SKU/đơn vị phía dưới tên
        ─────────────────────────────────────────────────────── */
        .p-name-wrap { min-width:0; }
        .p-name {
          font-size:14px; font-weight:600; color:#111827;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          display:flex; align-items:center; gap:4px;
        }
        .p-sku { font-size:11px; color:#9ca3af; margin-top:2px; }

        /* ── CERT TAG ────────────────────────────────────────────
           Badge chứng nhận nhỏ gắn bên cạnh tên sản phẩm.
           font-size → cỡ chữ badge
        ─────────────────────────────────────────────────────── */
        .cert-tag {
          display:inline-flex; align-items:center; gap:2px;
          font-size:10px; font-weight:500; color:#185FA5;
          background:#E6F1FB; border-radius:4px;
          padding:1px 5px; white-space:nowrap; flex-shrink:0;
        }

        /* ── STATUS PILLS ────────────────────────────────────────
           Màu nền/chữ theo từng trạng thái — chỉnh tại đây.
           status-pill padding   → khoảng đệm trong viên pill
           status-pill font-size → cỡ chữ trạng thái
        ─────────────────────────────────────────────────────── */
        .pill-g  { background:#d1fae5; color:#166534; }
        .pill-a  { background:#FAEEDA; color:#854F0B; }
        .pill-r  { background:#FCEBEB; color:#A32D2D; }
        .pill-b  { background:#E6F1FB; color:#185FA5; }
        .pill-gr { background:#f3f4f6; color:#6b7280; }
        .status-pill {
          display:inline-block;
          padding:4px 11px; border-radius:20px;
          font-size:11px; font-weight:600; white-space:nowrap;
        }

        /* ── CELL TEXT ───────────────────────────────────────────
           cell-text-dim font-size → cỡ chữ danh mục / năng suất
           cell-price    font-size → cỡ chữ giá sỉ
        ─────────────────────────────────────────────────────── */
        .cell-text { font-size:13px; color:#374151; }
        .cell-text-dim { font-size:13px; color:#6b7280; }
        .cell-price { font-size:13px; font-weight:600; color:#111827; }

        /* ACTIONS */
        .p-actions { display:flex; gap:3px; justify-content:flex-end; }
        .p-act {
          width:28px; height:28px; border-radius:7px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          color:#6b7280; cursor:pointer; border:none; background:transparent;
          transition:background .1s, color .1s;
        }
        .p-act:hover             { background:#f3f4f6; color:#111827; }
        .p-act.warn:hover        { background:#FAEEDA; color:#854F0B; }
        .p-act.success:hover     { background:#d1fae5; color:#166534; }
        .p-act.danger:hover      { background:#FCEBEB; color:#A32D2D; }
        .p-act:disabled          { opacity:.35; cursor:not-allowed; }

        /* EMPTY */
        .prod-empty {
          padding:48px 16px; text-align:center;
          color:#9ca3af; font-size:13px; min-width:780px;
        }

        /* FOOTER */
        .prod-footer {
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 16px;
          border-top:0.5px solid #e5e7eb;
          font-size:11px; color:#9ca3af;
        }
        .prod-pagination { display:flex; align-items:center; gap:3px; }
        .pg-btn {
          min-width:28px; height:28px; border-radius:7px;
          font-size:12px; font-weight:500;
          border:none; background:transparent; color:#6b7280;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          transition:background .1s;
        }
        .pg-btn:hover:not(:disabled) { background:#f3f4f6; }
        .pg-btn.on { background:#0f3d20; color:#fff; }
        .pg-btn:disabled { opacity:.3; cursor:not-allowed; }
        .pg-ellipsis { width:28px; text-align:center; color:#9ca3af; font-size:12px; }
      `}</style>

      <div className="prod-card">
        {/* Card header */}
        <div className="prod-card-head">
          <div className="prod-card-head-left">
            <div className="prod-card-head-ico">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11"/>
              </svg>
            </div>
            <span className="prod-card-head-title">Danh sách sản phẩm</span>
          </div>
          <span className="prod-count">{filtered.length} sản phẩm</span>
        </div>

        <div className="pl-wrap">
          {/* Header */}
          <div className="plh">
            <div className="pc-img" />
            <div className="pc-name">Sản phẩm</div>
            <div className="pc-cat">Danh mục</div>
            <div className="pc-cap">Năng suất</div>
            <div className="pc-price">Giá sỉ</div>
            <div className="pc-status">Trạng thái</div>
            <div className="pc-act" />
          </div>

          {/* Rows */}
          {paginated.length === 0 ? (
            <div className="prod-empty">Không tìm thấy sản phẩm phù hợp.</div>
          ) : (
            paginated.map((row) => {
              const st       = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.pending;
              const thumb    = Array.isArray(row.images)
                ? (row.images.find((img) => img.is_thumbnail) || row.images[0])?.image_url
                : null;
              const certs    = Array.isArray(row.certifications) ? row.certifications : [];
              const isToggling = togglingId === row.id;
              const showLock   = canLockProduct(row.status);
              const showUnlock = canUnlockProduct(row.status);

              return (
                <div key={row.id} className="plr">
                  {/* Ảnh */}
                  <div className="pc-img">
                    {thumb
                      ? <img src={thumb} alt={row.name} className="p-thumb" />
                      : <div className="p-thumb-placeholder">N/A</div>
                    }
                  </div>

                  {/* Tên + cert tags */}
                  <div className="pc-name">
                    <div className="p-name-wrap">
                      <div className="p-name">
                        <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{row.name}</span>
                        {certs.map((c, i) => (
                          <span key={i} className="cert-tag">
                            <Award size={9} />
                            {typeof c === "string" ? c : c.name}
                          </span>
                        ))}
                      </div>
                      <div className="p-sku">
                        {row.unit ? `${row.unit}` : ""}
                        {row.sku  ? ` · ${row.sku}` : ""}
                      </div>
                    </div>
                  </div>

                  {/* Danh mục */}
                  <div className="pc-cat">
                    <span className="cell-text-dim">{row.category?.name ?? "—"}</span>
                  </div>

                  {/* Năng suất */}
                  <div className="pc-cap">
                    <span className="cell-text-dim">
                      {row.daily_production_capacity != null && row.daily_production_capacity !== ""
                        ? `${row.daily_production_capacity} kg/tháng`
                        : "—"}
                    </span>
                  </div>

                  {/* Giá sỉ */}
                  <div className="pc-price">
                    <span className="cell-price">{fmtPrice(row.wholesale_price)}</span>
                  </div>

                  {/* Trạng thái */}
                  <div className="pc-status">
                    <span className={`status-pill ${st.cls}`}>{st.label}</span>
                  </div>

                  {/* Thao tác */}
                  <div className="pc-act">
                    <div className="p-actions">
                      <button className="p-act" title="Xem chi tiết" onClick={() => onView(row)}>
                        <Eye size={14} />
                      </button>
                      {showLock && (
                        <button
                          className="p-act warn" title="Khóa bán"
                          disabled={isToggling} onClick={() => onLockSelling?.(row)}
                        >
                          <Lock size={14} />
                        </button>
                      )}
                      {showUnlock && (
                        <button
                          className="p-act success" title="Mở khóa"
                          disabled={isToggling} onClick={() => onUnlockSelling?.(row)}
                        >
                          <Unlock size={14} />
                        </button>
                      )}
                      <button className="p-act danger" title="Xóa" onClick={() => onDelete(row)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: đếm + phân trang */}
        {filtered.length > 0 && (
          <div className="prod-footer">
            <span>
              Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
            </span>
            <Pagination page={page} total={filtered.length} onChange={setPage} />
          </div>
        )}
      </div>
    </>
  );
}