// src/components/User/OrderTracking/OrderTrackingCard.jsx
import React from "react";
import { formatCurrency, formatDateTime, formatEstimatedDeliveryTime, getStatusCfg, canCancelBuyerOrder, canReturnBuyerOrder } from "../../../utils/orderUtils";

/**
 * =========================================================================
 * COMPONENT: OrderTrackingCard
 * =========================================================================
 * Hiển thị các thông tin QUAN TRỌNG nhất của 1 đơn hàng ở trang danh sách.
 * Dữ liệu lấy trực tiếp từ buyerOrder.getAll() — KHÔNG có items / payments /
 * status_histories (những phần này chỉ trả về ở getById, xem OrderDetailModal).
 *
 * Field dùng: order_code, status, dealer_name, item_count, total_amount,
 * delivery_date, delivery_slot_name, created_at.
 * =========================================================================
 */

const StatusBadge = ({ status }) => {
  const cfg = getStatusCfg(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

export default function OrderTrackingCard({ order, onViewDetail, onCancelOrder, onReturnOrder }) {
  const {
    id,
    order_code,
    status,
    dealer_name,
    item_count,
    total_amount,
    delivery_date,
    delivery_slot_name,
    created_at,
  } = order;

  const estimatedDeliveryTime = formatEstimatedDeliveryTime(order);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 hover:shadow-sm transition-shadow">
      {/* Mã đơn + trạng thái + ngày đặt */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-gray-400">{order_code}</span>
          <StatusBadge status={status} />
        </div>
        <span className="text-[12px] text-gray-400">{formatDateTime(created_at)}</span>
      </div>

      {/* Cửa hàng + số lượng sản phẩm */}
      <p className="text-[15px] font-medium text-gray-900 mb-1 capitalize">{dealer_name}</p>
      <p className="text-[13px] text-gray-500 mb-3">{item_count} sản phẩm</p>

      {/* Lịch giao hàng */}
      {(delivery_date || delivery_slot_name) && (
        <div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-2">
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            Giao {delivery_date ? formatDateTime(delivery_date, false) : ""}
            {delivery_slot_name ? ` • ${delivery_slot_name}` : ""}
          </span>
        </div>
      )}

      {estimatedDeliveryTime ? (
        <div className="flex items-center gap-1.5 text-[13px] text-emerald-700 mb-4">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Dự kiến giao: <span className="font-medium">{estimatedDeliveryTime}</span>
          </span>
        </div>
      ) : (
        <div className="mb-4" />
      )}

      {/* Tổng tiền + thao tác */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <span className="text-[12px] text-gray-400 mr-1.5">Tổng tiền</span>
          <span className="text-[16px] font-semibold text-emerald-700">{formatCurrency(total_amount)}</span>
        </div>
        <div className="flex items-center gap-2">
          {canCancelBuyerOrder(status) && onCancelOrder ? (
            <button
              type="button"
              onClick={() => onCancelOrder(order)}
              className="hover:scale-105 cursor-pointer px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-red-600 bg-red-50
                hover:bg-red-100 transition-colors"
            >
              Hủy đơn
            </button>
          ) : null}
          {canReturnBuyerOrder(status) && onReturnOrder ? (
            <button
              type="button"
              onClick={() => onReturnOrder(order)}
              className="hover:scale-105 cursor-pointer px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-amber-700 bg-amber-50
                hover:bg-amber-100 transition-colors"
            >
              Trả hàng
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onViewDetail(id)}
            className="hover:scale-105 cursor-pointer px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-emerald-700 bg-emerald-50
              hover:bg-emerald-100 transition-colors"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}