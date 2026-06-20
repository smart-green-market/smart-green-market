// src/components/User/OrderTracking/orderUtils.js
//
// Helper dùng chung cho OrderTrackingCard & OrderDetailModal.
// Field names bám theo response thật của buyerOrder.getAll() / getById().

export const formatCurrency = (value) => {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("vi-VN") + "đ";
};

// withTime = false -> chỉ hiện ngày (dùng cho delivery_date dạng "YYYY-MM-DD")
export const formatDateTime = (value, withTime = true) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value; // fallback: hiện nguyên string nếu parse lỗi

  const datePart = d.toLocaleDateString("vi-VN");
  if (!withTime) return datePart;

  const timePart = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} • ${timePart}`;
};

// status của ĐƠN HÀNG (order.status) — bám theo flow BE: pending → confirmed → processing → shipping → delivered → completed
export const ORDER_STATUS_CFG = {
  pending:    { label: "Chờ xác nhận",   bg: "bg-blue-100",    text: "text-blue-700"    },
  confirmed:  { label: "Đã xác nhận",    bg: "bg-blue-100",    text: "text-blue-700"    },
  processing: { label: "Đang chuẩn bị",  bg: "bg-blue-100",    text: "text-blue-700"    },
  preparing:  { label: "Đang chuẩn bị",  bg: "bg-blue-100",    text: "text-blue-700"    },
  shipping:   { label: "Đang giao hàng", bg: "bg-amber-100",   text: "text-amber-700"   },
  delivered:  { label: "Đã giao",        bg: "bg-teal-100",    text: "text-teal-700"    },
  completed:  { label: "Hoàn tất",       bg: "bg-emerald-100", text: "text-emerald-700" },
  cancelled:  { label: "Đã hủy",         bg: "bg-red-50",      text: "text-red-500"     },
};

/** Các trạng thái thuộc nhóm "Đang xử lý" trên trang theo dõi đơn hàng */
export const PROCESSING_STATUSES = ["pending", "confirmed", "processing", "preparing"];

export const STATUS_FILTER_MAP = {
  processing: PROCESSING_STATUSES,
  shipping: ["shipping", "delivered"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

export function matchesStatusFilter(orderStatus, filterKey) {
  if (filterKey === "all") return true;
  const allowed = STATUS_FILTER_MAP[filterKey];
  return allowed ? allowed.includes(orderStatus) : orderStatus === filterKey;
}

export const getStatusCfg = (status) =>
  ORDER_STATUS_CFG[status] ?? { label: status || "—", bg: "bg-gray-100", text: "text-gray-500" };

// payment_method ("cash" theo example trong API)
const PAYMENT_METHOD_LABEL = {
  cash: "Tiền mặt (COD)",
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ ngân hàng",
};

export const formatPaymentMethod = (method) => PAYMENT_METHOD_LABEL[method] ?? method ?? "—";
