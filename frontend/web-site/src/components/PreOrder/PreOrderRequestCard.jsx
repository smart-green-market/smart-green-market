import { CalendarClock, ChevronRight, Package } from "lucide-react";
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
}) {
  const meta = getPreOrderStatusMeta(request.status, audience);
  const needsAction =
    audience === "dealer" ? meta.needsDealerAction : meta.needsBuyerAction;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-2xl border text-left transition-all ${
        selected
          ? `border-emerald-300 bg-white shadow-md ring-2 ring-emerald-100`
          : "border-stone-200 bg-white hover:border-emerald-200 hover:shadow-sm"
      }`}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1.5 ${meta.accent}`}
        aria-hidden
      />

      <div className="flex items-start gap-3 px-4 py-4 pl-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-emerald-950">
              {request.requestCode ?? request.request_code}
            </p>
            <PreOrderStatusBadge
              status={request.status}
              audience={audience}
              compact
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-emerald-600" />
              {request.itemCount ?? request.item_count ?? 0} sản phẩm
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-emerald-600" />
              Giao {formatPreOrderDateTime(
                request.requestedDeliveryTime ?? request.requested_delivery_time,
              )}
            </span>
          </div>

          {needsAction ? (
            <p
              className={`mt-2 text-xs font-semibold ${
                audience === "buyer" ? "text-sky-700" : "text-amber-700"
              }`}
            >
              {audience === "buyer"
                ? "Có đề xuất cần bạn phản hồi"
                : "Cần xử lý yêu cầu này"}
            </p>
          ) : null}
        </div>

        <ChevronRight
          className={`mt-1 h-4 w-4 shrink-0 transition-transform ${
            selected
              ? "text-emerald-700"
              : "text-neutral-300 group-hover:text-emerald-600"
          }`}
        />
      </div>
    </button>
  );
}
