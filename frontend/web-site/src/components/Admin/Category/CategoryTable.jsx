import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/tableStyles";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    active:  { label: "ĐANG HOẠT ĐỘNG", bg: "bg-green-200",   text: "text-green-800"  },
    rejected:  { label: "TẠM NGƯNG",      bg: "bg-red-200",    text: "text-red-700"   },
    pending: { label: "CHỜ DUYỆT",        bg: "bg-amber-200",  text: "text-amber-800" },
    inactive: { label: "KHÓA",        bg: "bg-blue-200",  text: "text-blue-800" },
};

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView) => [
    {
        id: 1,
        name: "Tên danh mục",
        selector: (row) => row.name,
        sortable: true,
        grow: 2,
        cell: (row) => (
            <span className="font-bold text-sm font-semibold font-['Geist',sans-serif]">
                {row.name}
            </span>
        ),
    },
    {
        name: "Trạng thái",
        selector: (row) => row.status,
        sortable: true,
        center: true,
        grow: 2,
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
        width: "250px",
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
        const matchStatus = statusFilter ? row.status === statusFilter : true;
        return matchName && matchStatus;
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