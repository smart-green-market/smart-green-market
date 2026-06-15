import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/TableStyles";
import { Eye } from "lucide-react";

export default function InventoryTable({ data, onRowClick }) {
  const columns = [
    {
      name: "Mã lô",
      selector: (row) => row.batchCode,
      sortable: true,
      width: "100px",
      cell: (row) => (
        <span className="text-emerald-800 text-xs font-bold font-mono">
          {row.batchCode}
        </span>
      ),
    },
    {
      name: "Tên nông sản",
      selector: (row) => row.productName,
      sortable: true,
      minWidth: "110px",
      grow: 1,
      cell: (row) => (
        <div className="flex flex-col py-2">
          <span className="font-bold text-neutral-800">{row.productName}</span>
          <span className="text-xs text-neutral-400">{row.category}</span>
        </div>
      ),
    },
    {
      name: "Nhà cung cấp",
      selector: (row) => row.supplier,
      sortable: true,
      minWidth: "100px",
      grow: 0.8,
      cell: (row) => (
        <span className="text-neutral-600 font-medium text-xs">{row.supplier}</span>
      ),
    },
    {
      name: "Tồn kho",
      selector: (row) => row.stock,
      sortable: true,
      width: "90px",
      cell: (row) => (
        <span className="font-bold text-neutral-800">
          {row.stock} {row.unit}
        </span>
      ),
    },
    {
      name: "Giá mua",
      selector: (row) => row.priceImport,
      sortable: true,
      width: "95px",
      cell: (row) => (
        <span className="text-neutral-500 font-medium text-xs">{row.priceImport}</span>
      ),
    },
    {
      name: "Giá bán",
      selector: (row) => row.priceRetail,
      sortable: true,
      width: "95px",
      cell: (row) => (
        <span className="font-extrabold text-emerald-700 text-xs">{row.priceRetail}</span>
      ),
    },
    {
      name: "Ngày nhập",
      selector: (row) => row.importDate,
      sortable: true,
      width: "100px",
      cell: (row) => (
        <span className="text-neutral-500 text-xs font-medium">{row.importDate}</span>
      ),
    },
    {
      name: "Hạn dùng",
      selector: (row) => row.expiryDate,
      sortable: true,
      width: "100px",
      cell: (row) => (
        <span className="text-neutral-600 text-xs font-bold">{row.expiryDate}</span>
      ),
    },

    {
      name: "Trạng thái",
      selector: (row) => row.status,
      sortable: true,
      center: true,
      width: "105px",
      cell: (row) => {
        const statusClass =
          row.status === "Còn hàng"
            ? "bg-emerald-100 text-emerald-800"
            : row.status === "Sắp hết hàng"
            ? "bg-amber-100 text-amber-800"
            : row.status === "Hết hàng"
            ? "bg-red-100 text-red-800"
            : "bg-red-200 text-red-900 border border-red-300";
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      name: "Thao tác",
      width: "90px",
      right: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5 pr-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRowClick && onRowClick(row);
            }}
            title="Chi tiết"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
    }
  ];

  return (
    <div className="w-full rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-xs">
      <DataTable
        columns={columns}
        data={data}
        pagination
        paginationPerPage={5}
        paginationRowsPerPageOptions={[5, 10, 20]}
        paginationComponentOptions={paginationVi}
        customStyles={tableStyles}
        noDataComponent={
          <div className="py-12 text-sm text-neutral-500 text-center font-semibold">
            Không tìm thấy lô hàng nào trong kho.
          </div>
        }
        highlightOnHover
        responsive
      />
    </div>
  );
}