import { useState, useEffect, useMemo } from "react";
import { Eye, Trash2, ChevronDown, ChevronUp, ChevronsUpDown, X, Search, Tag } from "lucide-react";

const STATUS_CONFIG = {
  active:   { label: "Hoạt động", cls: "pill-g"  },
  pending:  { label: "Chờ duyệt", cls: "pill-a"  },
  rejected: { label: "Từ chối",   cls: "pill-r"  },
};

const PAGE_SIZE = 8;

// ─── Helpers ────────────────────────────────────────────────────────────────

function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="f-select-wrap">
      <select className="f-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={13} className="f-select-ico" />
    </div>
  );
}

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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CategoryTable({ data, onView, onDelete }) {
  const [page, setPage] = useState(1);

  // Internal filter state
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const statusOptions = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }));

  const hasActiveFilter = search || statusFilter;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const matchName   = (row.name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? row.status === statusFilter : true;
      return matchName && matchStatus;
    });
  }, [data, search, statusFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  // Sort state
  const [sort, setSort] = useState(null);

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc")  return { key, dir: "desc" };
      return null;
    });
  };

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    return [...filtered].sort((a, b) => {
      let av, bv;
      if      (key === "id")     { av = a.id ?? 0;                      bv = b.id ?? 0; }
      else if (key === "name")   { av = a.name ?? "";                   bv = b.name ?? ""; }
      else if (key === "order")  { av = a.sort_order ?? -1;             bv = b.sort_order ?? -1; }
      else if (key === "verif")  { av = a.verified_by_username ?? "";   bv = b.verified_by_username ?? ""; }
      else if (key === "date")   { av = a.created_at ?? "";             bv = b.created_at ?? ""; }
      else if (key === "status") { av = a.status ?? "";                 bv = b.status ?? ""; }
      else return 0;
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ?  1 : -1;
      return 0;
    });
  }, [filtered, sort]);

  useEffect(() => { setPage(1); }, [sort]);

  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <style>{`
        /* ── FILTER BAR ─────────────────────────────────────────── */
        .f-bar {
          display:flex; align-items:center; flex-wrap:wrap; gap:8px;
          padding:10px 16px;
          border-bottom:0.5px solid #e5e7eb;
          background:#fafafa;
        }
        .f-divider { width:1px; height:18px; background:#e5e7eb; flex-shrink:0; }

        /* Search */
        .f-search-wrap {
          position:relative; display:inline-flex; align-items:center;
        }
        .f-search-ico {
          position:absolute; left:8px; top:50%; transform:translateY(-50%);
          color:#9ca3af; pointer-events:none;
        }
        .f-search {
          height:30px; padding:0 28px 0 28px;
          border:0.5px solid #d1d5db; border-radius:7px;
          font-size:12px; color:#374151; background:#fff;
          outline:none; width:200px;
          transition:border-color .15s;
        }
        .f-search:focus { border-color:#166534; }
        .f-search::placeholder { color:#9ca3af; }
        .f-search-clear {
          position:absolute; right:7px; top:50%; transform:translateY(-50%);
          color:#9ca3af; cursor:pointer; display:flex; align-items:center;
          background:none; border:none; padding:0;
        }
        .f-search-clear:hover { color:#374151; }

        /* Select */
        .f-select-wrap { position:relative; display:inline-flex; align-items:center; }
        .f-select {
          appearance:none; -webkit-appearance:none;
          height:30px; padding:0 28px 0 10px;
          border:0.5px solid #d1d5db; border-radius:7px;
          font-size:12px; color:#374151; background:#fff;
          cursor:pointer; outline:none;
          transition:border-color .15s;
        }
        .f-select:focus { border-color:#166534; }
        .f-select-ico {
          position:absolute; right:7px; top:50%; transform:translateY(-50%);
          color:#9ca3af; pointer-events:none;
        }

        /* Clear button */
        .f-clear {
          display:inline-flex; align-items:center; gap:4px;
          height:28px; padding:0 10px; border-radius:7px;
          font-size:11px; font-weight:600; color:#A32D2D;
          background:#FCEBEB; border:none; cursor:pointer;
          transition:background .1s; white-space:nowrap;
        }
        .f-clear:hover { background:#f9c6c6; }

        /* ── CARD ───────────────────────────────────────────────── */
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
          background:#d1fae5; color:#166534;
          display:flex; align-items:center; justify-content:center;
        }
        .prod-card-head-title { font-size:13px; font-weight:600; color:#111827; }
        .prod-count { font-size:12px; color:#166534; }

        .pl-wrap { overflow-x:auto; }

        /* ── HEADER / ROW ───────────────────────────────────────── */
        .plh {
          display:flex; align-items:center; gap:10px;
          min-width:780px; padding:10px 18px;
          font-size:11px; color:#9ca3af;
          text-transform:uppercase; letter-spacing:.6px;
          border-bottom:0.5px solid #e5e7eb;
          background:#f9fafb;
        }
        .plr {
          display:flex; align-items:center; gap:10px;
          min-width:780px; padding:12px 18px;
          border-bottom:0.5px solid #f3f4f6;
          transition:background .1s;
        }
        .plr:last-child { border:none; }
        .plr:hover { background:#f9fafb; }

        /* ── COLUMNS ─────────────────────────────────────────────
           cc-id      → cột ID
           cc-name    → cột tên danh mục (co giãn)
           cc-desc    → cột mô tả
           cc-order   → cột thứ tự
           cc-verif   → cột xác minh bởi
           cc-date    → cột ngày tạo
           cc-status  → cột trạng thái
           cc-act     → cột thao tác
        ─────────────────────────────────────────────────────── */
        .cc-id     { width:52px;  flex-shrink:0; }
        .cc-name   { width:160px; flex-shrink:0; }
        .cc-desc   { flex:1;      min-width:160px; }
        .cc-order  { width:80px;  flex-shrink:0; text-align:center; }
        .cc-verif  { width:130px; flex-shrink:0; }
        .cc-date   { width:100px; flex-shrink:0; }
        .cc-status { width:110px; flex-shrink:0; text-align:center; }
        .cc-act    { width:80px;  flex-shrink:0; text-align:right; }

        /* ── CELL TEXT ──────────────────────────────────────────── */
        .c-id   { font-size:11px; font-weight:600; color:#166534; font-family:monospace; }
        .c-name { font-size:13px; font-weight:600; color:#111827; }
        .c-dim  {
          font-size:12px; color:#6b7280;
          display:-webkit-box; -webkit-line-clamp:2;
          -webkit-box-orient:vertical; overflow:hidden;
        }
        .c-mono { font-size:13px; color:#374151; }
        .c-date { font-size:12px; color:#6b7280; }

        /* ── STATUS PILLS ───────────────────────────────────────── */
        .pill-g  { background:#d1fae5; color:#166534; }
        .pill-a  { background:#FAEEDA; color:#854F0B; }
        .pill-r  { background:#FCEBEB; color:#A32D2D; }
        .status-pill {
          display:inline-block;
          padding:4px 11px; border-radius:20px;
          font-size:11px; font-weight:600; white-space:nowrap;
        }

        /* ── ACTIONS ────────────────────────────────────────────── */
        .p-actions { display:flex; gap:3px; justify-content:flex-end; }
        .p-act {
          width:28px; height:28px; border-radius:7px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          color:#6b7280; cursor:pointer; border:none; background:transparent;
          transition:background .1s, color .1s;
        }
        .p-act:hover        { background:#f3f4f6; color:#111827; }
        .p-act.danger:hover { background:#FCEBEB; color:#A32D2D; }
        .p-act:disabled     { opacity:.35; cursor:not-allowed; }

        /* ── EMPTY / FOOTER ─────────────────────────────────────── */
        .prod-empty {
          padding:48px 16px; text-align:center;
          color:#9ca3af; font-size:13px; min-width:780px;
        }
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

        /* ── SORT ───────────────────────────────────────────────── */
        .th-sort {
          display:inline-flex; align-items:center; gap:3px;
          cursor:pointer; user-select:none;
          transition:color .1s;
        }
        .th-sort:hover { color:#374151; }
        .th-sort.active { color:#0f3d20; }
        .th-sort-ico { flex-shrink:0; opacity:.5; }
        .th-sort.active .th-sort-ico { opacity:1; }
      `}</style>

      <div className="prod-card">
        {/* Card header */}
        <div className="prod-card-head">
          <div className="prod-card-head-left">
            <div className="prod-card-head-ico">
              <Tag size={14} />
            </div>
            <span className="prod-card-head-title">Danh sách danh mục</span>
          </div>
          <span className="prod-count">{filtered.length} danh mục</span>
        </div>

        {/* Filter bar */}
        <div className="f-bar">
          {/* Search */}
          <div className="f-search-wrap">
            <Search size={13} className="f-search-ico" />
            <input
              className="f-search"
              placeholder="Tìm tên danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="f-search-clear" onClick={() => setSearch("")}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className="f-divider" />

          {/* Trạng thái */}
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            placeholder="Trạng thái"
          />

          {/* Xoá filter */}
          {hasActiveFilter && (
            <button className="f-clear" onClick={clearFilters}>
              <X size={11} /> Xoá bộ lọc
            </button>
          )}
        </div>

        <div className="pl-wrap">
          {/* Header */}
          <div className="plh">
            <div className="cc-id">
              <span className={`th-sort${sort?.key === "id" ? " active" : ""}`} onClick={() => toggleSort("id")}>
                ID
                {sort?.key === "id"
                  ? sort.dir === "asc" ? <ChevronUp size={12} className="th-sort-ico" /> : <ChevronDown size={12} className="th-sort-ico" />
                  : <ChevronsUpDown size={12} className="th-sort-ico" />}
              </span>
            </div>
            <div className="cc-name">
              <span className={`th-sort${sort?.key === "name" ? " active" : ""}`} onClick={() => toggleSort("name")}>
                Tên danh mục
                {sort?.key === "name"
                  ? sort.dir === "asc" ? <ChevronUp size={12} className="th-sort-ico" /> : <ChevronDown size={12} className="th-sort-ico" />
                  : <ChevronsUpDown size={12} className="th-sort-ico" />}
              </span>
            </div>
            <div className="cc-desc">Mô tả</div>
            <div className="cc-order" style={{display:"flex",justifyContent:"center"}}>
              <span className={`th-sort${sort?.key === "order" ? " active" : ""}`} onClick={() => toggleSort("order")}>
                Thứ tự
                {sort?.key === "order"
                  ? sort.dir === "asc" ? <ChevronUp size={12} className="th-sort-ico" /> : <ChevronDown size={12} className="th-sort-ico" />
                  : <ChevronsUpDown size={12} className="th-sort-ico" />}
              </span>
            </div>
            {/* <div className="cc-verif">
              <span className={`th-sort${sort?.key === "verif" ? " active" : ""}`} onClick={() => toggleSort("verif")}>
                Xác minh bởi
                {sort?.key === "verif"
                  ? sort.dir === "asc" ? <ChevronUp size={12} className="th-sort-ico" /> : <ChevronDown size={12} className="th-sort-ico" />
                  : <ChevronsUpDown size={12} className="th-sort-ico" />}
              </span>
            </div> */}
            <div className="cc-date">
              <span className={`th-sort${sort?.key === "date" ? " active" : ""}`} onClick={() => toggleSort("date")}>
                Ngày tạo
                {sort?.key === "date"
                  ? sort.dir === "asc" ? <ChevronUp size={12} className="th-sort-ico" /> : <ChevronDown size={12} className="th-sort-ico" />
                  : <ChevronsUpDown size={12} className="th-sort-ico" />}
              </span>
            </div>
            <div className="cc-status" style={{display:"flex",justifyContent:"center"}}>
              <span className={`th-sort${sort?.key === "status" ? " active" : ""}`} onClick={() => toggleSort("status")}>
                Trạng thái
                {sort?.key === "status"
                  ? sort.dir === "asc" ? <ChevronUp size={12} className="th-sort-ico" /> : <ChevronDown size={12} className="th-sort-ico" />
                  : <ChevronsUpDown size={12} className="th-sort-ico" />}
              </span>
            </div>
            <div className="cc-act" />
          </div>

          {/* Rows */}
          {paginated.length === 0 ? (
            <div className="prod-empty">Không tìm thấy danh mục phù hợp.</div>
          ) : (
            paginated.map((row) => {
              const st = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.pending;
              return (
                <div key={row.id} className="plr">
                  {/* ID */}
                  <div className="cc-id">
                    <span className="c-id">#{row.id}</span>
                  </div>

                  {/* Tên */}
                  <div className="cc-name">
                    <span className="c-name">{row.name}</span>
                  </div>

                  {/* Mô tả */}
                  <div className="cc-desc">
                    <span className="c-dim">{row.description || "—"}</span>
                  </div>

                  {/* Thứ tự */}
                  <div className="cc-order">
                    <span className="c-mono">{row.sort_order ?? "—"}</span>
                  </div>

                  {/* Xác minh bởi */}
                  {/* <div className="cc-verif">
                    <span className="c-dim">{row.verified_by_username || "—"}</span>
                  </div> */}

                  {/* Ngày tạo */}
                  <div className="cc-date">
                    <span className="c-date">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString("vi-VN")
                        : "—"}
                    </span>
                  </div>

                  {/* Trạng thái */}
                  <div className="cc-status">
                    <span className={`status-pill ${st.cls}`}>{st.label}</span>
                  </div>

                  {/* Thao tác */}
                  <div className="cc-act">
                    <div className="p-actions">
                      <button className="p-act" title="Xem chi tiết" onClick={() => onView(row)}>
                        <Eye size={14} />
                      </button>
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

        {/* Footer */}
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