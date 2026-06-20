// ============================================================
// OrderCard.jsx — card đơn hàng đã hoàn thành (chi tiết hơn)
// ============================================================
// Props:
//   order: {
//     id            : string
//     status        : "completed"
//     storeName     : string
//     orderDate     : string
//     thumbnail     : string
//     items         : Array<{ name, quantity, price }>
//     totalPrice    : number
//     deliveryAddress: string
//     paymentMethod : string
//     completedDate : string
//   }
//   onViewDetail: (orderId: string) => void
// ============================================================
import React, { useState } from "react";
import StatusBadge from "./StatusBadge";

const fmt = (n) => n.toLocaleString("vi-VN") + "đ";

const OrderCard = ({ order, onViewDetail }) => {
  const {
    id, status, storeName, orderDate,
    thumbnail, items = [], totalPrice,
    deliveryAddress, paymentMethod, completedDate,
  } = order;

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

      {/* ── Phần trên: thumbnail + info chính + giá ── */}
      <div className="flex items-start gap-4 px-5 pt-5 pb-4">

        {/* Thumbnail */}
        <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
          {thumbnail
            ? <img src={thumbnail} alt={storeName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* ID + Badge */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[12px] text-gray-400 font-medium">{id}</span>
            <StatusBadge status={status} />
          </div>
          {/* Tên cửa hàng */}
          <p className="text-[15px] font-medium text-gray-900 truncate">{storeName}</p>
          {/* Ngày đặt */}
          <div className="flex items-center gap-1 mt-0.5">
            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[12px] text-gray-400">Đặt: {orderDate}</p>
          </div>
          {/* Ngày hoàn thành */}
          {completedDate && (
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="w-3 h-3 text-[#1a5c2a] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-[12px] text-[#1a5c2a]">Hoàn thành: {completedDate}</p>
            </div>
          )}
          {/* Preview sản phẩm */}
          <p className="text-[12px] text-gray-500 mt-1">
            {items.map(i => i.name).join(" • ")}
            {items.length > 0 && ` • ${items.length} sản phẩm`}
          </p>
        </div>

        {/* Giá + nút */}
        <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
          <span className="text-[20px] font-medium text-[#1a5c2a]">{fmt(totalPrice)}</span>
          {/* <button
            onClick={() => onViewDetail(id)}
            className="px-4 py-2 bg-[#1a5c2a] hover:bg-[#155223] text-white text-[13px]
              font-medium rounded-lg transition-colors duration-150 whitespace-nowrap"
          >
            Xem chi tiết
          </button> */}
        </div>

      </div>

      {/* ── Divider + toggle mở rộng ── */}
      <div className="border-t border-gray-100 mx-5" />
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-2.5
          text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span>{expanded ? "Thu gọn" : "Xem thêm thông tin"}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Phần mở rộng: danh sách sp + địa chỉ + thanh toán ── */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4">

          {/* Danh sách sản phẩm */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100">
              <p className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">Sản phẩm</p>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-[13px] text-gray-800">{item.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Số lượng: {item.quantity}</p>
                  </div>
                  <p className="text-[13px] font-medium text-gray-700">{fmt(item.price)}</p>
                </div>
              ))}
            </div>
            {/* Tổng */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-100/60 border-t border-gray-200">
              <span className="text-[12px] text-gray-500">Tổng cộng</span>
              <span className="text-[14px] font-medium text-[#1a5c2a]">{fmt(totalPrice)}</span>
            </div>
          </div>

          {/* Địa chỉ + thanh toán */}
          <div className="grid grid-cols-2 gap-3">

            {/* Địa chỉ giao hàng */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Địa chỉ giao</p>
              </div>
              <p className="text-[12px] text-gray-700 leading-relaxed">{deliveryAddress}</p>
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Thanh toán</p>
              </div>
              <p className="text-[12px] text-gray-700 leading-relaxed">{paymentMethod}</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OrderCard;