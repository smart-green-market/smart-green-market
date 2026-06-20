import { canLockProduct, canUnlockProduct } from "./productSellingUtils";
import { supplierTableStyles, paginationVi } from "../UI/supplierTableStyles";
import { SupplierActionButton } from "../UI/SupplierTableActions";
import DataTable from "react-data-table-component";

const ACTION_SLOT_CLASS = "w-[92px] shrink-0 flex items-center justify-center";

function ProductActionCell({
  row,
  onView,
  onDelete,
  onLockSelling,
  onUnlockSelling,
  togglingId,
}) {
  const isToggling = togglingId === row.id;
  const showLock = canLockProduct(row.status);
  const showUnlock = canUnlockProduct(row.status);

  return (
    <div className="flex items-center gap-2 w-[292px]">
      <div className={ACTION_SLOT_CLASS}>
        <SupplierActionButton
          label="Xem"
          onClick={() => onView(row)}
          className="w-full"
        />
      </div>

      <div className={ACTION_SLOT_CLASS}>
        {showLock ? (
          <SupplierActionButton
            label="Khóa bán"
            variant="warning"
            disabled={isToggling}
            onClick={() => onLockSelling?.(row)}
            className="w-full"
          />
        ) : showUnlock ? (
          <SupplierActionButton
            label="Mở khóa"
            disabled={isToggling}
            onClick={() => onUnlockSelling?.(row)}
            className="w-full"
          />
        ) : (
          <span className="block w-full h-[30px]" aria-hidden="true" />
        )}
      </div>

      <div className={ACTION_SLOT_CLASS}>
        <SupplierActionButton
          label="Xóa"
          variant="danger"
          onClick={() => onDelete(row)}
          className="w-full"
        />
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  pending: { label: "Chờ duyệt", bg: "bg-amber-100", text: "text-amber-700" },
  active: { label: "Đang hoạt động", bg: "bg-emerald-100", text: "text-emerald-700" },
  inactive: { label: "Ngừng bán", bg: "bg-neutral-100", text: "text-neutral-600" },
  rejected: { label: "Bị từ chối", bg: "bg-rose-100", text: "text-rose-700" },
  deleted: { label: "Đã xóa", bg: "bg-stone-100", text: "text-stone-500" },
};

const buildColumns = (onView, onDelete, onLockSelling, onUnlockSelling, togglingId) => [
  {
    name: "Mã SP",
    selector: (row) => row.id,
    sortable: true,
    width: "90px",
    cell: (row) => (
      <span className="text-emerald-800 text-xs font-semibold font-mono">{row.id}</span>
    ),
  },
  {
    name: "Hình ảnh",
    width: "110px",
    cell: (row) => {
      const images = row.images || [];
      const thumbnail = row.thumbnail || images.find((img) => img.is_thumbnail)?.image_url || images[0]?.image_url;
      return thumbnail ? (
        <img
          src={thumbnail}
          alt={row.name}
          className="w-16 h-16 rounded-lg border border-stone-300 object-cover"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg border border-stone-300 bg-stone-50 flex items-center justify-center text-[10px] text-stone-400 font-medium">
          N/A
        </div>
      );
    },
  },
  {
    name: "Tên sản phẩm",
    selector: (row) => row.name,
    sortable: true,
    minWidth: "180px",
    grow: 2,
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {row.name}
      </span>
    ),
  },
  {
    name: "Loại sản phẩm",
    selector: (row) => row.category?.name,
    sortable: true,
    minWidth: "140px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-['Geist',sans-serif]">
        {row.category?.name ?? "—"}
      </span>
    ),
  },
  // {
  //   name: "Ngày tạo",
  //   selector: (row) => row.created_at,
  //   sortable: true,
  //   width: "110px",
  //   cell: (row) => (
  //     <span className="text-emerald-950 text-sm font-['Geist',sans-serif]">
  //       {new Date(row.created_at).toLocaleDateString("vi-VN")}
  //     </span>
  //   ),
  // },
  {
    name: "Năng suất",
    selector: (row) => row.daily_production_capacity,
    sortable: true,
    width: "120px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-['Geist',sans-serif]">
        {row.daily_production_capacity != null && row.daily_production_capacity !== ""
          ? `${row.daily_production_capacity} kg/tháng`
          : "—"}
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
    width: "310px",
    center: true,
    cell: (row) => (
      <ProductActionCell
        row={row}
        onView={onView}
        onDelete={onDelete}
        onLockSelling={onLockSelling}
        onUnlockSelling={onUnlockSelling}
        togglingId={togglingId}
      />
    ),
    ignoreRowClick: true,
  },
];

export default function ProductTable({
  data,
  search,
  statusFilter,
  onView,
  onDelete,
  onLockSelling,
  onUnlockSelling,
  togglingId,
}) {
  const filtered = data.filter((row) => {
    const matchName = row.name.toLowerCase().includes((search ?? "").toLowerCase());
    const matchStatus = statusFilter ? row.status === statusFilter : true;
    return matchName && matchStatus;
  });

  return (
    <div className="w-full rounded-xl border border-neutral-200 overflow-hidden">
      <DataTable
        columns={buildColumns(onView, onDelete, onLockSelling, onUnlockSelling, togglingId)}
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
