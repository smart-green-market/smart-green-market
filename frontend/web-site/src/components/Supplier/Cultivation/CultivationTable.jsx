import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { SupplierActionButton, SupplierActionGroup } from "../UI/SupplierTableActions";

const PAGE_SIZES = [6, 10, 20];

export default function CultivationTable({ data, search, productFilter, onView, onEdit, onDelete }) {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [sortField, setSortField] = useState("step_order");
  const [sortDir, setSortDir]     = useState("asc");

  // ── Filter + Search ──────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = [...data];
    if (productFilter) rows = rows.filter(r => String(r.supplier_product) === productFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r =>
        r.process_name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }
    // sort
    rows.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [data, search, productFilter, sortField, sortDir]);

  const total     = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage  = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-neutral-300 ml-1">↕</span>;
    return <span className="text-emerald-700 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="w-full rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8f7f5] border-b border-neutral-200">
              <Th onClick={() => handleSort("supplier_product")} className="w-[180px]">
                Ten Sản phẩm <SortIcon field="supplier_product" />
              </Th>
              <Th onClick={() => handleSort("step_order")} className="w-[80px] text-center">
                Bước <SortIcon field="step_order" />
              </Th>
              <Th onClick={() => handleSort("process_name")}>
                Tên quy trình <SortIcon field="process_name" />
              </Th>
              <Th>Mô tả</Th>
              <Th onClick={() => handleSort("created_at")} className="w-[130px]">
                Ngày tạo <SortIcon field="created_at" />
              </Th>
              <Th className="min-w-[220px] text-center">Thao tác</Th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-neutral-400 py-16 text-sm">
                  Không tìm thấy quy trình nào.
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-neutral-200 last:border-0 transition-colors hover:bg-[#fafaf9] ${
                    idx % 2 === 0 ? "" : "bg-neutral-50/50"
                  }`}
                >
                  {/* Ten Sản phẩm */}
                  <td className="px-6 py-5">
                    <span className="font-medium text-neutral-800 text-sm">
                      {row.product_name ?? "—"}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                      {row.step_order}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span className="font-semibold text-gray-900 text-sm">{row.process_name}</span>
                  </td>

                  <td className="px-6 py-5 text-neutral-500 max-w-[320px]">
                    <span className="line-clamp-2 text-sm">{row.description}</span>
                  </td>

                  <td className="px-6 py-5 text-neutral-500 text-sm">
                    {formatDate(row.created_at)}
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <SupplierActionGroup>
                      <SupplierActionButton label="Xem" onClick={() => onView(row)} />
                      <SupplierActionButton label="Sửa" onClick={() => onEdit(row)} />
                      <SupplierActionButton
                        label="Xóa"
                        variant="danger"
                        onClick={() => onDelete(row)}
                      />
                    </SupplierActionGroup>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-4 px-6 py-3 text-[13px] text-neutral-600 bg-[#f8f7f5] border-t border-neutral-200 font-['Geist',sans-serif]">
        <div className="flex items-center gap-2">
          <span>Hiển thị:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="border border-neutral-200 rounded-md px-2 py-1 text-sm outline-none focus:border-emerald-600"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span>
          {total === 0 ? "0-0 trong 0" : `${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, total)} trong ${total}`}
        </span>
        <div className="flex items-center gap-1">
          <PagBtn onClick={() => setPage(1)}           disabled={safePage === 1}><ChevronsLeft size={14} /></PagBtn>
          <PagBtn onClick={() => setPage(p => p - 1)} disabled={safePage === 1}><ChevronLeft  size={14} /></PagBtn>
          <PagBtn onClick={() => setPage(p => p + 1)} disabled={safePage === totalPages}><ChevronRight size={14} /></PagBtn>
          <PagBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages}><ChevronsRight size={14} /></PagBtn>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────
const Th = ({ children, className = "", onClick }) => (
  <th
    onClick={onClick}
    className={`px-6 py-4 text-left text-[11px] font-bold text-neutral-600 uppercase tracking-[0.07em] whitespace-nowrap font-['Geist',sans-serif] ${onClick ? "cursor-pointer select-none hover:text-emerald-700" : ""} ${className}`}
  >
    {children}
  </th>
);

const PagBtn = ({ children, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="p-1 rounded border border-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
  >
    {children}
  </button>
);

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}