
import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/TableStyles";





export default function SupplierTable({filteredInventory, onRowClick}) {
// Định nghĩa các cột cho Bảng Nhà cung cấp
const columns = [
  {
    name: "Nhà cung cấp",
    selector: (row) => row.name,
    sortable: true,
    grow: 2,
    cell: (row) => (
      <div className="flex flex-col py-2">
        <span className="font-bold text-neutral-800">{row.name}</span>
        <span className="text-xs text-neutral-400">{row.address}</span>
      </div>
    ),
  },
  {
    name: "Liên hệ",
    selector: (row) => row.contact,
    cell: (row) => (
      <div className="flex flex-col">
        <span className="font-semibold text-neutral-700">{row.contact}</span>
        <span className="text-xs text-neutral-500">{row.phone}</span>
      </div>
    ),
  },
  {
    name: "Sản phẩm cung cấp",
    selector: (row) => row.items,
    wrap: true,
    grow: 1.5,
  },
  {
    name: "Trạng thái",
    selector: (row) => row.status,
    sortable: true,
    center: true,
    cell: (row) => (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
          row.status === "Đang hợp tác"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {row.status}
      </span>
    ),
  },
];

    
  return (
    <div className="w-full rounded-xl border border-neutral-200 overflow-hidden bg-white">
        <DataTable
          columns={columns}
          data={filteredInventory}
          pagination
          paginationPerPage={5}
          paginationComponentOptions={paginationVi}
          customStyles={tableStyles}
          noDataComponent={
            <div className="py-6 text-sm text-neutral-500 text-center">
              Không tìm thấy nhà cung cấp.
            </div>
          }
          highlightOnHover
          responsive
          pointerOnHover // Hiển thị con trỏ chuột hình bàn tay khi di chuột vào dòng
          onRowClicked={onRowClick}
        />
      </div>
  )
}
