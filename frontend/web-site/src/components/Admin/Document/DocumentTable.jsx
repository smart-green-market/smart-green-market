import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/tableStyles";
import { formatDateTime } from "../../common/formatDateTime";

// ── Status ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    approved:  { label: "ĐÃ DUYỆT", bg: "bg-green-200",   text: "text-green-800"  },
    rejected:  { label: "TỪ CHỐI",        bg: "bg-red-200",     text: "text-red-800"   },
    pending: { label: "CHỜ DUYỆT",        bg: "bg-amber-200",  text: "text-amber-800" },
};

// ── TYPE ─────────────────────────────────────────────────────────────
const DOCUMENT_TYPE_LABELS = {
    business_license: "Giấy phép kinh doanh",
    id_card: "CCCD / CMND",
    tax_certificate: "Giấy chứng nhận thuế",
};

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView) => [
    {
        name: "Hình ảnh",
        width: "110px",
        center: true,
        cell: (row) => (
        <img
            src={row.image}
            alt={row.id}
            className="w-12 h-12 rounded-lg border border-stone-300 object-cover"
        />
        ),
    },
    {
        name: "Loại chứng chỉ",
        selector: (row) => row.document_type,
        sortable: true,
        center:true,
        grow: 1,
        cell: (row) => (
            <span className="text-sm font-semibold font-['Geist',sans-serif]">
                {
                    DOCUMENT_TYPE_LABELS[
                        row.document_type
                    ] || row.document_type
                }
            </span>
        ),
    },
    {
        name: "Nhà cung cấp",
        selector: (row) => row.supplier?.company_name,
        sortable: true,
        center: true,
        grow: 1,
        cell: (row) => (
            <span className="text-sm font-semibold font-['Geist',sans-serif]">{row.supplier?.company_name}</span>
        ),
    },
    {
        name: "THỜI GIAN",
        selector: (row) => row.createdAt,
        sortable: true,
        center: true,
        width: '150px',
        cell: (row) => (
            <span className="font-bold text-sm font-semibold font-['Geist',sans-serif]">
                {formatDateTime(row.createdAt)}
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
                <span className={`px-2.5 py-1 rounded-full text-sm font-semibold font-['Geist',sans-serif] uppercase tracking-wide ${st.bg} ${st.text}`}>
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
          className="p-1.5 rounded-lg text-sm font-semibold font-['Geist',sans-serif] bg-blue-200 text-blue-800  hover:bg-blue-300 transition-colors cursor-pointer"
        >
          Xem chi tiết
        </button>
      </div>
    ),
    ignoreRowClick: true,
  },
];

export default function DocumentTable({ data, search, statusFilter, onView }) {
    const filtered = data.filter((row) => {
        const documentTypeLabel =
            DOCUMENT_TYPE_LABELS[
                row.document_type
            ] || row.document_type;
        // 1. Lọc theo ô tìm kiếm (Tìm text theo loại, tên cty, trạng thái)
        const matchName = documentTypeLabel.toLowerCase().includes(search.toLowerCase()) ||
                        row.supplier?.company_name.toLowerCase().includes(search.toLowerCase());

        // 2. Logic phân loại bộ lọc nút bấm
        const statusGroup = ["approved", "rejected", "pending"];
        const docTypeGroup = ["business_license", "id_card", "tax_certificate"];

        let matchFilter = true;

        if (statusFilter) {
            if (statusGroup.includes(statusFilter)) {
                // Nếu nút được bấm thuộc nhóm Trạng thái
                matchFilter = row.status === statusFilter;
            } else if (docTypeGroup.includes(statusFilter)) {
                // Nếu nút được bấm thuộc nhóm Loại chứng chỉ
                matchFilter = row.document_type === statusFilter;
            }
        }
        
        return matchName && matchFilter;
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
                        Không tìm thấy giấy tờ.
                    </div>
                }
                defaultSortFieldId={1}
                highlightOnHover
                responsive
            />
        </div>
    );
}