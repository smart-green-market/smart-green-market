import { MapPin, User, Phone, Calendar } from "lucide-react";

export default function DeliveryInfoForm({
  deliveryInfo,
  onInfoChange,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onInfoChange((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-xs mb-6">
      <h2 className="font-bold text-neutral-800 text-sm flex items-center gap-2 mb-4 border-b border-neutral-50 pb-3 uppercase tracking-wider">
        <span className="p-1 bg-neutral-100 rounded-md text-neutral-600">
          <MapPin className="w-4 h-4" />
        </span>
        Thông tin giao hàng
      </h2>

      <div className="space-y-4">
        {/* Người nhận */}
        <div>
          <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
            Người nhận
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="receiverName"
              value={deliveryInfo.receiverName}
              onChange={handleChange}
              placeholder="Tên người nhận"
              className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all bg-neutral-50/50 hover:bg-white"
            />
          </div>
        </div>

        {/* Số điện thoại */}
        <div>
          <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
            Số điện thoại
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="receiverPhone"
              value={deliveryInfo.receiverPhone}
              onChange={handleChange}
              placeholder="Số điện thoại"
              className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all bg-neutral-50/50 hover:bg-white"
            />
          </div>
        </div>

        {/* Địa chỉ */}
        <div>
          <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
            Địa chỉ giao hàng
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <textarea
              name="deliveryAddress"
              value={deliveryInfo.deliveryAddress}
              onChange={handleChange}
              placeholder="Địa chỉ chi tiết"
              rows={2}
              className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none bg-neutral-50/50 hover:bg-white"
            />
          </div>
        </div>

        {/* Thời gian yêu cầu */}
        <div>
          <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
            Thời gian giao dự kiến
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="datetime-local"
              name="requestedDeliveryTime"
              value={deliveryInfo.requestedDeliveryTime}
              onChange={handleChange}
              className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all bg-neutral-50/50 hover:bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
