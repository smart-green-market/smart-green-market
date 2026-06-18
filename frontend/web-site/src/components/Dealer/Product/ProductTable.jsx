import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/TableStyles";
import { Eye, Edit, Store, StoreOff } from "lucide-react";
import { dealerProductService } from "../../../services/api/dealerProductService";
import { toast } from "sonner";
import { useState } from "react";

export default function ProductTable({ data, onRowClick, onEditClick, onRefresh }) {
  const [togglingId, setTogglingId] = useState(null);

  const handleToggleStatus = async (row, e) => {
    e.stopPropagation();
    try {
      setTogglingId(row.id);
      const newStatus = row.status === "active" ? "inactive" : "active";
      await dealerProductService.toggleStatus(row.id, newStatus);
      toast.success(newStatus === "active" ? "Đã hiển thị sản phẩm trên cửa hàng" : "Đã ẩn sản phẩm khỏi cửa hàng");
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái hiển thị");
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    {
      name: "Sản phẩm",
      selector: (row) => row.title,
      sortable: true,
      minWidth: "250px",
      grow: 2,
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-neutral-200 shrink-0 bg-neutral-50 flex items-center justify-center">
            {row.thumbnail ? (
              <img src={row.thumbnail} alt={row.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-neutral-400">No img</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-neutral-800 line-clamp-1" title={row.title}>{row.title}</span>
            <span className="text-xs text-neutral-400">{row.category_name || "Chưa phân loại"}</span>
          </div>
        </div>
      ),
    },
    {
      name: "Giá bán lẻ",
      selector: (row) => row.retail_price,
      sortable: true,
      minWidth: "120px",
      grow: 1,
      cell: (row) => (
        <span className="font-bold text-emerald-700">
          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(row.retail_price)}
        </span>
      ),
    },
    {
      name: "Đã bán",
      selector: (row) => row.sold,
      sortable: true,
      minWidth: "90px",
      grow: 1,
      cell: (row) => (
        <span className="text-neutral-600 font-medium text-xs">{row.sold || 0} {row.supplier_product_unit}</span>
      ),
    },
    {
      name: "Hiển thị",
      selector: (row) => row.status,
      sortable: true,
      center: true,
      minWidth: "110px",
      grow: 1,
      cell: (row) => {
        const isActive = row.status === "active";
        return (
          <button
            onClick={(e) => handleToggleStatus(row, e)}
            disabled={togglingId === row.id}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
              isActive ? "bg-emerald-500" : "bg-neutral-300"
            } ${togglingId === row.id ? "opacity-50" : ""}`}
            title={isActive ? "Đang hiển thị trên shop" : "Đang ẩn"}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-4.5" : "translate-x-1"
              }`}
            />
          </button>
        );
      },
    },
    {
      name: "Thao tác",
      minWidth: "100px",
      center: true,
      right: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5 pr-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick && onEditClick(row);
            }}
            title="Chỉnh sửa nhanh"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRowClick && onRowClick(row);
            }}
            title="Xem chi tiết"
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
        paginationPerPage={10}
        paginationRowsPerPageOptions={[10, 20, 50]}
        paginationComponentOptions={paginationVi}
        customStyles={tableStyles}
        noDataComponent={
          <div className="py-12 text-sm text-neutral-500 text-center font-semibold">
            Không tìm thấy sản phẩm nào.
          </div>
        }
        highlightOnHover
        responsive
        onRowClicked={(row) => onRowClick && onRowClick(row)}
      />
    </div>
  );
}
