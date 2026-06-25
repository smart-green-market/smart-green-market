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

  const raw = String(value).trim();
  if (!withTime && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-");
    return `${day}/${month}/${year}`;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  const options = withTime
    ? {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    : {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };

  const formatted = new Intl.DateTimeFormat("vi-VN", options).format(d);
  if (!withTime) return formatted;

  return formatted.replace(", ", " • ");
};

// status của ĐƠN HÀNG (order.status) — bám theo flow BE: pending → confirmed → processing → shipping → delivered → completed
export const ORDER_STATUS_CFG = {
  pending: { label: "Chờ xác nhận", bg: "bg-blue-100", text: "text-blue-700" },
  confirmed: { label: "Đã xác nhận", bg: "bg-blue-100", text: "text-blue-700" },
  processing: { label: "Đang chuẩn bị", bg: "bg-blue-100", text: "text-blue-700" },
  preparing: { label: "Đang chuẩn bị", bg: "bg-blue-100", text: "text-blue-700" },
  shipping: { label: "Đang giao hàng", bg: "bg-amber-100", text: "text-amber-700" },
  delivered: { label: "Đã giao", bg: "bg-teal-100", text: "text-teal-700" },
  completed: { label: "Hoàn tất", bg: "bg-emerald-100", text: "text-emerald-700" },
  cancelled: { label: "Đã hủy", bg: "bg-red-50", text: "text-red-500" },
};

/** Các trạng thái không hiển thị trên trang theo dõi đơn hàng */
export const TERMINAL_ORDER_STATUSES = ["completed", "cancelled"];

export function isActiveTrackingOrder(status) {
  return !TERMINAL_ORDER_STATUSES.includes(status);
}

export function isHistoryOrder(status) {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

export function matchesHistoryStatusFilter(orderStatus, filterKey) {
  if (filterKey === "all") return isHistoryOrder(orderStatus);
  if (filterKey === "completed") return orderStatus === "completed";
  if (filterKey === "cancelled") return orderStatus === "cancelled";
  return false;
}

export function sortOrdersByCreatedDesc(orders = []) {
  return [...orders].sort((a, b) => {
    const timeA = new Date(a?.created_at ?? 0).getTime();
    const timeB = new Date(b?.created_at ?? 0).getTime();
    return timeB - timeA;
  });
}

const DELIVERY_SLOT_WINDOWS = {
  morning: { start: "06:00", end: "11:00" },
  afternoon: { start: "13:00", end: "18:00" },
};

function resolveDeliverySlotKey(deliverySlot, deliverySlotName) {
  const slot = String(deliverySlot ?? "").trim().toLowerCase();
  const name = String(deliverySlotName ?? "").trim().toLowerCase();

  if (
    slot.includes("morning") ||
    slot === "sang" ||
    name.includes("sáng") ||
    name.includes("sang")
  ) {
    return "morning";
  }

  if (
    slot.includes("afternoon") ||
    slot === "chieu" ||
    name.includes("chiều") ||
    name.includes("chieu")
  ) {
    return "afternoon";
  }

  return null;
}

export function formatEstimatedDeliveryTime(order = {}) {
  const {
    delivery_date: deliveryDate,
    delivery_slot: deliverySlot,
    delivery_slot_name: deliverySlotName,
    delivery_time: deliveryTime,
  } = order;

  if (deliveryTime) {
    const formatted = formatDateTime(deliveryTime);
    if (formatted) return formatted;
  }

  const slotKey = resolveDeliverySlotKey(deliverySlot, deliverySlotName);
  const dateLabel = deliveryDate ? formatDateTime(deliveryDate, false) : null;

  if (slotKey && dateLabel) {
    const window = DELIVERY_SLOT_WINDOWS[slotKey];
    return `${dateLabel}, ${window.start} - ${window.end}`;
  }

  if (dateLabel && deliverySlotName) {
    return `${dateLabel} • ${deliverySlotName}`;
  }

  return dateLabel || deliverySlotName || null;
}

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
