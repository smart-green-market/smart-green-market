import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/TableStyles";
import { ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";
import { History } from "lucide-react";
export default function InventoryHistoryTable({ data }) {
  const columns = [
    {
      name: "Mã GD",
      selector: (row) => row.id,
      sortable: true,
      width: "110px",
      cell: (row) => (
        <span className="text-neutral-700 text-xs font-bold font-mono">
          {row.id}
        </span>
      ),
    },
    {
      name: "Loại giao dịch",
      selector: (row) => row.type,
      sortable: true,
      width: "140px",
      cell: (row) => {
        const isImport = row.isImport;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isImport
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-amber-50 text-amber-700 border border-amber-100"
            }`}
          >
            {isImport ? (
              <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            )}
            {row.type}
          </span>
        );
      },
    },
    {
      name: "Thông tin lô hàng",
      selector: (row) => row.batchCode,
      sortable: true,
      grow: 1.5,
      cell: (row) => (
        <div className="flex flex-col py-1.5">
          <span className="font-bold text-neutral-800 text-xs">
            {row.productName}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            Mã lô: {row.batchCode}
          </span>
        </div>
      ),
    },
    {
      name: "Số lượng",
      selector: (row) => row.quantity,
      sortable: true,
      width: "110px",
      cell: (row) => {
        const isImport = row.isImport;
        return (
          <span
            className={`font-bold text-xs ${isImport ? "text-emerald-700" : "text-amber-750"}`}
          >
            {isImport ? "+" : "-"}
            {row.quantity} {row.unit}
          </span>
        );
      },
    },
    {
      name: "Thời gian",
      selector: (row) => row.date,
      sortable: true,
      width: "150px",
      cell: (row) => (
        <span className="text-neutral-500 text-xs font-medium flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" /> {row.date}
        </span>
      ),
    },
    {
      name: "Người thực hiện",
      selector: (row) => row.performer,
      sortable: true,
      width: "150px",
      cell: (row) => (
        <span className="text-neutral-600 font-semibold text-xs">
          {row.performer}
        </span>
      ),
    },
    {
      name: "Ghi chú",
      selector: (row) => row.note,
      sortable: true,
      grow: 1.5,
      cell: (row) => (
        <span className="text-neutral-500 text-xs">{row.note}</span>
      ),
    },
  ];

  return (
    <>
      <div className="mt-10 mb-4">
        <h2 className="text-lg font-extrabold text-emerald-950 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-600" /> Nhật Ký Nhập Xuất Kho
        </h2>
        <p className="text-xs text-emerald-800/70 mt-1">
          Nhật ký chi tiết về các hoạt động nhập và xuất nông sản của đại lý.
        </p>
      </div>
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
              Chưa có giao dịch nhập xuất nào được thực hiện.
            </div>
          }
          highlightOnHover
          responsive
        />
      </div>
    </>
  );
}
