import { Eye, Trash2 } from "lucide-react";
import { tableStyles, paginationVi } from "../../common/tableStyles";
import DataTable from "react-data-table-component";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: { 
    label: "Chờ duyệt", 
    bg: "bg-amber-100", 
    text: "text-amber-700" 
  },
  active: { 
    label: "Đang hoạt động", 
    bg: "bg-emerald-100", 
    text: "text-emerald-700" 
  },
  inactive: { 
    label: "Ngưng hoạt động", 
    bg: "bg-neutral-100", 
    text: "text-neutral-600" 
  },
  rejected: { 
    label: "Bị từ chối", 
    bg: "bg-rose-100", 
    text: "text-rose-700" 
  },
  deleted: { 
    label: "Đã xóa", 
    bg: "bg-stone-100", 
    text: "text-stone-500" 
  },
};

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView, onDelete) => [
  {
    name: "Mã sản phẩm",
    selector: (row) => row.id,
    sortable: true,
    width: "100px",
    cell: (row) => (
      <span className="text-emerald-800 text-xs font-semibold font-mono">
        {row.code}
      </span>
    ),
  },
  {
    name: "Hình ảnh",
    width: "100px",
    cell: (row) => (
      <img
        src={(row.images.find(img => img.is_thumbnail) || row.images[0])?.image_url }
        alt={row.name}
        className="w-12 h-12 rounded-lg border border-stone-300 object-cover"
      />
    ),
  },
  {
    name: "Tên sản phẩm",
    selector: (row) => row.name,
    sortable: true,
    width: "150px",
    grow: 2,
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {row.name}
      </span>
    ),
  },
  {
    name: "Loại sản phẩm",
    selector: (row) => row.price,
    sortable: true,
    width: "120px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {row.category.name}
      </span>
    ),
  },
  {
    name: "Ngày tạo",
    selector: (row) => row.created_at,
    sortable: true,
    width: "150px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {new Date(row.created_at).toLocaleDateString("vi-VN")}
      </span>
    ),
  },
  {
    name: "Đơn vị",
    selector: (row) => row.unit,
    sortable: true,
    width: "150px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {row.unit}
      </span>
    ),
  },
  {
    name: "Trạng thái",
    selector: (row) => row.status,
    sortable: true,
    width: "150px",
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
    width: "130px",
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
            Không tìm thấy sản phẩm phù hợp.
          </div>
        }
        defaultSortFieldId={1}
        highlightOnHover
        responsive
      />
    </div>
  );
}