import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/tableStyles";
import { formatDateTime } from "../../common/formatDateTime";

import { matchesVoucherStatusFilter, isVoucherPending } from "./voucherHelpers";

// ── Status ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    active:   { label: "HOẠT ĐỘNG",   bg: "bg-green-200",   text: "text-green-800"  },
    rejected: { label: "TỪ CHỐI",     bg: "bg-red-200",     text: "text-red-800"   },
    pending:  { label: "ĐĂNG KÝ",     bg: "bg-amber-200",   text: "text-amber-800" },
    draft:    { label: "ĐĂNG KÝ",     bg: "bg-amber-200",   text: "text-amber-800" },
};

const formatCurrency = (val) => {
    if (val == null || isNaN(Number(val))) return "—";
    return new Intl.NumberFormat('vi-VN').format(Number(val)) + ' đ';
};

const formatDiscountValue = (row) => {
    const val = Number(row.discount_value || 0);
    if (row.discount_type === "percent") {
        return `${val}%`;
    }
    return formatCurrency(val);
};

const formatCustomDateTime = (val) => {
    if (!val) return "—";
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
};

const renderDateRange = (row) => {
    if (!row.start_date && !row.end_date) return "Không giới hạn";
    return (
        <div className="flex flex-col py-1 text-xs font-['Geist',sans-serif] leading-tight w-full justify-center">
            <div className="flex items-center text-neutral-700 gap-1">
                <span className="font-bold text-emerald-700 text-[10px] uppercase shrink-0 w-6 text-left">BD:</span>
                <span className="font-semibold font-mono">{formatCustomDateTime(row.start_date)}</span>
            </div>
            <div className="flex items-center text-neutral-600 mt-1 gap-1">
                <span className="font-bold text-red-600 text-[10px] uppercase shrink-0 w-6 text-left">KT:</span>
                <span className="font-semibold font-mono">{formatCustomDateTime(row.end_date)}</span>
            </div>
        </div>
    );
};

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView) => [
    {
        name: "Mã Voucher",
        selector: (row) => row.code,
        sortable: true,
        width: "150px",
        cell: (row) => (
            <span className="font-mono font-bold text-sm text-emerald-800 tracking-wide">
                {row.code}
            </span>
        ),
    },
    {
        name: "Tiêu đề",
        selector: (row) => row.title,
        sortable: true,
        grow: 1.5,
        cell: (row) => (
            <div className="flex flex-col py-2 font-['Geist',sans-serif]">
                <span className="font-semibold text-sm text-zinc-900 leading-tight">
                    {row.title}
                </span>
                {row.description && (
                    <span className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                        {row.description}
                    </span>
                )}
            </div>
        ),
    },
    {
        name: "Mức giảm",
        selector: (row) => row.discount_value,
        sortable: true,
        center: true,
        width: "120px",
        cell: (row) => (
            <span className="text-sm font-bold text-teal-700 font-['Geist',sans-serif]">
                {formatDiscountValue(row)}
            </span>
        ),
    },
    {
        name: "Đơn tối thiểu",
        selector: (row) => row.min_order_amount,
        sortable: true,
        center: true,
        width: "140px",
        cell: (row) => (
            <span className="text-sm font-medium text-neutral-600 font-['Geist',sans-serif]">
                {formatCurrency(row.min_order_amount)}
            </span>
        ),
    },
    {
        name: "Thời gian",
        selector: (row) => row.start_date,
        sortable: true,
        center: true,
        width: "210px",
        cell: (row) => renderDateRange(row),
    },
    {
        name: "Trạng thái",
        selector: (row) => row.status,
        sortable: true,
        center: true,
        width: "130px",
        cell: (row) => {
            const st = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.pending;
            return (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-['Geist',sans-serif] uppercase tracking-wide ${st.bg} ${st.text}`}>
                    {st.label}
                </span>
            );
        },
    },
    {
        name: "Thao tác",
        width: "130px",
        center: true,
        cell: (row) => (
            <div className="flex items-center justify-center">
                <button
                    onClick={() => onView(row)}
                    title="Xem chi tiết"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold font-['Geist',sans-serif] bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                >
                    Chi tiết
                </button>
            </div>
        ),
        ignoreRowClick: true,
    },
];

export default function VoucherTable({ data, search, statusFilter, onView }) {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = data.filter((row) => {
        const code = row.code ?? "";
        const title = row.title ?? "";
        const description = row.description ?? "";

        const matchName =
            !normalizedSearch ||
            code.toLowerCase().includes(normalizedSearch) ||
            title.toLowerCase().includes(normalizedSearch) ||
            description.toLowerCase().includes(normalizedSearch);

        let matchFilter = true;
        if (statusFilter) {
            matchFilter = matchesVoucherStatusFilter(row.status, statusFilter);
        }

        return matchName && matchFilter;
    });

    const columns = buildColumns(onView);

    return (
        <div className="w-full rounded-xl border border-neutral-200 overflow-hidden bg-white">
            <DataTable
                columns={columns}
                data={filtered}
                pagination
                paginationPerPage={10}
                paginationComponentOptions={paginationVi}
                customStyles={tableStyles}
                noDataComponent={
                    <div className="py-16 text-sm text-neutral-400 font-['Geist',sans-serif]">
                        Không tìm thấy voucher nào.
                    </div>
                }
                defaultSortFieldId={1}
                highlightOnHover
                responsive
            />
        </div>
    );
}
