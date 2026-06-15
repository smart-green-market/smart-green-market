import { Clock, RefreshCw, CheckCircle, XCircle } from "lucide-react";

export const ORDER_STATUS_GROUPS = {
  pending: ["pending_supplier_confirmation"],
  processing: [
    "confirmed",
    "deposit_pending_verification",
    "deposit_paid",
    "processing",
    "shipping",
    "final_payment_pending_verification",
  ],
  delivered: ["delivered", "completed"],
  cancelled: ["cancelled", "rejected"],
};

export function countOrdersByGroup(orders, statuses) {
  return orders.filter((order) => statuses.includes(order.status)).length;
}

export function buildOrderStatusStats(orders = []) {
  return [
    {
      key: "pending",
      icon: Clock,
      label: "Chờ duyệt",
      value: countOrdersByGroup(orders, ORDER_STATUS_GROUPS.pending),
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      valueColor: "text-amber-700",
    },
    {
      key: "processing",
      icon: RefreshCw,
      label: "Đang xử lý",
      value: countOrdersByGroup(orders, ORDER_STATUS_GROUPS.processing),
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      valueColor: "text-blue-700",
    },
    {
      key: "delivered",
      icon: CheckCircle,
      label: "Đã giao",
      value: countOrdersByGroup(orders, ORDER_STATUS_GROUPS.delivered),
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
    },
    {
      key: "cancelled",
      icon: XCircle,
      label: "Đã hủy",
      value: countOrdersByGroup(orders, ORDER_STATUS_GROUPS.cancelled),
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      valueColor: "text-red-600",
    },
  ];
}

function OrderStatCard({ icon: Icon, label, value, iconBg, iconColor, valueColor }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow min-h-[96px]">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}
      >
        <Icon className="w-5 h-5" strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-600 font-['Geist',sans-serif] mb-0.5">
          {label}
        </p>
        <p
          className={`text-[28px] font-bold leading-none tabular-nums tracking-tight font-['Geist',sans-serif] ${valueColor}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function OrderStatusStats({ orders = [] }) {
  const stats = buildOrderStatusStats(orders);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((item) => (
        <OrderStatCard
          key={item.key}
          icon={item.icon}
          label={item.label}
          value={item.value}
          iconBg={item.iconBg}
          iconColor={item.iconColor}
          valueColor={item.valueColor}
        />
      ))}
    </div>
  );
}
