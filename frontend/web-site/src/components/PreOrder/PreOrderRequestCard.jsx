import { CalendarClock, Package } from "lucide-react";
import PreOrderStatusBadge from "./PreOrderStatusBadge";
import {
  formatPreOrderDateTime,
  getPreOrderStatusMeta,
} from "../../utils/preorderStatusConfig";

export default function PreOrderRequestCard({
  request,
  selected = false,
  onClick,
  audience = "buyer",
  compact = false,
}) {
  const meta = getPreOrderStatusMeta(request.status, audience);
  const needsAction =
    audience === "dealer" ? meta.needsDealerAction : meta.needsBuyerAction;
  const requestCode = request.requestCode ?? request.request_code;
  const itemCount = request.itemCount ?? request.item_count ?? 0;
  const deliveryTime = formatPreOrderDateTime(
    request.requestedDeliveryTime ?? request.requested_delivery_time,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-xl border text-left transition-all ${
        selected
          ? "border-emerald-400 bg-white shadow-sm ring-2 ring-emerald-100"
          : "border-stone-200 bg-white hover:border-emerald-200"
      } ${compact ? "py-0" : ""}`}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${meta.accent}`}
        aria-hidden
      />

      <div className={`pl-4 pr-3 ${compact ? "py-3" : "px-4 py-4 pl-5"}`}>
        <div className="flex items-start justify-between gap-2">
          <p
            className={`truncate font-bold text-emerald-950 ${
              compact ? "text-sm" : "text-base"
            }`}
          >
            {requestCode}
          </p>
          <PreOrderStatusBadge
            status={request.status}
            audience={audience}
            compact
          />
        </div>

        <div
          className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-neutral-600 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <Package className="h-3 w-3 text-emerald-600" />
            {itemCount} SP
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3 text-emerald-600" />
            {deliveryTime}
          </span>
        </div>

        {needsAction ? (
          <p
            className={`mt-1.5 font-semibold ${
              compact ? "text-[11px]" : "text-xs"
            } ${audience === "buyer" ? "text-sky-700" : "text-amber-700"}`}
          >
            {audience === "buyer" ? "Cần phản hồi" : "Cần xử lý"}
          </p>
        ) : null}
      </div>
    </button>
  );
}
