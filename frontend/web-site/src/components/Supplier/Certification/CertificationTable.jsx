import { Award } from "lucide-react";
import { getExpiryInfo } from "./certificationStatus";
import { useState,useEffect } from "react";


const STATUS_CONFIG = {
  pending:  { label: "CHỜ DUYỆT", bg: "bg-amber-500/10",   text: "text-amber-600"  },
  approved: { label: "ĐÃ DUYỆT",  bg: "bg-emerald-600/10", text: "text-emerald-700" },
  rejected: { label: "TỪ CHỐI",   bg: "bg-red-600/10",     text: "text-red-600"    },
  expired:  { label: "HẾT HẠN",   bg: "bg-neutral-500/10", text: "text-neutral-600" },
  revoked:  { label: "THU HỒI",   bg: "bg-rose-600/10",    text: "text-rose-700"   },
};
 
const BAR_TONE = {
  g: "bg-emerald-500",
  a: "bg-amber-500",
  r: "bg-red-500",
};
 
const LABEL_TONE = {
  g: "text-emerald-700",
  a: "text-amber-600",
  r: "text-red-600",
};
 
const PAGE_SIZE = 9; // 3 cột × 3 hàng
 
function CertCard({ row, onView }) {
  const st = STATUS_CONFIG[row.status] ?? {
    label: row.status,
    bg: "bg-gray-100",
    text: "text-gray-600",
  };
  const expiry = getExpiryInfo(row.issue_date, row.expiry_date);
  const showExpiry = expiry && row.status !== "rejected" && row.status !== "revoked";
 
  const fmtMonthYear = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };
 
  const products = Array.isArray(row.products) ? row.products : null;
  const visibleProducts = products?.slice(0, 3) ?? [];
  const extraCount = products ? Math.max(0, products.length - visibleProducts.length) : 0;
 
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 flex flex-col gap-3">
      {/* Head */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${st.bg} ${st.text}`}>
          <Award size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-950 font-['Geist',sans-serif] truncate">
            {row.name}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5 truncate">
            {row.issued_by || "—"} · Mã số {row.certificate_code || row.code || "—"}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide whitespace-nowrap ${st.bg} ${st.text}`}>
          {st.label}
        </span>
      </div>
 
      {/* Timeline */}
      {showExpiry && (
        <div>
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span>{fmtMonthYear(row.issue_date)} – {fmtMonthYear(row.expiry_date)}</span>
            <span className={`font-medium ${LABEL_TONE[expiry.tone]}`}>{expiry.label}</span>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${BAR_TONE[expiry.tone]}`}
              style={{ width: `${expiry.percent}%` }}
            />
          </div>
        </div>
      )}
 
      {/* Sản phẩm */}
      {visibleProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleProducts.map((p, i) => (
            <span key={i} className="px-2 py-1 rounded-md bg-neutral-100 text-[11px] text-neutral-600">
              {typeof p === "string" ? p : p.name}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="px-2 py-1 rounded-md bg-neutral-100 text-[11px] text-neutral-500">
              +{extraCount} sản phẩm khác
            </span>
          )}
        </div>
      )}
 
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 mt-auto">
        <span className="text-xs text-neutral-400">
          {products ? `Áp dụng cho ${products.length} sản phẩm` : `Mã: ${row.certificate_code || row.code || "—"}`}
        </span>
        <button
          onClick={() => onView(row)}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Xem chi tiết →
        </button>
      </div>
    </div>
  );
}
 
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
 
  // Tạo danh sách số trang hiển thị (tối đa 5, có dấu "…")
  const getPages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, "…", totalPages];
    if (page >= totalPages - 2) return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };
 
  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={15} />
      </button>
 
      {getPages().map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-neutral-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
              p === page
                ? "bg-emerald-800 text-white"
                : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            {p}
          </button>
        )
      )}
 
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
 
export default function CertificationTable({ data, search, statusFilter, onView }) {
  const [page, setPage] = useState(1);
 
  const filtered = data.filter((row) => {
    const searchStr = (search || "").toLowerCase();
    const matchName = (row?.name || "").toLowerCase().includes(searchStr);
    const matchCode = (row?.certificate_code || row?.code || "").toLowerCase().includes(searchStr);
    const matchStatus = statusFilter ? row.status === statusFilter : true;
    return (matchName || matchCode) && matchStatus;
  });
 
  // Reset về trang 1 khi filter/search thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);
 
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
 
  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-neutral-400 font-['Geist']">
        Không có chứng nhận nào phù hợp.
      </div>
    );
  }
 
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((row) => (
          <CertCard key={row.id ?? row.certificate_code ?? row.code} row={row} onView={onView} />
        ))}
      </div>
 
      <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
        <span>
          Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} chứng nhận
        </span>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}