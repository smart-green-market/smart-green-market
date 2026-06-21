import {Truck, User, Clock, Phone, Mail, Hash, MapPin } from "lucide-react";

export default function OrderDetailInfoCards({ orderData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      

      {/* Thẻ thông tin Nhà cung cấp (Người bán) */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-xs flex flex-col justify-between">
        <div>
          <h2 className="font-bold text-neutral-800 text-xs flex items-center gap-2 mb-5 uppercase tracking-wider">
            <Truck className="w-4 h-4 text-neutral-800" /> THÔNG TIN NHÀ CUNG CẤP
          </h2>
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-sm gap-1">
              <span className="text-neutral-600 font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <User className="w-3.5 h-3.5 text-blue-500" /> Tên:
              </span>
              <span className="font-bold text-neutral-800">
                {orderData.supplier?.name}
              </span>
            </div>
            <div className="flex items-center text-sm gap-1">
              <span className="text-neutral-600 font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <Hash className="w-3.5 h-3.5 text-amber-500" /> Mã:
              </span>
              <span className="font-bold text-neutral-800">
                {orderData.supplier?.code}
              </span>
            </div>
            <div className="flex items-center text-sm gap-1">
              <span className="text-neutral-600 font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <Phone className="w-3.5 h-3.5 text-emerald-500" /> SĐT:
              </span>
              <span className="font-bold text-neutral-800">
                {orderData.supplier?.phone}
              </span>
            </div>
            <div className="flex items-center text-sm gap-1">
              <span className="text-neutral-600 font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <Mail className="w-3.5 h-3.5 text-indigo-500" /> Email:
              </span>
              <span className="font-bold text-neutral-800">
                {orderData.supplier?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Thẻ thông tin Giao hàng */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-xs flex flex-col justify-between">
        <div>
          <h2 className="font-bold text-neutral-800 text-xs flex items-center gap-2 mb-5 uppercase tracking-wider">
            <User className="w-4 h-4 text-neutral-800" /> THÔNG TIN GIAO HÀNG
          </h2>
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-sm gap-1">
              <span className="text-neutral-600 font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <User className="w-3.5 h-3.5 text-blue-500" /> Người nhận:
              </span>
              <span className="font-bold text-neutral-800">
                {orderData.delivery?.recipient}
              </span>
            </div>
            <div className="flex items-center text-sm gap-1">
              <span className="text-neutral-600 font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <Phone className="w-3.5 h-3.5 text-emerald-500" /> SĐT:
              </span>
              <span className="font-bold text-neutral-800">
                {orderData.delivery?.phone}
              </span>
            </div>
            <div className="flex items-center text-sm gap-1">
              <span className="text-neutral-600 font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <MapPin className="w-3.5 h-3.5 text-red-500" /> Địa chỉ:
              </span>
              <span className="font-bold text-neutral-800 break-words leading-tight">
                {orderData.delivery?.address}
              </span>
            </div>
            <div className="flex items-center text-sm gap-1">
              <span className="text-neutral-600 font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Ngày giao:
              </span>
              <span className="font-bold text-neutral-800">
                {orderData.delivery?.slot}
              </span>
            </div>
          </div>
        </div>
      </div>  
    </div>
  );
}
