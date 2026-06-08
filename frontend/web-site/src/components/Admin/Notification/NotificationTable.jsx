import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/tableStyles";

const TYPE = {
    info: {label: "THÔNG BÁO"},
    warning: {label: "CẢNH BÁO"},
    success: {label: "THÀNH CÔNG"},
    error: {label: "THẤT BẠI"},
}
const TYPE_REF = {
    supplier_document: {label: "GIẤY TỜ"},
    supplier: {label: "NHÀ CUNG CẤP"},
    category: {label: "DANH MỤC"},
    certification: {label: "CHỨNG CHỈ"},
}
// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView) => [
    {
        name: "THÔNG BÁO",
        selector: (row) => row.type,
        sortable: true,
        width: '200px',
        cell: (row) => {
            const st = TYPE[row.type];
            return (
                <span className={`px-2.5 py-1 rounded-full font-bold text-sm font-semibold font-['Geist',sans-serif] uppercase tracking-wide ${st.bg} ${st.text}`}>
                    {st.label}
                </span>
            );
        },
    },
    {
        name: "TIÊU ĐỀ",
        selector: (row) => row.title,
        sortable: true,
        grow: 3,
        cell: (row) => (
            <span className="font-bold text-sm font-semibold font-['Geist',sans-serif]">
                {row.title}
            </span>
        ),
    },
    {
        name: "LOẠI",
        selector: (row) => row.referenceType,
        sortable: true,
        center: true,
        
        grow: 1,
        cell: (row) => {
            const st = TYPE_REF[row.referenceType];
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
      <div className="flex items-center gap-1 pr-2">
        <button
          onClick={() => onView(row)}
          title="Xem chi tiết"
          className="p-1.5 rounded-lg font-bold text-sm font-semibold font-['Geist',sans-serif] bg-blue-200 text-blue-800  hover:bg-blue-300 transition-colors cursor-pointer"
        >
          Xem chi tiết
        </button>
      </div>
    ),
    ignoreRowClick: true,
  },
];

export default function NotificationTable({ data, search, statusFilter, onView }) {
    const filtered = data.filter((row) => {
        const matchName   = row.title.toLowerCase().includes(search.toLowerCase()) ||
                            row.type.toLowerCase().includes(search.toLowerCase()) ||
                            row.referenceType.toLowerCase().includes(search.toLowerCase()) ||
                            row.status.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter ? row.status === statusFilter : true;
        
        return matchName && matchStatus;
    });

    const columns = buildColumns(onView);

    return (
        <div className="w-full rounded-xl border border-neutral-200 overflow-hidden">
            <DataTable
                columns={columns}
                data={filtered}
                pagination
                paginationPerPage={10}
                paginationComponentOptions={paginationVi}
                customStyles={tableStyles}
                noDataComponent={
                    <div className="py-16 text-sm text-neutral-400 font-['Geist',sans-serif]">
                        Không tìm thấy thông báo.
                    </div>
                }
                defaultSortFieldId={1}
                highlightOnHover
                responsive
            />
        </div>
    );
}