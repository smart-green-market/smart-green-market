import { CheckCircle2, Clock3 } from "lucide-react";

export default function OrderStatusBadge({ label, tone = "preparing" }) {
  const isPreparing = tone === "preparing";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 ${
        isPreparing ? "bg-emerald-200 text-teal-800" : "bg-zinc-200 text-neutral-700"
      }`}
    >
      {isPreparing ? <Clock3 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      <span className="text-base font-normal">{label}</span>
    </div>
  );
}
