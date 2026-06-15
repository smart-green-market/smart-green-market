import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/tableStyles";
import { formatDateTime } from "../../common/formatDateTime";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    approved:  { label: "ĐANG HOẠT ĐỘNG", bg: "bg-green-200",   text: "text-green-800"  },
    rejected:  { label: "TỪ CHỐI",      bg: "bg-red-200",    text: "text-red-700"   },
    pending: { label: "CHỜ DUYỆT",        bg: "bg-amber-200",  text: "text-amber-800" },
};

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView) => [
    {
        id: 1,
        name: "NHÀ CUNG CẤP",
        selector: (row) => row.company_name,
        sortable: true,
        grow: 2,

        cell: (row) => (
            <span className="text-sm font-semibold font-['Geist',sans-serif]">
                {row.company_name}
            </span>
        ),
    },

    {
        name: "ĐỊA CHỈ",
        selector: (row) => row.address,
        sortable: true,
        grow: 2,

        cell: (row) => (
            <span className="text-sm font-semibold font-['Geist',sans-serif]">
                {row.address}
            </span>
        ),
    },

    {
        name: "PHONE",
        selector: (row) => row.phone,
        sortable: true,
        grow: 1,

        cell: (row) => (
            <span className="text-sm font-semibold font-['Geist',sans-serif]">
                {row.phone}
            </span>
        ),
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
        selector: (row) => row.verification_status,
        sortable: true,
        center:true,
        width: "200px",

        cell: (row) => {
            const st =
                STATUS_CONFIG[row.verification_status] ?? STATUS_CONFIG.pending;
            return (
                <span className={`px-2.5 py-1 rounded-full text-sm font-semibold font-['Geist',sans-serif] uppercase tracking-wide ${st.bg} ${st.text}`}>
                    {st.label}
                </span>
            );
        },
    },

    {
        name: "Thao tác",
        width: "150px",
        center: true,

        cell: (row) => (
            <div className="flex items-center gap-2">
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

export default function SupplierTable({ data, onView,}) {

    return (
        <div className="w-full rounded-xl border border-neutral-200 overflow-hidden">
            <DataTable
                columns={buildColumns(onView)}
                data={data}
                pagination
                paginationPerPage={10}
                paginationComponentOptions={paginationVi}
                customStyles={tableStyles}
                noDataComponent={
                    <div className="py-6 text-sm text-neutral-500">
                        Không tìm thấy nhà cung cấp.
                    </div>
                }
                defaultSortFieldId={1}
                highlightOnHover
                responsive
            />
        </div>
    );
}
