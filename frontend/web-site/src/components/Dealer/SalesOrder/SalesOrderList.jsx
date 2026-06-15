import { Calendar } from "lucide-react";

export default function SalesOrderList({ salesOrders, onViewDetail }) {
  if (salesOrders.length === 0) {
    return (
      <div className="py-16 bg-white border border-neutral-100 rounded-2xl text-center text-sm font-semibold text-neutral-400 font-['Geist',sans-serif]">
        Không tìm thấy đơn bán hàng nào.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {salesOrders.map((order, idx) => (
        <div
          key={idx}
          onClick={() => onViewDetail && onViewDetail(order)}
          className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-neutral-50">
            {/* Left Meta info */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50">
                {order.id}
              </span>
              <div>
                <h4 className="text-xs font-bold text-neutral-800">{order.customer}</h4>
                <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>Ngày đặt: {order.date}</span>
                </div>
              </div>
            </div>

            {/* Right Status / Price */}
            <div className="flex items-center gap-4 self-end md:self-auto">
              <div className="text-right">
                <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                  Tổng đơn bán
                </p>
                <p className="text-sm font-black text-emerald-700">{order.amount}</p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                    order.payment === "Đã thanh toán"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : order.payment === "Chưa thanh toán"
                      ? "bg-amber-50 text-amber-700 border border-amber-100"
                      : "bg-neutral-50 text-neutral-400 border border-neutral-100"
                  }`}
                >
                  {order.payment}
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                    order.delivery === "Đã giao"
                      ? "bg-emerald-100 text-emerald-800"
                      : order.delivery === "Đang giao hàng"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {order.delivery}
                </span>
              </div>
            </div>
          </div>

          {/* Order details and delivery */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs text-neutral-500">
            <div>
              <span className="font-bold text-neutral-700">Sản phẩm xuất bán: </span>
              <span className="font-medium text-neutral-600">{order.items}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
