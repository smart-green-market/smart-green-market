import { supplierTableStyles, paginationVi } from "../UI/supplierTableStyles";
import { SupplierActionButton, SupplierActionGroup } from "../UI/SupplierTableActions";
import { formatDateTime } from "../../common/formatDateTime";
import DataTable from "react-data-table-component";
import { useState } from "react";

const ORDER_STATUS_CONFIG = {
  pending_supplier_confirmation: { label: "Chờ xác nhận", bg: "bg-amber-100", text: "text-amber-700" },
  rejected:                       { label: "Từ chối",        bg: "bg-red-100",     text: "text-red-700" },
  confirmed:                      { label: "Đã xác nhận",   bg: "bg-blue-100",    text: "text-blue-700" },
  deposit_pending_verification:   { label: "Chờ xác nhận cọc", bg: "bg-amber-100", text: "text-amber-700" },
  deposit_paid:                   { label: "Đã cọc",        bg: "bg-teal-100",    text: "text-teal-700" },
  processing:                     { label: "Chuẩn bị hàng", bg: "bg-indigo-100",  text: "text-indigo-700" },
  shipping:                       { label: "Đang giao",     bg: "bg-sky-100",     text: "text-sky-700" },
  delivered:                      { label: "Đã giao",       bg: "bg-emerald-100", text: "text-emerald-700" },
  final_payment_pending_verification: { label: "Chờ thanh toán cuối", bg: "bg-amber-100", text: "text-amber-700" },
  completed:                      { label: "Hoàn tất",      bg: "bg-emerald-100", text: "text-emerald-800" },
  cancelled:                      { label: "Đã hủy",        bg: "bg-neutral-100", text: "text-neutral-600" },
};

const STATUS_FILTERS = [
  { key: "all",                              label: "Tất cả" },
  { key: "pending_supplier_confirmation",    label: "Chờ xác nhận" },
  { key: "confirmed",                        label: "Đã xác nhận" },
  { key: "deposit_pending_verification",     label: "Chờ xác nhận cọc" },
  { key: "deposit_paid",                     label: "Đã cọc" },
  { key: "processing",                       label: "Chuẩn bị hàng" },
  { key: "shipping",                         label: "Đang giao" },
  { key: "delivered",                        label: "Đã giao" },
  { key: "final_payment_pending_verification", label: "Chờ TT cuối" },
  { key: "completed",                        label: "Hoàn tất" },
  { key: "cancelled", label: "Hủy / Từ chối", statuses: ["cancelled", "rejected"] },
];

function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "—";
  return `${amount.toLocaleString("vi-VN")} đ`;
}

const buildColumns = (onView) => [
  {
    name: "Mã đơn",
    selector: (row) => row.order_code,
    sortable: true,
    width: "140px",
    cell: (row) => (
      <span className="text-emerald-800 text-xs font-semibold font-mono">
        {row.order_code}
      </span>
    ),
  },
  {
    name: "Đại lý",
    selector: (row) => row.dealer_name,
    sortable: true,
    grow: 1.5,
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {row.dealer_name || "—"}
      </span>
    ),
  },
  {
    name: "Tổng tiền",
    selector: (row) => Number(row.total_amount),
    sortable: true,
    width: "140px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-semibold font-['Geist',sans-serif]">
        {formatCurrency(row.total_amount)}
      </span>
    ),
  },
  {
    name: "Ngày giao mong muốn",
    selector: (row) => row.requested_delivery_time,
    sortable: true,
    width: "170px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-['Geist',sans-serif]">
        {formatDateTime(row.requested_delivery_time)}
      </span>
    ),
  },
  {
    name: "Ngày tạo",
    selector: (row) => row.created_at,
    sortable: true,
    width: "150px",
    cell: (row) => (
      <span className="text-emerald-950 text-sm font-['Geist',sans-serif]">
        {formatDateTime(row.created_at)}
      </span>
    ),
  },
  {
    name: "Trạng thái",
    selector: (row) => row.status,
    sortable: true,
    width: "180px",
    cell: (row) => {
      const st = ORDER_STATUS_CONFIG[row.status] ?? {
        label: row.status || "Không xác định",
        bg: "bg-neutral-100",
        text: "text-neutral-600",
      };
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
      <SupplierActionGroup>
        <SupplierActionButton label="Xem" onClick={() => onView?.(row)} />
      </SupplierActionGroup>
    ),
    ignoreRowClick: true,
  },
];

export default function OrderTable({ data, search, loading, onView }) {
  const [statusFilter, setStatusFilter] = useState("all");

  const keyword = (search ?? "").trim().toLowerCase();

  const filtered = data.filter((row) => {
    const matchSearch =
      !keyword ||
      row.order_code?.toLowerCase().includes(keyword) ||
      row.dealer_name?.toLowerCase().includes(keyword);

    const activeFilter = STATUS_FILTERS.find((f) => f.key === statusFilter);
    const matchStatus =
      statusFilter === "all" ||
      (activeFilter?.statuses
        ? activeFilter.statuses.includes(row.status)
        : row.status === statusFilter);

    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-neutral-500">Trạng thái:</span>
        {STATUS_FILTERS.map(({ key, label, statuses }) => {
          const st = statuses
            ? { bg: "bg-red-100", text: "text-red-700" }
            : ORDER_STATUS_CONFIG[key];
          const isActive = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-opacity
                ${st ? `${st.bg} ${st.text} border-transparent` : "bg-neutral-100 text-neutral-600 border-transparent"}
                ${isActive ? "opacity-100" : "opacity-40 hover:opacity-70"}
              `}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 overflow-hidden">
        <DataTable
          columns={buildColumns(onView)}
          data={filtered}
          progressPending={loading}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 50]}
          paginationComponentOptions={paginationVi}
          customStyles={supplierTableStyles}
          noDataComponent={
            <div className="py-16 text-sm text-neutral-400 font-['Geist']">
              {loading ? "Đang tải đơn hàng..." : "Chưa có đơn hàng nào."}
            </div>
          }
          defaultSortFieldId={5}
          defaultSortAsc={false}
          highlightOnHover
          responsive
        />
      </div>
    </div>
  );
}