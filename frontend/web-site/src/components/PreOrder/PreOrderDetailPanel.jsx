import { CalendarClock, MapPin, MessageSquare, Phone, User } from "lucide-react";
import PreOrderStatusBadge from "./PreOrderStatusBadge";
import { formatPreOrderDateTime } from "../../utils/preorderStatusConfig";

function MetaBlock({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl bg-stone-50 px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {label}
        </p>
        <p className="text-sm font-medium text-neutral-800">{value}</p>
      </div>
    </div>
  );
}

function ItemRow({ item }) {
  const hasProposal =
    item.proposedQuantity != null &&
    item.proposedQuantity !== item.requestedQuantity;

  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
      <p className="font-semibold text-emerald-950">
        {item.productTitle ?? item.product_title}
      </p>
      <div className="mt-2 space-y-1 text-sm text-neutral-600">
        <p>
          Yêu cầu:{" "}
          <span className="font-semibold text-neutral-800">
            {item.requestedQuantity ?? item.requested_quantity}{" "}
            {item.unit}
          </span>
        </p>
        {item.confirmedQuantity != null || item.confirmed_quantity != null ? (
          <p>
            Đã chốt:{" "}
            <span className="font-semibold text-emerald-800">
              {item.confirmedQuantity ?? item.confirmed_quantity} {item.unit}
            </span>
          </p>
        ) : null}
        {hasProposal ? (
          <p>
            Đại lý đề xuất:{" "}
            <span className="font-semibold text-sky-800">
              {item.proposedQuantity ?? item.proposed_quantity} {item.unit}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function PreOrderDetailPanel({
  detail,
  audience = "buyer",
  emptyMessage = "Chọn một yêu cầu để xem chi tiết.",
  loading = false,
  children,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-neutral-500">
        Đang tải chi tiết...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 p-8 text-center text-sm text-neutral-500">
        {emptyMessage}
      </div>
    );
  }

  const requestCode = detail.requestCode ?? detail.request_code;
  const items = detail.items ?? [];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              Mã yêu cầu
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-950">{requestCode}</p>
          </div>
          <PreOrderStatusBadge status={detail.status} audience={audience} />
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        <MetaBlock
          icon={CalendarClock}
          label="Giao dự kiến"
          value={formatPreOrderDateTime(
            detail.requestedDeliveryTime ?? detail.requested_delivery_time,
          )}
        />
        {detail.proposedDeliveryTime ?? detail.proposed_delivery_time ? (
          <MetaBlock
            icon={CalendarClock}
            label="Ngày giao đề xuất"
            value={formatPreOrderDateTime(
              detail.proposedDeliveryTime ?? detail.proposed_delivery_time,
            )}
          />
        ) : null}
        {detail.confirmedDeliveryTime ?? detail.confirmed_delivery_time ? (
          <MetaBlock
            icon={CalendarClock}
            label="Ngày giao đã chốt"
            value={formatPreOrderDateTime(
              detail.confirmedDeliveryTime ?? detail.confirmed_delivery_time,
            )}
          />
        ) : null}

        {(detail.receiverName ?? detail.receiver_name) ? (
          <MetaBlock
            icon={User}
            label="Người nhận"
            value={detail.receiverName ?? detail.receiver_name}
          />
        ) : null}
        {(detail.receiverPhone ?? detail.receiver_phone) ? (
          <MetaBlock
            icon={Phone}
            label="Số điện thoại"
            value={detail.receiverPhone ?? detail.receiver_phone}
          />
        ) : null}
        {(detail.deliveryAddress ?? detail.delivery_address) ? (
          <MetaBlock
            icon={MapPin}
            label="Địa chỉ giao"
            value={detail.deliveryAddress ?? detail.delivery_address}
          />
        ) : null}

        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Sản phẩm
          </p>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>

        {detail.dealerNote ?? detail.dealer_note ? (
          <MetaBlock
            icon={MessageSquare}
            label="Ghi chú đại lý"
            value={detail.dealerNote ?? detail.dealer_note}
          />
        ) : null}

        {detail.rejectReason ?? detail.reject_reason ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500">
              Lý do từ chối
            </p>
            <p className="mt-1">{detail.rejectReason ?? detail.reject_reason}</p>
          </div>
        ) : null}

        {children ? <div className="border-t border-stone-100 pt-4">{children}</div> : null}
      </div>
    </div>
  );
}
