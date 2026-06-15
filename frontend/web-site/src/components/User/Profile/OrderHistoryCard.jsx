import OrderStatusBadge from "../OrderStatus/OrderStatusBadge";
import { formatCurrency } from "../../../utils/userOrderUtils";

export default function OrderHistoryCard({ order, onViewDetail }) {
    const itemSummary =
        order.itemCount > 1
            ? `${order.previewTitle} • ${order.itemCount} sản phẩm`
            : order.previewTitle;

    return (
        <article className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <img
                    src={order.previewImage || "https://placehold.co/56x56"}
                    alt={order.previewTitle}
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                />

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-neutral-500">
                            {order.orderCode}
                        </span>
                        <OrderStatusBadge
                            label={order.statusLabel}
                            tone={order.statusTone}
                            compact
                        />
                    </div>
                    <p className="mt-0.5 truncate text-sm font-semibold text-emerald-950">
                        {order.dealerName}
                    </p>
                    <p className="text-xs text-stone-400">{order.orderedAt}</p>
                    <p className="mt-1 truncate text-xs text-neutral-600">{itemSummary}</p>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className="text-sm font-semibold text-teal-800">
                        {formatCurrency(order.total)}
                    </span>
                    <button
                        type="button"
                        onClick={() => onViewDetail(order)}
                        className="rounded-md bg-teal-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-900"
                    >
                        Xem chi tiết
                    </button>
                </div>
            </div>
        </article>
    );
}
