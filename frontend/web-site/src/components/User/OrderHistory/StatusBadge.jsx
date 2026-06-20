// ============================================================
// StatusBadge.jsx
// Badge hiển thị trạng thái đơn hàng
// ============================================================
// Props:
//   status: "processing" | "shipping" | "completed" | "cancelled"
// ============================================================
import React from "react";

const STATUS_MAP = {
  processing: {
    label: "Đang chuẩn bị",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  shipping: {
    label: "Đang giao hàng",
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1.004 9.029A2 2 0 007.99 19h8.02a2 2 0 001.986-1.971L19 8M10 12h4" />
      </svg>
    ),
  },
  completed: {
    label: "Đã hoàn thành",
    bg: "bg-[#d1fae5]",
    text: "text-[#1a5c2a]",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  cancelled: {
    label: "Đã hủy",
    bg: "bg-red-50",
    text: "text-red-500",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_MAP[status] || STATUS_MAP.processing;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

export default StatusBadge;