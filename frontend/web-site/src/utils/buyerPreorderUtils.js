import { buildCreateOrderPayload } from "./buyerOrderUtils";
import { getPreOrderStatusMeta } from "./preorderStatusConfig";

export const STOCK_CHOICE = {
  ORDER_AVAILABLE: "order_available",
  PREORDER: "preorder",
  REMOVE: "remove",
};

export const PREORDER_STATUS_LABELS = {
  submitted: "Chờ đại lý xử lý",
  customer_confirmation_pending: "Cần bạn xác nhận",
  rejected_by_dealer: "Đại lý từ chối",
  rejected_by_customer: "Bạn đã từ chối",
  converted: "Đã thành đơn",
  cancelled: "Đã hủy",
};

export function parseCheckStockResults(response) {
  const rows = Array.isArray(response) ? response : response?.results ?? [];
  return rows.map((row) => ({
    dealerProductId: row.dealer_product_id,
    requestedQuantity: Number(row.requested_quantity) || 0,
    availableQuantity: Number(row.available_quantity) || 0,
    shortfall: Number(row.shortfall) || 0,
    canOrderAvailable: row.can_order_available !== false,
    needsPreorder: row.needs_preorder === true,
    orderAvailableQuantity: Number(row.order_available_quantity) || 0,
  }));
}

export function mergeStockWithCheckoutItems(checkoutItems = [], stockResults = []) {
  const stockById = new Map(
    stockResults.map((row) => [String(row.dealerProductId), row]),
  );

  return checkoutItems.map((item) => {
    const stock = stockById.get(String(item.id)) ?? null;
    return {
      item,
      stock,
      needsChoice: Boolean(stock?.needsPreorder),
    };
  });
}

export function getDefaultStockChoices(mergedItems = []) {
  const choices = {};
  mergedItems.forEach(({ item, stock, needsChoice }) => {
    if (!needsChoice) return;
    if (stock?.canOrderAvailable) {
      choices[String(item.id)] = STOCK_CHOICE.ORDER_AVAILABLE;
    } else {
      choices[String(item.id)] = STOCK_CHOICE.PREORDER;
    }
  });
  return choices;
}

export function hasUnresolvedShortfall(mergedItems = [], choices = {}) {
  return mergedItems.some(({ item, needsChoice }) => {
    if (!needsChoice) return false;
    return !choices[String(item.id)];
  });
}

export function isCheckoutSplitEmpty({ orderItems = [], preorderItems = [] } = {}) {
  return orderItems.length === 0 && preorderItems.length === 0;
}

export function splitCheckoutByChoices(mergedItems = [], choices = {}) {
  const orderItems = [];
  const preorderItems = [];
  const removedProductIds = [];

  mergedItems.forEach(({ item, stock, needsChoice }) => {
    if (!needsChoice) {
      orderItems.push({
        id: item.id,
        quantity: item.quantity,
      });
      return;
    }

    const choice = choices[String(item.id)] ?? STOCK_CHOICE.REMOVE;

    if (choice === STOCK_CHOICE.REMOVE) {
      removedProductIds.push(item.id);
      return;
    }

    if (choice === STOCK_CHOICE.ORDER_AVAILABLE && stock?.canOrderAvailable) {
      orderItems.push({
        id: item.id,
        quantity: stock.orderAvailableQuantity,
      });
      return;
    }

    if (choice === STOCK_CHOICE.PREORDER) {
      preorderItems.push({
        id: item.id,
        quantity: item.quantity,
      });
    }
  });

  return { orderItems, preorderItems, removedProductIds };
}

export function buildPreOrderPayload({
  items,
  customerAddressId,
  deliveryDate,
  deliverySlot,
  note,
}) {
  return buildCreateOrderPayload({
    items,
    customerAddressId,
    deliveryDate,
    deliverySlot,
    note,
  });
}

export function parsePreOrderSummary(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    requestCode: raw.request_code ?? "",
    status: raw.status ?? "",
    statusLabel:
      raw.status_label ??
      getPreOrderStatusMeta(raw.status, "buyer").label ??
      raw.status ??
      "",
    requestedDeliveryTime: raw.requested_delivery_time ?? null,
    confirmedDeliveryTime: raw.confirmed_delivery_time ?? null,
    proposedDeliveryTime: raw.proposed_delivery_time ?? null,
    itemCount: raw.item_count ?? raw.items?.length ?? 0,
    convertedOrderId: raw.converted_order_id ?? null,
    createdAt: raw.created_at ?? null,
    items: (raw.items ?? []).map((item) => ({
      id: item.id,
      dealerProductId: item.dealer_product_id,
      productTitle: item.product_title ?? "",
      unit: item.unit ?? "",
      requestedQuantity: item.requested_quantity ?? 0,
      availableAtSubmit: item.available_at_submit ?? 0,
      confirmedQuantity: item.confirmed_quantity ?? null,
      proposedQuantity: item.proposed_quantity ?? null,
    })),
    receiverName: raw.receiver_name ?? "",
    receiverPhone: raw.receiver_phone ?? "",
    deliveryAddress: raw.delivery_address ?? "",
    note: raw.note ?? "",
    dealerNote: raw.dealer_note ?? "",
    rejectReason: raw.reject_reason ?? "",
  };
}

export function parsePreOrderList(response) {
  const results = response?.results ?? (Array.isArray(response) ? response : []);
  return results.map(parsePreOrderSummary).filter(Boolean);
}

export function canAcceptPreOrder(preorder) {
  return preorder?.status === "customer_confirmation_pending";
}

export function canRejectPreOrder(preorder) {
  return preorder?.status === "customer_confirmation_pending";
}
