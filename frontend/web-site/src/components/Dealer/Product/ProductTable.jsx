import DataTable from "react-data-table-component";
import { tableStyles, paginationVi } from "../../common/TableStyles";
import { Eye } from "lucide-react";

const STATUS_MAP = {
  active: { label: "Đang bán", cls: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Chờ duyệt", cls: "bg-amber-50 text-amber-700" },
  inactive: { label: "Ngừng bán", cls: "bg-neutral-100 text-neutral-500" },
  rejected: { label: "Từ chối", cls: "bg-red-50 text-red-600" },
};

export default function ProductTable({ data, onRowClick }) {
  const columns = [
    {
      name: "Sản phẩm",
      selector: (row) => row.title,
      sortable: true,
      minWidth: "250px",
      grow: 2,
      cell: (row) => {
        const images = row.images || [];
        const thumbnail = row.thumbnail || images.find(img => img.is_thumbnail)?.image_url || images[0]?.image_url;

        return (
          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-neutral-200 shrink-0 bg-neutral-50 flex items-center justify-center">
              {thumbnail ? (
                <img src={thumbnail} alt={row.title} className="w-full h-full object-cover" />
              ) : (
                <div className="text-[10px] text-neutral-400 font-medium">N/A</div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-neutral-800 line-clamp-1" title={row.title}>{row.title}</span>
              <span className="text-xs text-neutral-400">{row.category?.name || "Chưa phân loại"}</span>
            </div>
          </div>
        );
      },
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
      name: "Trạng thái",
      selector: (row) => row.status,
      sortable: true,
      center: true,
      minWidth: "120px",
      grow: 1,
      cell: (row) => {
        const info = STATUS_MAP[row.status] || { label: row.status, cls: "bg-neutral-100 text-neutral-500" };
        return (
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${info.cls}`}>
            {info.label}
          </span>
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
