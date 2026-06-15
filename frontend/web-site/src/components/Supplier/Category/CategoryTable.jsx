import { Eye, Trash2 } from "lucide-react";
import { tableStyles, paginationVi } from "../../common/tableStyles";
import DataTable from "react-data-table-component";

const STATUS_CONFIG = {
  active:  { label: "Hoạt động",    bg: "bg-emerald-100", text: "text-emerald-700" },
  pending: { label: "Chờ duyệt",    bg: "bg-yellow-100",  text: "text-yellow-700" },
  rejected:{ label: "Từ chối",      bg: "bg-red-100",     text: "text-red-600"    },
};

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView, onDelete) => [
  {
    name: "ID",
    selector: (row) => row.id,
    sortable: true,
    width: "70px",
    cell: (row) => (
      <span className="text-emerald-800 text-xs font-semibold font-mono">
        {row.id}
      </span>
    ),
  },
  {
    name: "Tên danh mục",
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
    name: "Mô tả",
    selector: (row) => row.description,
    grow: 3,
    cell: (row) => (
      <span className="text-zinc-500 text-sm font-['Geist',sans-serif] line-clamp-2">
        {row.description || "—"}
      </span>
    ),
  },
  {
    name: "Thứ tự",
    selector: (row) => row.sort_order,
    sortable: true,
    width: "100px",
    center: true,
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {row.sort_order}
      </span>
    ),
  },
  {
    name: "Xác minh bởi",
    selector: (row) => row.verified_by_username,
    sortable: true,
    width: "140px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-['Geist',sans-serif]">
        {row.verified_by_username ? `${row.verified_by_username}` : "—"}
      </span>
    ),
  },
  {
    name: "Ngày tạo",
    selector: (row) => row.created_at,
    sortable: true,
    width: "130px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-['Geist',sans-serif]">
        {new Date(row.created_at).toLocaleDateString("vi-VN")}
      </span>
    ),
  },
  {
    name: "Trạng thái",
    selector: (row) => row.status,
    sortable: true,
    width: "130px",
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
    width: "100px",
    right: true,
    cell: (row) => (
      <div className="flex items-center gap-1 pr-2">
        <button
          onClick={() => onView(row)}
          title="Xem chi tiết"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(row)}
          title="Xóa"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
    ignoreRowClick: true,
  },
];

/**
 * CategoryTable
 * Props:
 *   data         : Category[]
 *   search       : string
 *   statusFilter : string  — "" | "active" | "pending" | "rejected"
 *   onView       : (row) => void
 *   onDelete     : (row) => void
 */
export default function CategoryTable({ data, search, statusFilter, onView, onDelete }) {
  const filtered = data.filter((row) => {
    const matchName = row.name.toLowerCase().includes((search ?? "").toLowerCase());
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
            Không tìm thấy danh mục phù hợp.
          </div>
        }
        defaultSortFieldId={1}
        highlightOnHover
        responsive
      />
    </div>
  );
}