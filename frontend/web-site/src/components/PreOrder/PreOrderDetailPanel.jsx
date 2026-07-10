import { CalendarClock, MapPin, MessageSquare, Phone, User } from "lucide-react";
import PreOrderStatusBadge from "./PreOrderStatusBadge";
import { formatPreOrderDateTime } from "../../utils/preorderStatusConfig";

function MetaRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 border-b border-stone-100 py-2.5 last:border-b-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-neutral-800">{value}</p>
      </div>
    </div>
  );
}

function ItemRow({ item }) {
  const hasProposal =
    item.proposedQuantity != null &&
    item.proposedQuantity !== item.requestedQuantity;

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2.5">
      <p className="text-sm font-semibold text-emerald-950">
        {item.productTitle ?? item.product_title}
      </p>
      <div className="mt-1.5 grid gap-1 text-xs text-neutral-600 sm:grid-cols-3">
        <p>
          Yêu cầu:{" "}
          <span className="font-semibold text-neutral-800">
            {item.requestedQuantity ?? item.requested_quantity} {item.unit}
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
            Đề xuất:{" "}
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
      <div className="flex h-full min-h-[360px] items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/40 text-sm text-neutral-500">
        Đang tải chi tiết...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/40 px-6 text-center text-sm text-neutral-500">
        {emptyMessage}
      </div>
    );
  }

  const requestCode = detail.requestCode ?? detail.request_code;
  const items = detail.items ?? [];

  return (
    <div className="flex h-full flex-col rounded-xl border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs text-neutral-500">Mã yêu cầu</p>
          <p className="truncate text-lg font-bold text-emerald-950">{requestCode}</p>
        </div>
        <PreOrderStatusBadge status={detail.status} audience={audience} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
        <div className="rounded-xl border border-stone-100 bg-stone-50/40 px-4 py-1">
          <MetaRow
            icon={CalendarClock}
            label="Giao dự kiến"
            value={formatPreOrderDateTime(
              detail.requestedDeliveryTime ?? detail.requested_delivery_time,
            )}
          />
          {detail.proposedDeliveryTime ?? detail.proposed_delivery_time ? (
            <MetaRow
              icon={CalendarClock}
              label="Ngày giao đề xuất"
              value={formatPreOrderDateTime(
                detail.proposedDeliveryTime ?? detail.proposed_delivery_time,
              )}
            />
          ) : null}
          {detail.confirmedDeliveryTime ?? detail.confirmed_delivery_time ? (
            <MetaRow
              icon={CalendarClock}
              label="Ngày giao đã chốt"
              value={formatPreOrderDateTime(
                detail.confirmedDeliveryTime ?? detail.confirmed_delivery_time,
              )}
            />
          ) : null}
          {(detail.receiverName ?? detail.receiver_name) ? (
            <MetaRow
              icon={User}
              label="Người nhận"
              value={detail.receiverName ?? detail.receiver_name}
            />
          ) : null}
          {(detail.receiverPhone ?? detail.receiver_phone) ? (
            <MetaRow
              icon={Phone}
              label="Số điện thoại"
              value={detail.receiverPhone ?? detail.receiver_phone}
            />
          ) : null}
          {(detail.deliveryAddress ?? detail.delivery_address) ? (
            <MetaRow
              icon={MapPin}
              label="Địa chỉ giao"
              value={detail.deliveryAddress ?? detail.delivery_address}
            />
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Sản phẩm
          </p>
          <div className="space-y-2">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>

        {detail.dealerNote ?? detail.dealer_note ? (
          <div className="rounded-lg border border-stone-100 bg-stone-50/40 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs text-neutral-500">
              <MessageSquare className="h-3.5 w-3.5" />
              Ghi chú đại lý
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              {detail.dealerNote ?? detail.dealer_note}
            </p>
          </div>
        ) : null}

        {detail.rejectReason ?? detail.reject_reason ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <p className="text-xs font-semibold text-red-500">Lý do từ chối</p>
            <p className="mt-1">{detail.rejectReason ?? detail.reject_reason}</p>
          </div>
        ) : null}

        {children ? (
          <div className="border-t border-stone-100 pt-4">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
