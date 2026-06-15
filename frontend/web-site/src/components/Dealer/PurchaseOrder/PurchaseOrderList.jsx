import { Calendar } from "lucide-react";

export default function PurchaseOrderList({ purchaseOrders, onViewDetail }) {
  if (purchaseOrders.length === 0) {
    return (
      <div className="py-16 bg-white border border-neutral-100 rounded-2xl text-center text-sm font-semibold text-neutral-400 font-['Geist',sans-serif]">
        Không tìm thấy đơn nhập hàng nào.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {purchaseOrders.map((order, idx) => (
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
                <h4 className="text-xs font-bold text-neutral-800">{order.supplier}</h4>
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
                  Tổng tiền nhập
                </p>
                <p className="text-sm font-black text-emerald-700">{order.amount}</p>
              </div>
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  order.status === "Đã hoàn thành"
                    ? "bg-emerald-100 text-emerald-800"
                    : order.status === "Chờ giao hàng"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* Order details and delivery */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs text-neutral-500">
            <div>
              <span className="font-bold text-neutral-700">Chi tiết sản phẩm: </span>
              <span className="font-medium">{order.items}</span>
            </div>
            <div className="shrink-0">
              <span className="font-semibold text-neutral-400">Ngày giao hàng: </span>
              <span className="font-bold text-neutral-700">{order.deliveryDate}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
