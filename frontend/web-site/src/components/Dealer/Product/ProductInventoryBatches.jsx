import { PackageCheck } from "lucide-react";
import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/TableStyles";

export default function ProductInventoryBatches({ batches }) {
  const columns = [
    {
      name: "Mã lô",
      selector: (row) => row.batch_number,
      sortable: true,
      minWidth: "100px",
      cell: (row) => <span className="font-mono text-xs font-bold text-emerald-800">{row.batch_number}</span>,
    },
    {
      name: "Tồn kho",
      selector: (row) => row.remaining_quantity,
      sortable: true,
      minWidth: "100px",
      cell: (row) => <span className="font-bold text-neutral-800">{row.remaining_quantity} {row.supplier_product_unit || "kg"}</span>,
    },
    {
      name: "Giá nhập",
      selector: (row) => row.import_price,
      sortable: true,
      minWidth: "110px",
      cell: (row) => <span className="text-neutral-500 text-xs">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(row.import_price)}</span>,
    },
    {
      name: "Ngày nhập",
      selector: (row) => row.import_date,
      sortable: true,
      minWidth: "110px",
      cell: (row) => <span className="text-neutral-500 text-xs">{row.import_date ? new Date(row.import_date).toLocaleDateString("vi-VN") : "N/A"}</span>,
    },
    {
      name: "Hạn dùng",
      selector: (row) => row.expiry_date,
      sortable: true,
      minWidth: "110px",
      cell: (row) => <span className="text-neutral-600 font-bold text-xs">{row.expiry_date ? new Date(row.expiry_date).toLocaleDateString("vi-VN") : "N/A"}</span>,
    },
    {
      name: "Trạng thái",
      selector: (row) => row.remaining_quantity,
      sortable: true,
      minWidth: "100px",
      cell: (row) => {
        const isOutOfStock = row.remaining_quantity <= 0;
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isOutOfStock ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
            {isOutOfStock ? "Hết hàng" : "Còn hàng"}
          </span>
        );
      },
    }
  ];

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl shadow-xs overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-100">
        <PackageCheck className="w-5 h-5 text-emerald-600" />
        <h2 className="text-base font-bold text-emerald-950">Lô hàng liên quan</h2>
      </div>
      <DataTable
        columns={columns}
        data={batches}
        pagination
        paginationPerPage={5}
        paginationRowsPerPageOptions={[5, 10]}
        paginationComponentOptions={paginationVi}
        customStyles={tableStyles}
        noDataComponent={
          <div className="py-8 text-sm text-neutral-500 text-center font-semibold">
            Không có dữ liệu lô hàng.
          </div>
        }
      />
    </div>
  );
}
