// src/components/User/OrderTracking/OrderTrackingCard.jsx
import React from "react";
import { formatCurrency, formatDateTime, formatEstimatedDeliveryTime, getStatusCfg, canCancelBuyerOrder, canReturnBuyerOrder } from "../../../utils/orderUtils";
import { Copy, Calendar, Store, Clock, Check, ClipboardList, Truck, Package, ChevronRight } from "lucide-react";
import { appToast } from "../../../components/common/toast";

const StatusBadge = ({ status }) => {
  const cfg = getStatusCfg(status);
  // Match the image style: thin outline and small text, or pill badge
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium border bg-opacity-10 bg-white ${cfg.text} ${cfg.border || 'border-current'}`}>
      <span className="mr-1 mt-0.5">
        {status === 'delivered' || status === 'completed' ? (
          <Check size={12} />
        ) : (
          <Clock size={12} />
        )}
      </span>
      {cfg.label}
    </span>
  );
};

const STEPS = [
  { key: "pending", label: "Đặt hàng", Icon: Check },
  { key: "processing", label: "Xác nhận", Icon: ClipboardList, activeColor: "bg-blue-500 border-blue-500" },
  { key: "shipping", label: "Đang giao", Icon: Truck, activeColor: "bg-emerald-600 border-emerald-600" },
  { key: "delivered", label: "Đã giao", Icon: Package, activeColor: "bg-emerald-600 border-emerald-600" },
];

const getStepIndex = (status) => {
  if (status === "pending") return 0;
  if (["confirmed", "processing", "preparing"].includes(status)) return 1;
  if (status === "shipping") return 2;
  if (["delivered", "completed"].includes(status)) return 3;
  return -1;
};

export default function OrderTrackingCard({ order, onViewDetail, onCancelOrder, onReturnOrder }) {
  const {
    id,
    order_code,
    status,
    dealer_name,
    item_count,
    total_amount,
    created_at,
    updated_at,
    status_histories,
    delivered_at,
    completed_at,
  } = order;

  const estimatedDeliveryTime = formatEstimatedDeliveryTime(order);
  const currentIndex = getStepIndex(status);

  const getStepTime = (stepKey) => {
    if (stepKey === "pending") return created_at;
    
    if (status_histories && status_histories.length > 0) {
      if (stepKey === "processing") {
        const h = status_histories.find(s => ["confirmed", "processing", "preparing"].includes(s.status));
        if (h) return h.created_at;
      }
      if (stepKey === "shipping") {
        const h = status_histories.find(s => s.status === "shipping");
        if (h) return h.created_at;
      }
      if (stepKey === "delivered") {
        const h = status_histories.find(s => ["delivered", "completed"].includes(s.status));
        if (h) return h.created_at;
      }
    }
    
    if (stepKey === "delivered") return delivered_at || completed_at;
    return null;
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order_code);
    appToast.success("Đã sao chép mã đơn hàng");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] text-gray-500">Mã đơn hàng:</span>
            <span className="text-[14px] font-bold text-gray-900">{order_code}</span>
            <button type="button" onClick={handleCopy} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
              <Copy size={14} />
            </button>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
          <Calendar size={14} />
          <span>{formatDateTime(created_at)}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {/* Store Info & Estimate */}
        <div className="flex flex-col gap-1 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Store size={20} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 leading-tight">{dealer_name}</h3>
              <p className="text-[13px] text-gray-500">{item_count} sản phẩm</p>
            </div>
          </div>
          {estimatedDeliveryTime && (
            <div className="flex items-center gap-1.5 text-[13px] text-emerald-700 mt-2">
              <Clock size={14} />
              <span>
                Dự kiến giao: <span className="font-semibold">{estimatedDeliveryTime}</span>
              </span>
            </div>
          )}
        </div>

        {/* Stepper */}
        {currentIndex >= 0 && (
          <div className="relative flex items-start justify-between w-full max-w-2xl mx-auto mb-4 px-2">
            {/* Connecting Lines Behind */}
            <div className="absolute top-5 left-8 right-8 h-[2px] bg-gray-200 z-0">
              {STEPS.map((_, i) => {
                if (i === STEPS.length - 1) return null;
                const isLineActive = currentIndex > i;
                return (
                  <div
                    key={i}
                    className={`absolute h-full transition-all duration-300 ${isLineActive ? "bg-emerald-600" : "bg-transparent"}`}
                    style={{
                      left: `${(i / (STEPS.length - 1)) * 100}%`,
                      width: `${100 / (STEPS.length - 1)}%`,
                    }}
                  />
                );
              })}
            </div>

            {/* Steps */}
            {STEPS.map((step, i) => {
              const isCompleted = i < currentIndex;
              const isActive = i === currentIndex;
              const StepIcon = isCompleted ? Check : step.Icon;

              let circleClass = "bg-white border-2 border-gray-300 text-gray-400";
              if (isCompleted) circleClass = "bg-white border-2 border-emerald-600 text-emerald-600";
              else if (isActive) circleClass = `border-2 text-white ${step.activeColor || "bg-emerald-600 border-emerald-600"}`;

              let timeText = "Chưa cập nhật";
              const stepTime = getStepTime(step.key);
              if (stepTime) {
                timeText = formatDateTime(stepTime, true);
              } else if (isActive && updated_at) {
                timeText = formatDateTime(updated_at, true);
              }

              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 w-24">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${circleClass}`}>
                    <StepIcon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <div className="text-center">
                    <p className={`text-[13px] font-medium ${isCompleted || isActive ? "text-gray-900" : "text-gray-500"}`}>
                      {step.label}
                    </p>
                    {/* <p className="text-[11px] text-gray-400 mt-0.5">
                      {isCompleted || isActive ? timeText : "Chưa cập nhật"}
                    </p> */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-gray-500">Tổng tiền:</span>
          <span className="text-[16px] font-bold text-emerald-700">{formatCurrency(total_amount)}</span>
        </div>
        <div className="flex items-center gap-3">
          {canCancelBuyerOrder(status) && onCancelOrder && (
            <button
              type="button"
              onClick={() => onCancelOrder(order)}
              className="text-[13px] font-medium text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Hủy đơn
            </button>
          )}
          {canReturnBuyerOrder(status) && onReturnOrder && (
            <button
              type="button"
              onClick={() => onReturnOrder(order)}
              className="text-[13px] font-medium text-amber-700 hover:text-amber-800 bg-white border border-amber-200 hover:bg-amber-50 px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Trả hàng
            </button>
          )}
          <button
            type="button"
            onClick={() => onViewDetail(id)}
            className="flex items-center gap-1 text-[13px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Xem chi tiết <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}