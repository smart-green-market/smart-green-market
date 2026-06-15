import { supplierTableStyles, paginationVi } from "../UI/supplierTableStyles";
import { SupplierActionButton, SupplierActionGroup } from "../UI/SupplierTableActions";
import DataTable from "react-data-table-component";

const STATUS_CONFIG = {
  active: { label: "ĐANG HOẠT ĐỘNG", bg: "bg-teal-800/10", text: "text-teal-800" },
  paused: { label: "TẠM NGƯNG", bg: "bg-red-700/10", text: "text-red-700" },
  pending: { label: "ĐĂNG KÝ", bg: "bg-amber-500/10", text: "text-amber-500" },
};

const buildColumns = (onView, onDelete) => [
  {
    name: "Mã lô",
    selector: (row) => row.code,
    sortable: true,
    width: "100px",
    cell: (row) => (
      <span className="text-emerald-800 text-xs font-semibold font-mono">{row.code}</span>
    ),
  },
  {
    name: "Hình ảnh",
    width: "100px",
    cell: (row) => (
      <img
        src={row.image || "https://placehold.co/48x48"}
        alt={row.name}
        className="w-14 h-14 rounded-lg border border-stone-300 object-cover"
      />
    ),
  },
  {
    name: "Tên sản phẩm",
    selector: (row) => row.name,
    sortable: true,
    minWidth: "160px",
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
    selector: (row) => row.createdAt,
    sortable: true,
    width: "120px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-['Geist',sans-serif]">
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString("vi-VN") : "—"}
      </span>
    ),
  },
  {
    name: "Ngày hết hạn",
    selector: (row) => row.expiryAt,
    sortable: true,
    width: "120px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-['Geist',sans-serif]">
        {row.expiryAt ? new Date(row.expiryAt).toLocaleDateString("vi-VN") : "—"}
      </span>
    ),
  },
  {
    name: "Trạng thái",
    selector: (row) => row.status,
    sortable: true,
    width: "140px",
    cell: (row) => {
      const st = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.pending;
      return (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${st.bg} ${st.text}`}
        >
          {st.label}
        </span>
      );
    },
  },
  {
    name: "Thao tác",
    minWidth: "160px",
    right: true,
    cell: (row) => (
      <SupplierActionGroup>
        <SupplierActionButton label="Xem" onClick={() => onView(row)} />
        <SupplierActionButton label="Xóa" variant="danger" onClick={() => onDelete(row)} />
      </SupplierActionGroup>
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
        customStyles={supplierTableStyles}
        noDataComponent={
          <div className="py-16 text-sm text-neutral-400 font-['Geist']">
            Không tìm thấy sản phẩm phù hợp.
          </div>
        }
        highlightOnHover
        responsive
      />
    </div>
  );
}
