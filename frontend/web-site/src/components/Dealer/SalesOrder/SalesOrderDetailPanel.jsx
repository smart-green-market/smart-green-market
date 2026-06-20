import { X, Package, CheckCircle2, Truck, CreditCard, User, Calendar, MapPin, Receipt, ArrowRight, Printer, Phone } from "lucide-react";

export default function SalesOrderDetailPanel({ order, onClose, onPrint, onConfirm, onStartProcessing, onShipOrder }) {
  if (!order) return null;

  // Status visual mapping
  const getStatusStyle = (status) => {
    switch(status) {
      case "Chờ xác nhận": return "bg-sky-50 text-sky-700 border-sky-200/50";
      case "Đã xác nhận": return "bg-indigo-50 text-indigo-700 border-indigo-200/50";
      case "Đang chuẩn bị hàng": return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "Đang giao hàng": return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "Đã giao": return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "Đã hủy": return "bg-red-50 text-red-700 border-red-200/50";
      default: return "bg-neutral-50 text-neutral-600 border-neutral-200/50";
    }
  };

  const fullData = order.originalData || {};
  const products = fullData.items || [];
  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN').format(Number(val || 0)) + ' đ';

  return (
    <div className="bg-white border border-neutral-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden font-['Geist',sans-serif] h-full flex flex-col animate-in zoom-in-95 fade-in duration-200 relative z-10">
      
      {/* Header */}
      <div className="relative p-6 border-b border-neutral-100 bg-gradient-to-br from-emerald-50/80 via-white to-white overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl"></div>
        
        <div className="relative flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-emerald-100/50 text-emerald-700">
                <Receipt className="w-4 h-4" />
              </span>
              <p className="text-sm font-black tracking-wider text-emerald-800 uppercase">{order.id}</p>
            </div>
            <h3 className="font-extrabold text-neutral-900 text-xl tracking-tight">Chi tiết đơn hàng</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100/80 rounded-xl text-neutral-400 hover:text-neutral-600 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto overscroll-contain space-y-8 scrollbar-hide">
        
        {/* Customer & General Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Thông tin khách hàng</h4>
            <div className="h-px bg-neutral-100 flex-1"></div>
          </div>
          
          <div className="bg-white border border-neutral-100 rounded-2xl p-4 flex gap-4 items-start shadow-xs hover:border-emerald-100 transition-colors">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 pt-0.5 w-full">
              <p className="font-bold text-neutral-800 text-sm leading-tight">{order.customer}</p>
              <div className="flex flex-col gap-1.5 mt-2">
                {fullData.customer_phone && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>SĐT: <span className="text-neutral-700">{fullData.customer_phone}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Ngày đặt: <span className="text-neutral-700">{order.date}</span></span>
                </div>
                {fullData.delivery_address && (
                  <div className="flex items-start gap-1.5 text-xs text-neutral-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">Giao đến: <span className="text-neutral-700">{fullData.delivery_address}</span></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status / Progress */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Tiến trình</h4>
            <div className="h-px bg-neutral-100 flex-1"></div>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className={`px-4 py-3 rounded-2xl border flex items-center gap-3 ${getStatusStyle(order.status || order.delivery)}`}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
              <span className="text-sm font-bold tracking-wide">{order.status || order.delivery}</span>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Sản phẩm xuất bán</h4>
            </div>
            <span className="bg-neutral-100 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {products.length} Món
            </span>
          </div>

          <div className="bg-neutral-50/50 rounded-2xl border border-neutral-100 p-2">
            <ul className="divide-y divide-neutral-100/80">
              {products.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between p-3">
                  <div className="flex items-start gap-3">
                    {item.product_thumbnail_url ? (
                      <img src={item.product_thumbnail_url} alt={item.product_name} className="w-10 h-10 rounded-md object-cover border border-neutral-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-white border border-neutral-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Package className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm text-neutral-700 font-medium leading-relaxed">{item.product_name}</span>
                      <span className="text-[11px] text-neutral-500">{item.quantity} x {formatCurrency(item.unit_price)} / {item.product_unit}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-neutral-800">{formatCurrency(item.subtotal)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment & Total */}
        <div className="space-y-4 pb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Thanh toán</h4>
            <div className="h-px bg-neutral-100 flex-1"></div>
          </div>
          
          <div className="relative overflow-hidden bg-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-700/20">
            {/* Abstract Background pattern */}
            <div className="absolute -right-4 -top-12 opacity-10">
              <CreditCard className="w-40 h-40" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Phương thức</span>
                <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm max-w-[150px] text-right truncate" title={fullData.payment_method || order.payment}>
                  {fullData.payment_method || order.payment}
                </span>
              </div>
              <div className="h-px bg-emerald-600/50 w-full"></div>
              
              {Number(fullData.shipping_fee) > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-100 font-medium">Tạm tính</span>
                    <span className="font-semibold text-white">{formatCurrency(fullData.subtotal_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-100 font-medium">Phí vận chuyển</span>
                    <span className="font-semibold text-white">{formatCurrency(fullData.shipping_fee)}</span>
                  </div>
                </>
              )}
              {Number(fullData.discount_amount) > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-100 font-medium">Giảm giá</span>
                  <span className="font-semibold text-white">- {formatCurrency(fullData.discount_amount)}</span>
                </div>
              )}
              
              <div className="h-px bg-emerald-600/50 w-full"></div>
              <div className="flex justify-between items-end">
                <span className="text-emerald-100 text-sm font-medium">Tổng tiền</span>
                <span className="font-black text-2xl tracking-tight drop-shadow-sm">{formatCurrency(fullData.total_amount || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-5 border-t border-neutral-100 bg-white space-y-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.02)]">
        {order.status === "Chờ xác nhận" && (
          <button 
            onClick={() => onConfirm && onConfirm(order)}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200/50 hover:shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.98]">
            <CheckCircle2 className="w-5 h-5" /> Xác nhận đơn hàng
          </button>
        )}
        {order.status === "Đã xác nhận" && (
          <button 
            onClick={() => onStartProcessing && onStartProcessing(order)}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-200/50 hover:shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.98]">
            <Package className="w-5 h-5" /> Đang chuẩn bị hàng
          </button>
        )}
        {order.status === "Đang chuẩn bị hàng" && (
          <button 
            onClick={() => onShipOrder && onShipOrder(order)}
            className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-200/50 hover:shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.98]">
            <Truck className="w-5 h-5" /> Bắt đầu giao hàng
          </button>
        )}
        
        <button 
          onClick={() => onPrint && onPrint(order)}
          className="w-full py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" /> In hoá đơn
        </button>
      </div>
    </div>
  );
}
