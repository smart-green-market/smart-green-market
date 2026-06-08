import { Eye, Trash2 } from "lucide-react";
import { tableStyles, paginationVi } from "../../common/tableStyles";
import DataTable from "react-data-table-component";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active: { label: "ĐANG HOẠT ĐỘNG", bg: "bg-teal-800/10", text: "text-teal-800" },
  paused: { label: "TẠM NGƯNG", bg: "bg-red-700/10", text: "text-red-700" },
  pending: { label: "ĐĂNG KÝ", bg: "bg-amber-500/10", text: "text-amber-500" },
};

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView, onDelete) => [
  {
    name: "Mã lô",
    selector: (row) => row.code,
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
    width: "150px",
    grow: 2,
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {row.name}
      </span>
    ),
  },
  {
    name: "Giá bán",
    selector: (row) => row.price,
    sortable: true,
    width: "120px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {Number(row.price).toLocaleString("vi-VN")} VNĐ
      </span>
    ),
  },
  {
    name: "Tồn kho",
    selector: (row) => row.inventory,
    sortable: true,
    width: "100px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {row.inventory} {row.unit}
      </span>
    ),
  },
  {
    name: "Ngày nhập",
    selector: (row) => row.unit,
    sortable: true,
    width: "150px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {new Date(row.createdAt).toLocaleDateString("vi-VN")}
      </span>
    ),
  },
  {
    name: "Ngày hết hạn ",
    selector: (row) => row.unit,
    sortable: true,
    width: "150px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {new Date(row.createdAt).toLocaleDateString("vi-VN")}
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

export default function InventoryTable({ data, search, statusFilter, onView, onDelete }) {
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