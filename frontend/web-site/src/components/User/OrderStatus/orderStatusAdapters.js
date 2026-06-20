import { formatCurrency } from "../../../utils/userOrderUtils";

export function toActiveOrderCard(order) {
  return {
    id: order.orderCode,
    customerName: order.dealerName,
    orderedAt: order.orderedAt,
    statusLabel: order.statusLabel,
    statusTone: order.statusTone,
    currentStep: order.currentStep,
    sourceOrder: order,
    items: order.items.map((item) => ({
      id: item.id,
      name: `${item.quantity}${item.product_unit ? `/${item.product_unit}` : ""} ${item.product_name}`,
      price: Number(item.subtotal),
    })),
  };
}

export function toCompletedOrderCard(order) {
  return {
    id: order.orderCode,
    customerName: order.dealerName,
    orderedAt: order.orderedAt,
    statusLabel: order.statusLabel,
    statusTone: order.statusTone,
    image: order.previewImage,
    title: order.previewTitle,
    subtitle: order.previewSubtitle,
    total: order.total,
    sourceOrder: order,
  };
}

export { formatCurrency };
