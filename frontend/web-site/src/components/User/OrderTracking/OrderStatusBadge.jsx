// src/components/OrderStatusBadge.jsx
import { Clock, CheckCircle2, Truck, PackageCheck, XCircle } from "lucide-react";

/**
 * Cấu hình hiển thị cho từng trạng thái đơn hàng.
 * Nếu BE trả về thêm trạng thái mới, chỉ cần thêm key vào đây.
 */
const STATUS_CONFIG = {
  pending: { label: "Chờ xác nhận", icon: Clock, className: "bg-sky-100 text-sky-700" },
  confirmed: { label: "Đã xác nhận", icon: CheckCircle2, className: "bg-sky-100 text-sky-700" },
  processing: { label: "Đang chuẩn bị", icon: Clock, className: "bg-emerald-100 text-emerald-700" },
  preparing: { label: "Đang chuẩn bị", icon: Clock, className: "bg-emerald-100 text-emerald-700" },
  shipping: { label: "Đang giao hàng", icon: Truck, className: "bg-amber-100 text-amber-700" },
  delivered: { label: "Đã giao", icon: PackageCheck, className: "bg-teal-100 text-teal-700" },
  completed: { label: "Hoàn tất", icon: PackageCheck, className: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Đã hủy", icon: XCircle, className: "bg-rose-100 text-rose-600" },
};

export default function OrderStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.processing;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${config.className}`}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
}
