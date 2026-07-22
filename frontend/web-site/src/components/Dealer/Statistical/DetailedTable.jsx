import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { formatCurrency } from "./formatCurrency";
import Pagination from "../../common/Pagination";

const PAGE_SIZE = 10;

// ─── Column definitions ────────────────────────────────────────────────────
const COLUMNS = [
    { key: "period", label: "Thời gian", align: "left" },
    { key: "sales_count", label: "Đơn bán lẻ", align: "center" },
    { key: "revenue", label: "Doanh thu bán", align: "right" },
    { key: "purchase_count", label: "Đơn nhập sỉ", align: "center" },
    { key: "purchase_cost", label: "Chi phí nhập", align: "right" },
];

// ─── Sort icon ─────────────────────────────────────────────────────────────
function SortIcon({ colKey, sortKey, sortDir }) {
    if (sortKey !== colKey) return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc"
        ? <ChevronUp className="w-3 h-3 text-emerald-600" />
        : <ChevronDown className="w-3 h-3 text-emerald-600" />;
}

/**
 * DetailedTable
 * Tabular breakdown of revenue, cost and profit for each period.
 * Includes client-side sorting per column and pagination (PAGE_SIZE rows/page).
 *
 * Props:
 *   detailedBreakdown – array of:
 *     { period, sales_count, revenue, purchase_count, purchase_cost, profit }
 */
export default function DetailedTable({ detailedBreakdown }) {
    const [sortKey, setSortKey] = useState("period");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);

    // ── toggle sort ──────────────────────────────────────────────────────
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
        setPage(1); // reset to first page on sort change
    };

    // ── sorted data ──────────────────────────────────────────────────────
    const sorted = useMemo(() => {
        const copy = [...detailedBreakdown];
        copy.sort((a, b) => {
            const va = a[sortKey] ?? "";
            const vb = b[sortKey] ?? "";
            if (typeof va === "number" && typeof vb === "number") {
                return sortDir === "asc" ? va - vb : vb - va;
            }
            return sortDir === "asc"
                ? String(va).localeCompare(String(vb))
                : String(vb).localeCompare(String(va));
        });
        return copy;
    }, [detailedBreakdown, sortKey, sortDir]);

    // ── paginated slice ──────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // ── column alignment helpers ─────────────────────────────────────────
    const thAlign = (align) =>
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

    const tdAlign = (align) =>
        align === "right" ? "text-right" : align === "center" ? "text-center" : "";

    const rowCell = (row, col) => {
        switch (col.key) {
            case "period": return <span className="font-bold text-neutral-800">{row.period}</span>;
            case "sales_count": return <span className="font-bold text-neutral-500">{row.sales_count}</span>;
            case "revenue": return <span className="text-emerald-700 font-bold">{formatCurrency(row.revenue)}</span>;
            case "purchase_count": return <span className="font-bold text-neutral-500">{row.purchase_count}</span>;
            case "purchase_cost": return <span className="text-amber-700 font-bold">{formatCurrency(row.purchase_cost)}</span>;
            default: return null;
        }
    };

    return (
        <div className="bg-white border border-emerald-100/50 rounded-2xl shadow-xs overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-extrabold text-emerald-950">Chi tiết lịch sử dòng tiền</h2>
                    <p className="text-xs text-neutral-400 font-medium">
                        Bảng kê khai chi tiết doanh số và chi phí theo từng chu kỳ lọc
                    </p>
                </div>
                {detailedBreakdown.length > 0 && (
                    <span className="text-[10px] font-bold text-neutral-400 bg-neutral-50 border border-neutral-100 px-3 py-1 rounded-full">
                        {detailedBreakdown.length} kỳ
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-100 text-[10px]">
                            {COLUMNS.map((col, idx) => (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className={`p-4 ${idx === 0 ? "pl-6" : ""} ${idx === COLUMNS.length - 1 ? "pr-6" : ""} font-bold text-neutral-400 uppercase tracking-wider cursor-pointer select-none hover:text-emerald-700 transition-colors ${thAlign(col.align)}`}
                                >
                                    <div className={`inline-flex items-center gap-1 ${col.align === "right" ? "flex-row-reverse" : ""}`}>
                                        {col.label}
                                        <SortIcon colKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                        {detailedBreakdown.length === 0 ? (
                            <tr>
                                <td colSpan={COLUMNS.length} className="p-8 text-center text-neutral-400 font-medium text-xs">
                                    Không tìm thấy dữ liệu mốc thời gian lọc
                                </td>
                            </tr>
                        ) : (
                            paginated.map((row, idx) => (
                                <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                                    {COLUMNS.map((col, colIdx) => (
                                        <td
                                            key={col.key}
                                            className={`p-4 ${colIdx === 0 ? "pl-6" : ""} ${colIdx === COLUMNS.length - 1 ? "pr-6" : ""} ${tdAlign(col.align)}`}
                                        >
                                            {rowCell(row, col)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 pb-6">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={(p) => {
                            setPage(p);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
