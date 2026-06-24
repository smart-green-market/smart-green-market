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

  if (!purchaseOrders || purchaseOrders.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-neutral-100 overflow-hidden bg-white shadow-xs font-['Geist',sans-serif] py-16 text-center">
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
    );
  }

  return (
    <div className="w-full rounded-2xl border border-neutral-100 overflow-hidden bg-white shadow-xs font-['Geist',sans-serif]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200/60">
              <th className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Nhà Cung Cấp
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Thời Gian
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-right">
                Tổng Tiền
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-center">
                Trạng Thái
              </th>
              <th className="w-12 px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {purchaseOrders.map((row) => {
              const statusConfig = getStatusConfig(row.status);
              return (
                <tr
                  key={row.id}
                  onClick={() => onViewDetail && onViewDetail(row)}
                  className="hover:bg-emerald-50/30 cursor-pointer transition-colors duration-150 group"
                >
                  {/* Nhà cung cấp */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-neutral-800 leading-tight">
                        {row.supplier}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 text-[11.5px] text-neutral-400 font-medium">
                        <Package className="w-3 h-3 text-neutral-300" />
                        <span className="truncate max-w-[240px]">{row.items}</span>
                      </div>
                    </div>
                  </td>

                  {/* Thời gian */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600/70" />
                        <span>
                          <span className="text-neutral-400">Đặt:</span> {row.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium whitespace-nowrap">
                        <Truck className="w-3.5 h-3.5 text-amber-600/70" />
                        <span>
                          <span className="text-neutral-400">Giao dự kiến:</span> {row.deliveryDate}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Tổng tiền */}
                  <td className="px-6 py-4 text-right">
                    <span className="font-extrabold text-sm text-emerald-700 whitespace-nowrap">
                      {row.amount}
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex justify-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/50 shadow-xs ${statusConfig.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        <span className={`text-[11px] font-bold ${statusConfig.text} whitespace-nowrap`}>
                          {row.status}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Action button */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetail && onViewDetail(row);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer group-hover:bg-emerald-50"
                    >
                      <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-emerald-600 transition-colors" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
