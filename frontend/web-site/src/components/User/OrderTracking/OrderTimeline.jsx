// src/components/OrderTimeline.jsx
import { Check, Clock, Truck, Package } from "lucide-react";

/**
 * Danh sách các bước trong tiến trình đơn hàng.
 * timeKey ứng với field thời gian tương ứng trong object order.
 */
const STEPS = [
  { key: "received", label: "Đã nhận", icon: Check, timeKey: "orderedAt" },
  { key: "preparing", label: "Chuẩn bị", icon: Clock, timeKey: "confirmedAt" },
  { key: "shipping", label: "Giao hàng", icon: Truck, timeKey: "expectedDeliveryAt" },
  { key: "completed", label: "Hoàn thành", icon: Package, timeKey: "deliveredAt" },
];

/**
 * Hiển thị tiến trình đơn hàng dạng timeline ngang, gộp luôn mốc thời gian
 * của từng bước (không tách thành 2 khối riêng).
 *
 * Props:
 * - currentStep: number (1 -> 4), bước hiện tại của đơn hàng
 * - orderedAt, confirmedAt, expectedDeliveryAt, deliveredAt: string | null
 */
export default function OrderTimeline({
  currentStep,
  orderedAt,
  confirmedAt,
  expectedDeliveryAt,
  deliveredAt,
}) {
  const times = { orderedAt, confirmedAt, expectedDeliveryAt, deliveredAt };

  return (
    <div className="flex items-start">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isLast = index === STEPS.length - 1;
        const Icon = step.icon;
        const timeValue = times[step.timeKey];

        return (
          <div key={step.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center text-center">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isDone || isActive ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-300"
                }`}
              >
                <Icon size={18} />
              </span>
              <span
                className={`mt-2 text-sm ${
                  isDone || isActive ? "font-medium text-emerald-800" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
              <span className="mt-0.5 text-xs text-slate-400">{timeValue || "—"}</span>
            </div>

            {!isLast && (
              <div className="mx-2 mt-[-28px] h-0.5 flex-1 bg-slate-100">
                <div
                  className="h-0.5 bg-emerald-800 transition-all"
                  style={{ width: isDone ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
