import { TrendingUp } from "lucide-react";
import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/TableStyles";

export default function ProductSalesHistory({ transactions }) {
  const columns = [
    {
      name: "Mã giao dịch",
      selector: (row) => row.id,
      sortable: true,
      minWidth: "120px",
      cell: (row) => <span className="font-mono text-xs font-bold text-sky-800">TX-{row.id}</span>,
    },
    {
      name: "Loại",
      selector: (row) => row.type,
      sortable: true,
      minWidth: "100px",
      cell: (row) => {
        const typeMap = {
          "sale": { label: "Bán hàng", class: "text-emerald-700 bg-emerald-50" },
          "import": { label: "Nhập kho", class: "text-blue-700 bg-blue-50" },
          "wastage": { label: "Hao hụt", class: "text-red-700 bg-red-50" },
          "adjustment": { label: "Điều chỉnh", class: "text-amber-700 bg-amber-50" }
        };
        const mapped = typeMap[row.type] || { label: row.type, class: "text-neutral-700 bg-neutral-100" };
        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mapped.class}`}>{mapped.label}</span>;
      },
    },
    {
      name: "Số lượng thay đổi",
      selector: (row) => row.quantity_change,
      sortable: true,
      minWidth: "120px",
      cell: (row) => (
        <span className={`font-bold text-xs ${row.quantity_change > 0 ? "text-emerald-600" : "text-red-600"}`}>
          {row.quantity_change > 0 ? "+" : ""}{row.quantity_change}
        </span>
      ),
    },
    {
      name: "Mã lô",
      selector: (row) => row.batch_number,
      sortable: true,
      minWidth: "100px",
      cell: (row) => <span className="text-neutral-500 font-mono text-xs">{row.batch_number}</span>,
    },
    {
      name: "Thời gian",
      selector: (row) => row.created_at,
      sortable: true,
      minWidth: "150px",
      cell: (row) => <span className="text-neutral-500 text-xs">{row.created_at ? new Date(row.created_at).toLocaleString("vi-VN") : "N/A"}</span>,
    },
    {
      name: "Người thực hiện",
      selector: (row) => row.created_by_username,
      sortable: true,
      minWidth: "120px",
      cell: (row) => <span className="text-neutral-600 text-xs font-medium">{row.created_by_username || "Hệ thống"}</span>,
    }
  ];

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl shadow-xs overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-100">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        <h2 className="text-base font-bold text-emerald-950">Lịch sử giao dịch</h2>
      </div>
      <DataTable
        columns={columns}
        data={transactions}
        pagination
        paginationPerPage={5}
        paginationRowsPerPageOptions={[5, 10]}
        paginationComponentOptions={paginationVi}
        customStyles={tableStyles}
        noDataComponent={
          <div className="py-8 text-sm text-neutral-500 text-center font-semibold">
            Không có dữ liệu giao dịch.
          </div>
        }
      />
    </div>
  );
}
