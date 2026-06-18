import axiosClient from "./axiosClient";

/** Một số endpoint trả về { data: {...} } thay vì object trực tiếp */
export function unwrapApiData(payload) {
  if (payload == null || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload;

  const nested = payload.data;
  if (
    nested &&
    typeof nested === "object" &&
    !Array.isArray(nested) &&
    (nested.id != null ||
      nested.order_code != null ||
      nested.results != null ||
      nested.items != null ||
      nested.payments != null)
  ) {
    return nested;
  }

  return payload;
}

export function extractOrderItems(order) {
  if (!order) return [];

  const candidates = [
    order.items,
    order.order_items,
    order.purchase_order_items,
    order.line_items,
  ];

  for (const list of candidates) {
    if (Array.isArray(list)) return list;
  }

  return [];
}

export function normalizeOrderItem(item) {
  if (!item || typeof item !== "object") return item;

  const product = item.supplier_product ?? item.product ?? {};

  return {
    ...item,
    id: item.id ?? item.supplier_product_id ?? product.id,
    product_name:
      item.product_name ??
      item.supplier_product_name ??
      product.name ??
      "Sản phẩm",
    product_unit: item.product_unit ?? item.unit ?? product.unit ?? "",
    product_thumbnail_url:
      item.product_thumbnail_url ??
      product.thumbnail_url ??
      product.images?.[0]?.image_url ??
      null,
    unit_price: item.unit_price ?? item.price ?? item.wholesale_price ?? "0",
    quantity: item.quantity ?? "0",
    subtotal: item.subtotal ?? item.line_total ?? "0",
    note: item.note ?? "",
    item_status: item.item_status ?? item.status ?? "pending",
    reject_reason: item.reject_reason ?? item.rejection_reason ?? "",
  };
}

/** Chuẩn hóa object đơn hàng (detail hoặc từ list) */
export function parseOrderDetail(response) {
  let raw = unwrapApiData(response);

  // Response phân trang (GET /purchase-orders/) — không phải detail 1 đơn
  if (raw?.results && Array.isArray(raw.results) && raw.order_code == null && raw.id == null) {
    const withItems = raw.results.find(
      (o) => o?.order_code != null && extractOrderItems(o).length > 0,
    );
    raw = withItems ?? raw.results.find((o) => o?.order_code != null) ?? raw.results[0] ?? raw;
  }

  if (!raw) return null;

  return {
    ...raw,
    items: extractOrderItems(raw).map(normalizeOrderItem),
    payments: Array.isArray(raw.payments) ? raw.payments : [],
    status_histories: raw.status_histories ?? [],
  };
}

/** Thanh toán đang chờ NCC xác minh (cọc / thanh toán cuối) */
export function findPendingPayment(payments, paymentType) {
  if (!Array.isArray(payments)) return null;
  return (
    payments.find((p) => p.payment_type === paymentType && p.status === "pending") ??
    payments.find((p) => p.payment_type === paymentType)
  );
}

export function mergeOrderDetail(prev, detail) {
  const full = parseOrderDetail(detail);
  if (!full) return prev ?? null;
  return {
    ...full,
    items: full.items?.length ? full.items : (prev?.items ?? []),
    payments: Array.isArray(full.payments) ? full.payments : (prev?.payments ?? []),
  };
}

const PAYMENT_TYPE_ORDER = { deposit: 0, final_payment: 1 };

export function sortPaymentsForDisplay(payments) {
  if (!Array.isArray(payments)) return [];
  return [...payments].sort(
    (a, b) =>
      (PAYMENT_TYPE_ORDER[a.payment_type] ?? 9) - (PAYMENT_TYPE_ORDER[b.payment_type] ?? 9) ||
      new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0),
  );
}

export function canVerifyPayment(orderStatus, payment) {
  if (!payment || payment.status !== "pending") return false;
  if (orderStatus === "deposit_pending_verification" && payment.payment_type === "deposit") {
    return true;
  }
  if (orderStatus === "final_payment_pending_verification" && payment.payment_type === "final_payment") {
    return true;
  }
  return false;
}

/**
 * GET /api/purchase-orders/
 * Supplier: danh sách phiếu nhập gửi tới NCC đang đăng nhập.
 */
export function parseOrderList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;

  const unwrapped = unwrapApiData(response);
  const topResults = unwrapped.results ?? [];
  if (topResults.length === 0) return [];

  if (topResults[0]?.order_code != null) return topResults;

  if (Array.isArray(topResults[0]?.results)) {
    return topResults.flatMap((page) => page.results ?? []);
  }

  return topResults;
}

export const orderService = {
  getAll: async (params = {}) => {
    const res = await axiosClient.get("/purchase-orders/", { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await axiosClient.get(`/purchase-orders/${id}/`);
    return parseOrderDetail(res.data);
  },
  confirmOrder: async (id, data) => {
    const res = await axiosClient.post(`/purchase-orders/${id}/confirm/`, data);
    return parseOrderDetail(res.data);
  },

  rejectOrder: async (id, data) => {
    const res = await axiosClient.post(`/purchase-orders/${id}/reject/`, data);
    return parseOrderDetail(res.data);
  },

  verifyPayment: async (orderId, { payment_id, status, rejection_reason = "" }) => {
    const body = { payment_id, status };
    if (status === "rejected") {
      body.rejection_reason = rejection_reason;
    }
    const res = await axiosClient.post(`/purchase-orders/${orderId}/verify-payment/`, body);
    return res.data;
  },
  // orderService.js — fix confirmShipping
  confirmShipping: async (orderId, data) => {
    const res = await axiosClient.post(`/purchase-orders/${orderId}/ship/`, data)
    return res.data
  }
};
