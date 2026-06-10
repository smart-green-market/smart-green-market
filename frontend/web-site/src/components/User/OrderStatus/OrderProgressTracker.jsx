import { Check, Clock3, Truck, PackageCheck } from "lucide-react";
import { orderStatusSteps } from "./mockData";

const iconByStep = {
  received: Check,
  preparing: Clock3,
  shipping: Truck,
  completed: PackageCheck,
};

export default function OrderProgressTracker({ currentStep }) {
  const currentIndex = orderStatusSteps.findIndex((step) => step.key === currentStep);
  const progressPercent =
    currentIndex <= 0
      ? 0
      : (currentIndex / (orderStatusSteps.length - 1)) * 100;

  return (
    <div className="relative pb-8 pt-12">
      <div className="absolute left-0 right-0 top-[82px] h-1 bg-gray-200" />
      <div
        className="absolute left-0 top-[82px] h-1 bg-teal-800 transition-all"
        style={{ width: `${progressPercent}%` }}
      />

      <div className="relative z-10 flex items-start justify-between">
        {orderStatusSteps.map((step, index) => {
          const Icon = iconByStep[step.key];
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isActive = isDone || isCurrent;

          return (
            <div key={step.key} className="flex flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isActive ? "bg-teal-800" : "bg-gray-200"
                } ${isCurrent ? "outline outline-4 outline-white" : ""}`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-neutral-500"}`} />
              </div>
              <span className={`text-base ${isActive ? "text-teal-800" : "text-neutral-700"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
