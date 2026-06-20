import { formatCurrency } from "../components/User/Cart/mockData";

const STATUS_META = {
  received: {
    label: "Đã nhận đơn",
    tone: "received",
    step: "received",
  },
  preparing: {
    label: "Đang chuẩn bị",
    tone: "preparing",
    step: "preparing",
  },
  shipping: {
    label: "Đang giao hàng",
    tone: "shipping",
    step: "shipping",
  },
  completed: {
    label: "Đã hoàn thành",
    tone: "completed",
    step: "completed",
  },
  cancelled: {
    label: "Đã hủy",
    tone: "cancelled",
    step: "received",
  },
};

export function parseUserOrderList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

function sumItems(items = []) {
  return items.reduce((total, item) => total + Number(item.subtotal ?? 0), 0);
}

function formatOrderedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const datePart = date.toLocaleDateString("vi-VN");
  const timePart = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Ngày đặt: ${datePart} • ${timePart}`;
}

function formatHistoryAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

export function formatUserOrder(raw) {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  const subtotal = sumItems(items);
  const shippingFee = Number(raw?.shipping_fee ?? 0);
  const discount = Number(raw?.discount ?? 0);
  const total = subtotal + shippingFee - discount;
  const status = raw?.status ?? "received";
  const meta = STATUS_META[status] ?? STATUS_META.received;
  const firstItem = items[0];

  return {
    id: raw.id,
    orderCode: raw.order_code ?? `#ORD-${raw.id}`,
    status,
    statusLabel: meta.label,
    statusTone: meta.tone,
    currentStep: meta.step,
    createdAt: raw.created_at,
    orderedAt: formatOrderedAt(raw.created_at),
    dealerName: raw.dealer_name ?? raw.dealer?.store_name ?? "GreenMarket",
    paymentMethod: raw.payment_method ?? "—",
    shippingAddress: raw.shipping_address ?? null,
    note: raw.note ?? "",
    shippingFee,
    discount,
    subtotal,
    total,
    items,
    itemCount: items.length,
    previewImage: firstItem?.product_thumbnail_url ?? null,
    previewTitle: firstItem?.product_name ?? "Sản phẩm",
    previewSubtitle:
      items.length > 1 ? `Và ${items.length - 1} sản phẩm khác...` : "",
    statusHistories: (raw.status_histories ?? []).map((entry) => ({
      ...entry,
      atLabel: formatHistoryAt(entry.at),
    })),
  };
}

export function formatOrderItemLine(item) {
  const quantity = Number(item.quantity ?? 1);
  const unit = item.product_unit ? `/${item.product_unit}` : "";
  return `${quantity}${unit} ${item.product_name}`;
}

export { formatCurrency };
