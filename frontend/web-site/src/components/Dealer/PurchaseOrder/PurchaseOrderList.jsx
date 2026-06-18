import DataTable from "react-data-table-component";
import { tableStyles } from "../../common/TableStyles";
import { Calendar, Package, ChevronRight, AlertCircle, CheckCircle2, Clock, Truck } from "lucide-react";

export default function PurchaseOrderList({ purchaseOrders, onViewDetail }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case "Đã hoàn thành":
        return { bg: "bg-emerald-50", text: "text-emerald-700", icon: <CheckCircle2 className="w-3.5 h-3.5" />, dot: "bg-emerald-500" };
      case "Đã xác nhận":
      case "Chờ giao hàng":
      case "Đang giao hàng":
      case "Đang xử lý":
        return { bg: "bg-blue-50", text: "text-blue-700", icon: <Truck className="w-3.5 h-3.5" />, dot: "bg-blue-500 animate-pulse" };
      case "Chờ xác nhận":
      case "Chờ duyệt cọc":
      case "Chờ duyệt thanh toán":
      case "Chờ xác nhận thanh toán cuối":
        return { bg: "bg-amber-50", text: "text-amber-700", icon: <Clock className="w-3.5 h-3.5" />, dot: "bg-amber-500" };
      case "Đã hủy":
      case "Đã từ chối":
        return { bg: "bg-rose-50", text: "text-rose-700", icon: <AlertCircle className="w-3.5 h-3.5" />, dot: "bg-rose-500" };
      default:
        return { bg: "bg-neutral-50", text: "text-neutral-700", icon: <Clock className="w-3.5 h-3.5" />, dot: "bg-neutral-500" };
    }
  };

  const columns = [
    {
      name: "Mã Đơn",
      selector: (row) => row.id,
      sortable: true,
      width: "140px",
      cell: (row) => (
        <span
          onClick={() => onViewDetail && onViewDetail(row)}
          className="text-xs font-extrabold text-emerald-800 hover:text-emerald-950 cursor-pointer hover:underline underline-offset-2 transition-colors uppercase tracking-wider"
        >
          {row.id}
        </span>
      ),
    },
    {
      name: "Nhà Cung Cấp",
      selector: (row) => row.supplier,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="flex flex-col py-2">
          <span className="font-bold text-sm text-neutral-800 leading-tight">
            {row.supplier}
          </span>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400 font-medium">
            <Package className="w-3 h-3 text-neutral-300" />
            <span className="truncate max-w-[200px]">{row.items}</span>
          </div>
        </div>
      ),
    },
    {
      name: "Thời Gian",
      selector: (row) => row.date,
      sortable: true,
      width: "220px",
      cell: (row) => (
        <div className="flex flex-col gap-1.5 py-2">
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-emerald-600/70" />
            <span><span className="text-neutral-400">Đặt:</span> {row.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium whitespace-nowrap">
            <Truck className="w-3.5 h-3.5 text-amber-600/70" />
            <span><span className="text-neutral-400">Giao dự kiến:</span> {row.deliveryDate}</span>
          </div>
        </div>
      ),
    },
    {
      name: "Tổng Tiền",
      selector: (row) => row.amount,
      sortable: true,
      right: true,
      cell: (row) => (
        <span className="font-extrabold text-sm text-emerald-700 whitespace-nowrap">
          {row.amount}
        </span>
      ),
    },
    {
      name: "Trạng Thái",
      selector: (row) => row.status,
      sortable: true,
      center: true,
      width: "200px",
      cell: (row) => {
        const config = getStatusConfig(row.status);
        return (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/50 shadow-sm ${config.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            <span className={`text-[11px] font-bold ${config.text} whitespace-nowrap`}>
              {row.status}
            </span>
          </div>
        );
      },
    },
    {
      name: "",
      width: "50px",
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail && onViewDetail(row);
          }}
          className="w-8 h-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer group"
        >
          <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-emerald-600 transition-colors" />
        </button>
      ),
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-neutral-100 overflow-hidden bg-white shadow-xs font-['Geist',sans-serif]">
      <DataTable
        columns={columns}
        data={purchaseOrders}
        customStyles={{
          ...tableStyles,
          headRow: {
            style: {
              ...tableStyles?.headRow?.style,
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #f3f4f6",
              minHeight: "48px",
            },
          },
          headCells: {
            style: {
              ...tableStyles?.headCells?.style,
              fontSize: "11px",
              fontWeight: "700",
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              paddingLeft: "16px",
              paddingRight: "16px",
            },
          },
          rows: {
            style: {
              ...tableStyles?.rows?.style,
              minHeight: "72px",
              borderBottom: "1px solid #f9fafb",
              "&:hover": {
                backgroundColor: "#f0fdf4",
                cursor: "pointer",
              },
              transition: "background-color 0.15s ease",
            },
          },
          cells: {
            style: {
              ...tableStyles?.cells?.style,
              paddingLeft: "16px",
              paddingRight: "16px",
            },
          },
        }}
        noDataComponent={
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center mx-auto mb-4 border border-neutral-100">
              <Package className="w-7 h-7 text-neutral-300" />
            </div>
            <p className="text-sm text-neutral-500 font-bold mb-1">
              Không tìm thấy đơn nhập hàng nào.
            </p>
            <p className="text-xs text-neutral-400 font-medium">
              Thử thay đổi bộ lọc hoặc tạo đơn mới.
            </p>
          </div>
        }
        highlightOnHover
        responsive
        pointerOnHover
        onRowClicked={onViewDetail}
      />
    </div>
  );
}
