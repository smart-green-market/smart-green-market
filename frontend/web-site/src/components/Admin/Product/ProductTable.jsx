import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/tableStyles";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    active:  { label: "ĐANG HOẠT ĐỘNG", bg: "bg-green-200",   text: "text-green-800"  },
    paused:  { label: "TẠM NGƯNG",      bg: "bg-red-200",    text: "text-red-700"   },
    pending: { label: "CHỜ DUYỆT",        bg: "bg-amber-200",  text: "text-amber-700" },
};

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView, onDelete) => [
  {
    name: "Mã sản phẩm",
    selector: (row) => row.code,
    sortable: true,
    width: "150px",
    cell: (row) => (
      <span className="text-emerald-800 text-xs font-semibold font-mono">
        {row.code}
      </span>
    ),
  },
  {
    name: "Hình ảnh",
    width: "110px",
    center: true,
    cell: (row) => (
      <img
        src={row.image || "https://placehold.co/48x48"}
        alt={row.name}
        className="w-12 h-12 rounded-lg border border-stone-300 object-cover"
      />
    ),
  },
  {
    name: "Tên sản phẩm",
    selector: (row) => row.name,
    sortable: true,
    grow: 2,
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {row.name}
      </span>
    ),
  },
  {
    name: "Nhà cung cấp",
    selector: (row) => row.supplier,
    sortable: true,
    width: "170px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {row.supplier}
      </span>
    ),
  },
  {
    name: "Trạng thái",
        selector: (row) => row.status,
        sortable: true,
        width: "200px",
        cell: (row) => {
            const st = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.pending;
            return (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${st.bg} ${st.text}`}>
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
          className="p-1.5 rounded-lg font-bold bg-blue-200 text-blue-800  hover:bg-blue-300 transition-colors cursor-pointer"
        >
          Xem chi tiết
        </button>
        {row.status === "pending" && (
          <button
            onClick={() => onView(row)}
            title="Duyệt"
            className="p-1.5 rounded-lg font-bold bg-amber-200 text-amber-700 hover:text-amber-700 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Duyệt
          </button>
        )}
        <button
          onClick={() => onDelete(row)}
          title="Xóa"
          className="p-1.5 rounded-lg font-bold bg-red-200 text-red-800 hover:bg-red-300 transition-colors cursor-pointer"
        >
          Xóa
        </button>
      </div>
    ),
    ignoreRowClick: true,
  },
];

/**
 * ProductTable
 * Props:
 *   data         : Product[]
 *   search       : string
 *   statusFilter : string  — "" | "active" | "paused" | "pending"
 *   onView       : (row) => void
 *   onDelete     : (row) => void
 */
export default function ProductTable({ data, search, statusFilter, onView, onDelete }) {
  const filtered = data.filter((row) => {
    const matchName   = row.name.toLowerCase().includes((search ?? "").toLowerCase());
    const matchStatus = statusFilter ? row.status === statusFilter : true;
    return matchName && matchStatus;
  });

  return (
    <div className="w-full rounded-xl border border-neutral-200 overflow-hidden">
      <DataTable
        columns={buildColumns(onView, onDelete)}
        data={filtered}
        pagination
        paginationPerPage={6}
        paginationRowsPerPageOptions={[6, 12, 20]}
        paginationComponentOptions={paginationVi}
        customStyles={tableStyles}
        noDataComponent={
          <div className="py-16 text-sm text-neutral-400 font-['Geist']">
            Không tìm thấy sản phẩm.
          </div>
        }
        defaultSortFieldId={1}
        highlightOnHover
        responsive
      />
    </div>
  );
}