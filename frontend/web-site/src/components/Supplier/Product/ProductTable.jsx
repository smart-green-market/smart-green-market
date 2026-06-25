import { useState, useEffect, useMemo } from "react";
import { canLockProduct, canUnlockProduct } from "./productSellingUtils";
import { Eye, Lock, Unlock, Award, ChevronDown, ChevronUp, ChevronsUpDown, X, Search } from "lucide-react";

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

function PriceInput({ label, value, onChange }) {
  return (
    <div className="f-price-wrap">
      <input
        type="number"
        min={0}
        className="f-price-input"
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
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

export default function ProductTable({
  data,
  onView, onDelete, onLockSelling, onUnlockSelling, togglingId,
}) {
  const [page, setPage] = useState(1);

  // Internal filter state
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceMin,       setPriceMin]       = useState("");
  const [priceMax,       setPriceMax]       = useState("");

  // Derive unique category options from data
  const categoryOptions = useMemo(() => {
    const seen = new Map();
    data.forEach((row) => {
      if (row.category?.id != null) {
        seen.set(String(row.category.id), row.category.name ?? `#${row.category.id}`);
      }
    });
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  }, [data]);

  const statusOptions = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }));

  const hasActiveFilter = search || statusFilter || categoryFilter || priceMin !== "" || priceMax !== "";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setPriceMin("");
    setPriceMax("");
  };

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const matchName     = (row.name ?? "").toLowerCase().includes((search ?? "").toLowerCase());
      const matchStatus   = statusFilter   ? row.status === statusFilter : true;
      const matchCategory = categoryFilter
        ? String(row.category?.id) === categoryFilter
        : true;
      const price = row.wholesale_price ?? 0;
      const matchMin = priceMin !== "" ? price >= Number(priceMin) : true;
      const matchMax = priceMax !== "" ? price <= Number(priceMax) : true;
      return matchName && matchStatus && matchCategory && matchMin && matchMax;
    });
  }, [data, search, statusFilter, categoryFilter, priceMin, priceMax]);

  // Sort state: { key: string, dir: "asc"|"desc" } | null
  const [sort, setSort] = useState(null);

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc")  return { key, dir: "desc" };
      return null; // reset
    });
  };

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    return [...filtered].sort((a, b) => {
      let av, bv;
      if (key === "name")     { av = a.name ?? ""; bv = b.name ?? ""; }
      else if (key === "cat") { av = a.category?.name ?? ""; bv = b.category?.name ?? ""; }
      else if (key === "cap") { av = a.daily_production_capacity ?? -1; bv = b.daily_production_capacity ?? -1; }
      else if (key === "price") { av = a.wholesale_price ?? -1; bv = b.wholesale_price ?? -1; }
      else if (key === "status") { av = a.status ?? ""; bv = b.status ?? ""; }
      else return 0;
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ?  1 : -1;
      return 0;
    });
  }, [filtered, sort]);

  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter, priceMin, priceMax, sort]);

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
        .f-label {
          font-size:11px; font-weight:600; color:#6b7280;
          text-transform:uppercase; letter-spacing:.5px;
          white-space:nowrap;
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

        /* Price inputs */
        .f-price-group {
          display:flex; align-items:center; gap:4px;
        }
        .f-price-sep { font-size:12px; color:#9ca3af; }
        .f-price-wrap { display:inline-flex; }
        .f-price-input {
          height:30px; width:110px; padding:0 9px;
          border:0.5px solid #d1d5db; border-radius:7px;
          font-size:12px; color:#374151; background:#fff;
          outline:none;
          transition:border-color .15s;
        }
        .f-price-input:focus { border-color:#166534; }
        .f-price-input::placeholder { color:#9ca3af; }
        /* Hide number spinners */
        .f-price-input::-webkit-outer-spin-button,
        .f-price-input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        .f-price-input[type=number] { -moz-appearance:textfield; }

        /* Clear button */
        .f-clear {
          display:inline-flex; align-items:center; gap:4px;
          height:28px; padding:0 10px; border-radius:7px;
          font-size:11px; font-weight:600; color:#A32D2D;
          background:#FCEBEB; border:none; cursor:pointer;
          transition:background .1s;
          white-space:nowrap;
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
          background:#E6F1FB; color:#185FA5;
          display:flex; align-items:center; justify-content:center; font-size:14px;
        }
        .prod-card-head-title { font-size:13px; font-weight:600; color:#111827; }
        .prod-count { font-size:12px; color:#166534; }

        .pl-wrap { overflow-x:auto; }

        .plh {
          display:flex; align-items:center; gap:10px;
          min-width:860px; padding:10px 18px;
          font-size:11px; color:#9ca3af;
          text-transform:uppercase; letter-spacing:.6px;
          border-bottom:0.5px solid #e5e7eb;
          background:#f9fafb;
        }
        .plr {
          display:flex; align-items:center; gap:10px;
          min-width:860px; padding:12px 18px;
          border-bottom:0.5px solid #f3f4f6;
          transition:background .1s;
        }
        .plr:last-child { border:none; }
        .plr:hover { background:#f9fafb; }

        .pc-img    { width:52px;  flex-shrink:0; }
        .pc-name   { flex:1;     min-width:200px; }
        .pc-cat    { width:120px; flex-shrink:0; }
        .pc-cap    { width:120px; flex-shrink:0; }
        .pc-price  { width:110px; flex-shrink:0; text-align:right; }
        .pc-status { width:110px; flex-shrink:0; text-align:center; }
        .pc-act    { width:96px;  flex-shrink:0; text-align:right; }

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

        .p-name-wrap { min-width:0; }
        .p-name {
          font-size:14px; font-weight:600; color:#111827;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          display:flex; align-items:center; gap:4px;
        }
        .p-sku { font-size:11px; color:#9ca3af; margin-top:2px; }

        .cert-tag {
          display:inline-flex; align-items:center; gap:2px;
          font-size:10px; font-weight:500; color:#185FA5;
          background:#E6F1FB; border-radius:4px;
          padding:1px 5px; white-space:nowrap; flex-shrink:0;
        }

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

        .cell-text-dim { font-size:13px; color:#6b7280; }
        .cell-price { font-size:13px; font-weight:600; color:#111827; }

        .p-actions { display:flex; gap:3px; justify-content:flex-end; }
        .p-act {
          width:28px; height:28px; border-radius:7px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          color:#6b7280; cursor:pointer; border:none; background:transparent;
          transition:background .1s, color .1s;
        }
        .p-act:hover         { background:#f3f4f6; color:#111827; }
        .p-act.warn:hover    { background:#FAEEDA; color:#854F0B; }
        .p-act.success:hover { background:#d1fae5; color:#166534; }
        .p-act.danger:hover  { background:#FCEBEB; color:#A32D2D; }
        .p-act:disabled      { opacity:.35; cursor:not-allowed; }

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
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11"/>
              </svg>
            </div>
            <span className="prod-card-head-title">Danh sách sản phẩm</span>
          </div>
          <span className="prod-count">{filtered.length} sản phẩm</span>
        </div>

        {/* ── Filter bar ── */}
        <div className="f-bar">
          {/* Search */}
          <div className="f-search-wrap">
            <Search size={13} className="f-search-ico" />
            <input
              className="f-search"
              placeholder="Tìm tên sản phẩm..."
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
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            placeholder="Trạng thái"
          />

          <div className="f-divider" />

          {/* Danh mục */}
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions}
            placeholder="Danh mục"
          />

          <div className="f-divider" />

          {/* Khoảng giá */}
          <div className="f-price-group">
            <PriceInput label="Giá từ (đ)" value={priceMin} onChange={setPriceMin} />
            <span className="f-price-sep">–</span>
            <PriceInput label="Đến (đ)" value={priceMax} onChange={setPriceMax} />
          </div>

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
            <div className="pc-img" />
            <div className="pc-name">
              <span className={`th-sort${sort?.key === "name" ? " active" : ""}`} onClick={() => toggleSort("name")}>
                Sản phẩm
                {sort?.key === "name"
                  ? sort.dir === "asc" ? <ChevronUp size={12} className="th-sort-ico" /> : <ChevronDown size={12} className="th-sort-ico" />
                  : <ChevronsUpDown size={12} className="th-sort-ico" />}
              </span>
            </div>
            <div className="pc-cat">
              <span className={`th-sort${sort?.key === "cat" ? " active" : ""}`} onClick={() => toggleSort("cat")}>
                Danh mục
                {sort?.key === "cat"
                  ? sort.dir === "asc" ? <ChevronUp size={12} className="th-sort-ico" /> : <ChevronDown size={12} className="th-sort-ico" />
                  : <ChevronsUpDown size={12} className="th-sort-ico" />}
              </span>
            </div>
            <div className="pc-cap">
              <span className={`th-sort${sort?.key === "cap" ? " active" : ""}`} onClick={() => toggleSort("cap")}>
                Năng suất
                {sort?.key === "cap"
                  ? sort.dir === "asc" ? <ChevronUp size={12} className="th-sort-ico" /> : <ChevronDown size={12} className="th-sort-ico" />
                  : <ChevronsUpDown size={12} className="th-sort-ico" />}
              </span>
            </div>
            <div className="pc-price" style={{display:"flex",justifyContent:"flex-end"}}>
              <span className={`th-sort${sort?.key === "price" ? " active" : ""}`} onClick={() => toggleSort("price")}>
                Giá sỉ
                {sort?.key === "price"
                  ? sort.dir === "asc" ? <ChevronUp size={12} className="th-sort-ico" /> : <ChevronDown size={12} className="th-sort-ico" />
                  : <ChevronsUpDown size={12} className="th-sort-ico" />}
              </span>
            </div>
            <div className="pc-status" style={{display:"flex",justifyContent:"center"}}>
              <span className={`th-sort${sort?.key === "status" ? " active" : ""}`} onClick={() => toggleSort("status")}>
                Trạng thái
                {sort?.key === "status"
                  ? sort.dir === "asc" ? <ChevronUp size={12} className="th-sort-ico" /> : <ChevronDown size={12} className="th-sort-ico" />
                  : <ChevronsUpDown size={12} className="th-sort-ico" />}
              </span>
            </div>
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
                  <div className="pc-img">
                    {thumb
                      ? <img src={thumb} alt={row.name} className="p-thumb" />
                      : <div className="p-thumb-placeholder">N/A</div>
                    }
                  </div>

                  <div className="pc-name">
                    <div className="p-name-wrap">
                      <div className="p-name">
                        <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{row.category.scope === "custom"? row.name+" (cá nhân)":row.name}</span>
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

                  <div className="pc-cat">
                    <span className="cell-text-dim">{row.category?.name ?? "—"}</span>
                  </div>

                  <div className="pc-cap">
                    <span className="cell-text-dim">
                      {row.daily_production_capacity != null && row.daily_production_capacity !== ""
                        ? `${row.daily_production_capacity} kg/tháng`
                        : "—"}
                    </span>
                  </div>

                  <div className="pc-price">
                    <span className="cell-price">{fmtPrice(row.wholesale_price)}</span>
                  </div>

                  <div className="pc-status">
                    <span className={`status-pill ${st.cls}`}>{st.label}</span>
                  </div>

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
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

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