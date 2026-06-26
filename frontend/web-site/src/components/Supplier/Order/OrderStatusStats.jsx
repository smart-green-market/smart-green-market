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

// Icon tones mirror the .mc-icon.{g|a|b|p} classes from the supplier dashboard mockup:
// g = green0/green700, a = amber0/amber800, b = blue0/blue800, p = purple0/purple800
export function buildOrderStatusStats(orders = []) {
  return [
    {
      key: "pending",
      icon: Clock,
      label: "Chờ duyệt",
      value: countOrdersByGroup(orders, ORDER_STATUS_GROUPS.pending),
      tone: "a",
    },
    {
      key: "processing",
      icon: RefreshCw,
      label: "Đang xử lý",
      value: countOrdersByGroup(orders, ORDER_STATUS_GROUPS.processing),
      tone: "b",
    },
    {
      key: "delivered",
      icon: CheckCircle,
      label: "Đã giao",
      value: countOrdersByGroup(orders, ORDER_STATUS_GROUPS.delivered),
      tone: "g",
    },
    {
      key: "cancelled",
      icon: XCircle,
      label: "Đã hủy",
      value: countOrdersByGroup(orders, ORDER_STATUS_GROUPS.cancelled),
      tone: "r",
    },
  ];
}

// Color tokens copied 1:1 from the dashboard mockup's :root variables.
const TONE_STYLES = {
  g: { iconBg: "#EAF3DE", iconColor: "#3B6D11" },
  a: { iconBg: "#FAEEDA", iconColor: "#854F0B" },
  b: { iconBg: "#E6F1FB", iconColor: "#185FA5" },
  p: { iconBg: "#EEEDFE", iconColor: "#534AB7" },
  r: { iconBg: "#FCEBEB", iconColor: "#A32D2D" },
};

function OrderStatCard({ icon: Icon, label, value, tone }) {
  const { iconBg, iconColor } = TONE_STYLES[tone];

  return (
    <div
      className="rounded-xl px-4 py-[14px]"
      style={{
        background: "#ffffff",
        border: "0.5px solid #e5e7eb",
        fontFamily: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon className="w-4 h-4" strokeWidth={2.25} />
        </div>
      </div>
      <p
        className="text-[24px] font-medium leading-none tabular-nums"
        style={{ color: "#111827" }}
      >
        {value}
      </p>
      <p className="text-[11px] mt-1" style={{ color: "#80899a" }}>
        {label}
      </p>
    </div>
  );
}

export default function OrderStatusStats({ orders = [] }) {
  const stats = buildOrderStatusStats(orders);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
      {stats.map((item) => (
        <OrderStatCard
          key={item.key}
          icon={item.icon}
          label={item.label}
          value={item.value}
          tone={item.tone}
        />
      ))}
    </div>
  );
}