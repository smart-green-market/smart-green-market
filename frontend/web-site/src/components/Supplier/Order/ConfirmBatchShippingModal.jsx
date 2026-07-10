import { Truck, X, AlertTriangle } from "lucide-react";

export default function ConfirmBatchShippingModal({ isOpen, onClose, onConfirm, selectedOrders, loading }) {
  if (!isOpen) return null;

  const formatPrice = (value) => {
    const amount = Number(value);
    if (Number.isNaN(amount)) return "—";
    return `${amount.toLocaleString("vi-VN")} đ`;
  };

  // Làm phẳng dữ liệu đơn hàng và sản phẩm tương tự như Excel
  const tableRows = [];
  selectedOrders.forEach((order, orderIndex) => {
    const items = order.items && order.items.length > 0 ? order.items : [null];
    items.forEach((item, index) => {
      tableRows.push({
        order,
        item,
        isFirst: index === 0,
        rowCount: items.length,
        orderIndex // Lưu vị trí của đơn hàng để đổi màu xen kẽ theo đơn hàng
      });
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Truck size={18} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Xác nhận giao hàng loạt</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <div className="text-xs">
              <p className="font-semibold mb-0.5">Lưu ý trước khi thực hiện:</p>
              <p>Hệ thống sẽ chuyển trạng thái của <strong>{selectedOrders.length} đơn hàng</strong> dưới đây sang <strong>Đang giao hàng</strong> và gửi thông báo cho đại lý tương ứng.</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
              Chi tiết đơn hàng chọn giao ({selectedOrders.length} đơn hàng)
            </h4>
            
            {/* Table Container */}
            <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[45vh]">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase border-b border-neutral-200">
                      <th className="px-4 py-2.5 border-r border-neutral-200">Mã đơn hàng</th>
                      <th className="px-4 py-2.5 border-r border-neutral-200">Đại lý</th>
                      <th className="px-4 py-2.5 border-r border-neutral-200">Sản phẩm</th>
                      <th className="px-4 py-2.5 text-center border-r border-neutral-200">Số lượng</th>
                      <th className="px-4 py-2.5 text-right">Tổng tiền</th>
                    </tr>
                  </thead>
                  {/* Loại bỏ divide-y để không có viền ngăn cách giữa các dòng mặc định */}
                  <tbody className="text-xs">
                    {tableRows.map((rowInfo, idx) => {
                      const { order, item, isFirst, orderIndex } = rowInfo;
                      // Đổi màu dòng trắng và xanh lam nhạt xen kẽ theo TỪNG ĐƠN HÀNG (đồng màu với nút Giao hàng)
                      const rowBg = orderIndex % 2 === 0 ? "bg-white" : "bg-blue-50/40";
                      
                      return (
                        <tr 
                          key={`${order.id}-${idx}`} 
                          className={`hover:bg-neutral-50/50 transition-colors ${rowBg} ${
                            isFirst && idx !== 0 ? "border-t border-neutral-200" : ""
                          }`}
                        >
                          {/* Mã đơn hàng (Chỉ hiển thị dòng đầu tiên của đơn đó) */}
                          <td className="px-4 py-2.5 font-semibold text-gray-900 border-r border-neutral-200">
                            {isFirst ? order.order_code : ""}
                          </td>
                          {/* Đại lý (Chỉ hiển thị dòng đầu tiên của đơn đó) */}
                          <td className="px-4 py-2.5 text-neutral-600 truncate max-w-[180px] border-r border-neutral-200">
                            {isFirst ? (order.dealer_name || "—") : ""}
                          </td>

                          {/* Chi tiết sản phẩm */}
                          <td className="px-4 py-2.5 text-gray-700 font-medium border-r border-neutral-200">
                            {item ? item.product_name : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-center text-gray-900 font-semibold border-r border-neutral-200">
                            {item ? `${Number(item.quantity).toLocaleString("vi-VN")} ${item.product_unit || "kg"}` : "—"}
                          </td>

                          {/* Tổng tiền đơn hàng (Chỉ hiển thị dòng đầu tiên của đơn đó) */}
                          <td className="px-4 py-2.5 text-right font-extrabold text-gray-900">
                            {isFirst ? formatPrice(order.total_amount) : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-end gap-3 bg-neutral-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 transition-all cursor-pointer"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || selectedOrders.length === 0}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-blue-100 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Truck size={14} />
                Xác nhận giao hàng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
