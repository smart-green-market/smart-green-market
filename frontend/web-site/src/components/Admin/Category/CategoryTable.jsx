import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/tableStyles";
import { formatDateTime } from "../../common/formatDateTime";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    active:  { label: "HOẠT ĐỘNG", bg: "bg-green-200",   text: "text-green-800"  },
    rejected:  { label: "TỪ CHỐI",      bg: "bg-red-200",    text: "text-red-800"   },
    pending: { label: "CHỜ DUYỆT",        bg: "bg-amber-200",  text: "text-amber-800" },
    inactive: { label: "KHÓA",        bg: "bg-gray-200",  text: "text-gray-800" },
};

const SCOPE_STYLE = {
    system: {label: "HỆ THỐNG", bg: "bg-blue-200", text: "text-blue-800"},
    custom: {label: "ĐĂNG KÝ", bg: "bg-violet-200", text: "text-violet-800"},
};

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView) => [
    {
        id: 1,
        name: "Tên danh mục",
        selector: (row) => row.name,
        sortable: true,
        grow: 1,
        cell: (row) => (
            <span className="text-sm font-semibold font-['Geist',sans-serif]">
                {row.name}
            </span>
        ),
    },
    {
        name: "SỐ LƯỢNG",
        selector: (row) => row.product_count,
        sortable: true,
        center: true,
        width: "150px",
        cell: (row) => (
            <span className="text-sm font-semibold font-['Geist',sans-serif]">
                {row.product_count}
            </span>
        ),
    },    
    {
        name: "LOẠI DANH MỤC",
        selector: (row) => row.scope,
        sortable: true,
        center: true,
        grow: 1,
        cell: (row) => {
            const style = SCOPE_STYLE[row.scope] ?? SCOPE_STYLE.system;
            return (
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${style.bg} ${style.text}`}
                >
                    {style.label}
                </span>
            );
        },
    },
    {
        name: "THỜI GIAN",
        selector: (row) => row.created_at,
        sortable: true,
        center: true,
        width: '150px',
        cell: (row) => (
            <span className="font-bold text-sm font-semibold font-['Geist',sans-serif]">
                {formatDateTime(row.created_at)}
            </span>
        ),
    },
    {
        name: "Trạng thái",
        selector: (row) => row.status,
        sortable: true,
        center: true,
        grow: 1,
        cell: (row) => {
            const st = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.pending;
            return (
                <span className={`px-2.5 py-1 rounded-full font-bold text-sm font-semibold font-['Geist',sans-serif] uppercase tracking-wide ${st.bg} ${st.text}`}>
                    {st.label}
                </span>
            );
        },
    },
    {
        name: "Thao tác",
        grow: 1,
        center: true,
        cell: (row) => (
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onView(row)}
                    title="Xem chi tiết"
                    className="px-3 py-1.5 rounded-lg font-bold text-sm font-semibold font-['Geist',sans-serif] bg-blue-200 text-blue-700 hover:bg-blue-300 transition-colors cursor-pointer"
                >
                    Xem chi tiết
                </button>
            </div>
        ),
        ignoreRowClick: true,
    },
];
export default function CategoryTable({ data, search, statusFilter, onView }) {
    const filtered = data.filter((row) => {
        
        const matchName   = row.name.toLowerCase().includes(search.toLowerCase());
        const statusGroup = ["active", "rejected", "pending", "inactive"];
        const scopeGroup = ["system", "custom"];

        let matchFilter = true;

        if (statusFilter) {
            if (statusGroup.includes(statusFilter)) {
                // Nếu nút được bấm thuộc nhóm Trạng thái
                matchFilter = row.status === statusFilter;
            } else if (scopeGroup.includes(statusFilter)) {
                // Nếu nút được bấm thuộc nhóm Loại danh mục
                matchFilter = row.scope === statusFilter;
            }
        }
        
        return matchName && matchFilter;
    });

    return (
        <div className="w-full rounded-xl border border-neutral-200 overflow-hidden">
            <DataTable
                columns={buildColumns(onView)}
                data={filtered}
                pagination
                paginationPerPage={10}
                paginationComponentOptions={paginationVi}
                customStyles={tableStyles}
                noDataComponent={
                    <div className="py-6 text-sm text-neutral-500">
                        Không tìm thấy danh mục.
                    </div>
                }
                defaultSortFieldId={1}
                highlightOnHover
                responsive
            />
        </div>
    );
}