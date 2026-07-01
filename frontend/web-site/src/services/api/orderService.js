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
    item_status:
      item.item_status ??
      item.review_status ??
      item.status ??
      "pending",
    reject_reason: item.reject_reason ?? item.rejection_reason ?? "",
  };
}

/** Payload POST /purchase-orders/{id}/confirm/ */
export function buildConfirmOrderPayload({
  items,
  depositPercent,
  confirmedDeliveryTime,
  note = "",
}) {
  return {
    confirmed_delivery_time: confirmedDeliveryTime,
    deposit_percent: String(depositPercent),
    note: note ?? "",
    items: (items ?? []).map((item) => ({
      id: item.id,
      review_status: item.item_status,
      quantity: String(item.quantity ?? "0"),
      rejection_reason:
        item.item_status === "rejected"
          ? (item.reject_reason ?? item.rejection_reason ?? "").trim()
          : "",
    })),
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
    returns: Array.isArray(raw.returns) ? raw.returns.map(normalizeReturnRequest) : (raw.returns ? [normalizeReturnRequest(raw.returns)] : []),
    return_summary: raw.return_summary ?? null,
    status_histories: raw.status_histories ?? [],
  };
}

export function normalizeReturnRequest(ret) {
  if (!ret || typeof ret !== "object") return ret;
  return {
    ...ret,
    items: Array.isArray(ret.items) ? ret.items : [],
  };
}

/** Gắn ảnh, đơn vị, đơn giá từ dòng đơn hàng gốc */
export function enrichReturnItems(returnItems, orderItems = []) {
  return (returnItems ?? []).map((ri) => {
    const orderItem = orderItems.find(
      (o) =>
        String(o.id) === String(ri.purchase_order_item_id) ||
        String(o.id) === String(ri.purchase_order_item),
    );
    const qty = Number(ri.quantity ?? 0);
    const unitPrice = Number(orderItem?.unit_price ?? 0);
    return {
      ...ri,
      product_name: ri.product_name ?? orderItem?.product_name ?? "Sản phẩm",
      product_unit: ri.product_unit ?? orderItem?.product_unit ?? "",
      product_thumbnail_url: orderItem?.product_thumbnail_url ?? null,
      unit_price: orderItem?.unit_price ?? null,
      estimated_refund: qty && unitPrice ? qty * unitPrice : null,
    };
  });
}

export function sortReturnsNewestFirst(returns) {
  if (!Array.isArray(returns)) return [];
  return [...returns].sort(
    (a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0),
  );
}

const RETURN_RECORD_PENDING = new Set(["pending", "pending_review", "requested"]);

export function isReturnRecordPending(ret) {
  if (!ret) return false;
  if (ret.resolved_at) return false;
  if (ret.reviewed_by != null) return false;
  const status = String(ret.status ?? "").toLowerCase();
  if (RETURN_RECORD_PENDING.has(status)) return true;
  return ret.approved == null && !ret.reviewed_at;
}

const SUCCESSFUL_RETURN_STATUSES = new Set(["approved", "returned"]);

/** Yêu cầu trả hàng đã được NCC duyệt thành công */
export function isSuccessfulReturnRecord(ret) {
  if (!ret) return false;
  if (ret.approved === false) return false;
  const status = String(ret.status ?? "").toLowerCase();
  if (SUCCESSFUL_RETURN_STATUSES.has(status)) return true;
  if (ret.approved === true) return true;
  return Boolean(ret.resolved_at && ret.reviewed_by != null && status !== "rejected");
}

/** ID các dòng đơn (purchase_order_item_id) đã trả hàng thành công */
export function getSuccessfullyReturnedItemIds(order) {
  const ids = new Set();
  const returns = order?.returns ?? order?.return_requests ?? [];
  if (!Array.isArray(returns)) return ids;

  for (const ret of returns) {
    if (!isSuccessfulReturnRecord(ret)) continue;
    for (const item of ret.items ?? []) {
      const itemId = item.purchase_order_item_id ?? item.purchase_order_item ?? item.order_item_id;
      if (itemId != null) ids.add(String(itemId));
    }
  }
  return ids;
}

export function orderMayHaveReturnHistory(order) {
  if (!order) return false;
  if (Array.isArray(order.returns) && order.returns.length > 0) return true;
  if (order.return_summary?.approved_refund_total > 0) return true;
  const status = String(order.status ?? "").trim();
  return ["return_requested", "return_approved", "return_rejected", "returned"].includes(status);
}

/** Thanh toán đang chờ NCC xác minh (cọc / thanh toán cuối) */
export function findPendingPayment(payments, paymentType) {
  if (!Array.isArray(payments)) return null;
  return (
    payments.find((p) => p.payment_type === paymentType && p.status === "pending") ??
    payments.find((p) => p.payment_type === paymentType)
  );
}

const RETURN_PENDING_STATUSES = new Set([
  "return_requested",
  "return_request",
  "return_pending_review",
]);

export function isReturnPendingReviewStatus(status) {
  return RETURN_PENDING_STATUSES.has(String(status ?? "").trim());
}

/** Yêu cầu trả hàng đang chờ NCC duyệt */
export function findPendingReturnRequest(order) {
  if (!order) return null;

  const returns = order.returns ?? order.return_requests ?? [];
  const list = Array.isArray(returns) ? returns : [];

  const pendingId = order.return_summary?.pending_return_id;
  if (pendingId != null) {
    const byId = list.find((r) => r.id === pendingId);
    if (byId) return normalizeReturnRequest(byId);
  }

  const standalone = order.pending_return ?? order.active_return;
  if (standalone?.id != null && isReturnRecordPending(standalone)) {
    return normalizeReturnRequest(standalone);
  }

  const pending = list.find((r) => isReturnRecordPending(r));
  if (pending) return normalizeReturnRequest(pending);

  if (isReturnPendingReviewStatus(order.status) && list.length > 0) {
    return normalizeReturnRequest(sortReturnsNewestFirst(list)[0]);
  }

  return standalone ? normalizeReturnRequest(standalone) : null;
}

export function canReviewReturnRequest(order) {
  if (!order) return false;
  return String(order.status ?? "").trim() === "return_requested";
}

export function mergeOrderDetail(prev, detail) {
  const full = parseOrderDetail(detail);
  if (!full) return prev ?? null;
  return {
    ...full,
    items: full.items?.length ? full.items : (prev?.items ?? []),
    payments: Array.isArray(full.payments) ? full.payments : (prev?.payments ?? []),
    returns: Array.isArray(full.returns) ? full.returns : (prev?.returns ?? []),
    return_summary: full.return_summary ?? prev?.return_summary ?? null,
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
  /** [Bước 2a] NCC xác nhận phiếu — gửi confirmed_delivery_time + deposit_percent */
  confirmOrder: async (id, data) => {
    const res = await axiosClient.post(`/purchase-orders/${id}/confirm/`, data);
    return parseOrderDetail(res.data);
  },

  /** [Trả hàng] NCC duyệt/từ chối yêu cầu trả hàng */
  reviewReturn: async (orderId, returnId, { approved, review_note = "" }) => {
    const res = await axiosClient.post(
      `/purchase-orders/${orderId}/returns/${returnId}/review/`,
      { approved, review_note },
    );
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
