import { useEffect, useState } from "react";
import { Loader2, MapPin, CreditCard, Store, X } from "lucide-react";
import OrderStatusBadge from "../OrderStatus/OrderStatusBadge";
import OrderProgressTracker from "../OrderStatus/OrderProgressTracker";
import { fetchUserOrderById } from "../../../hooks/useUserOrders";
import { formatCurrency } from "../../../utils/userOrderUtils";
import { handleApiError } from "../../../services/api/userOrderService";
import OrderHistory from "./OrderHistory";

function InfoBlock({ icon: Icon, title, children }) {
    return (
        <div className="rounded-xl border border-stone-200 bg-zinc-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-950">
                <Icon className="h-4 w-4 text-teal-800" />
                {title}
            </div>
            <div className="space-y-1 text-sm text-neutral-700">{children}</div>
        </div>
    );
}

export default function OrderDetailModal({ orderId, fallbackOrder, onClose }) {
    const [order, setOrder] = useState(fallbackOrder ?? null);
    const [loading, setLoading] = useState(Boolean(orderId));
    const [error, setError] = useState("");

    useEffect(() => {
        if (!orderId) {
            setOrder(fallbackOrder ?? null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError("");

        fetchUserOrderById(orderId)
            .then((detail) => {
                if (!cancelled) setOrder(detail);
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(handleApiError(err, "Không thể tải chi tiết đơn hàng"));
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [orderId, fallbackOrder]);

    if (!order && !loading) return null;

    const showTracker = ["received", "preparing", "shipping", "completed"].includes(
        order?.status,
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5">
                    <div>
                        <p className="text-sm text-neutral-500">Chi tiết đơn hàng</p>
                        <h2 className="text-2xl font-semibold text-emerald-950">
                            {order?.orderCode ?? "..."}
                        </h2>
                        {order?.orderedAt ? (
                            <p className="mt-1 text-sm text-stone-400">{order.orderedAt}</p>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                        {order ? (
                            <OrderStatusBadge
                                label={order.statusLabel}
                                tone={order.statusTone}
                            />
                        ) : null}
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-full p-2 text-neutral-400 transition-colors hover:bg-zinc-100 hover:text-neutral-700"
                            aria-label="Đóng"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {loading ? (
                        <div className="flex min-h-[240px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
                        </div>
                    ) : error ? (
                        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    ) : order ? (
                        <div className="space-y-6">
                            {showTracker ? (
                                <OrderProgressTracker currentStep={order.currentStep} />
                            ) : null}

                            <div>
                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                                    Sản phẩm
                                </h3>
                                <div className="space-y-3">
                                    {order.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-4 rounded-xl border border-stone-200 p-4"
                                        >
                                            <img
                                                src={
                                                    item.product_thumbnail_url ||
                                                    "https://placehold.co/80x80"
                                                }
                                                alt={item.product_name}
                                                className="h-16 w-16 rounded-lg object-cover"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-zinc-900">
                                                    {item.product_name}
                                                </p>
                                                <p className="text-sm text-neutral-500">
                                                    SL: {item.quantity}
                                                    {item.product_unit
                                                        ? ` • ${item.product_unit}`
                                                        : ""}
                                                </p>
                                                <p className="text-sm text-neutral-500">
                                                    Đơn giá:{" "}
                                                    {formatCurrency(Number(item.unit_price))}
                                                </p>
                                            </div>
                                            <p className="text-base font-semibold text-teal-800">
                                                {formatCurrency(Number(item.subtotal))}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <InfoBlock icon={Store} title="Cửa hàng đại lý">
                                    <p>{order.dealerName}</p>
                                </InfoBlock>

                                <InfoBlock icon={CreditCard} title="Thanh toán">
                                    <p>{order.paymentMethod}</p>
                                </InfoBlock>

                                {order.shippingAddress ? (
                                    <InfoBlock icon={MapPin} title="Giao hàng">
                                        <p className="font-medium text-zinc-900">
                                            {order.shippingAddress.receiver}
                                        </p>
                                        <p>{order.shippingAddress.phone}</p>
                                        <p>{order.shippingAddress.detail}</p>
                                    </InfoBlock>
                                ) : null}
                            </div>

                            {order.note ? (
                                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                    <span className="font-semibold">Ghi chú: </span>
                                    {order.note}
                                </div>
                            ) : null}

                            <div className="rounded-xl bg-zinc-100 px-5 py-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">Tạm tính</span>
                                        <span>{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">Phí giao hàng</span>
                                        <span>
                                            {order.shippingFee === 0
                                                ? "Miễn phí"
                                                : formatCurrency(order.shippingFee)}
                                        </span>
                                    </div>
                                    {order.discount > 0 ? (
                                        <div className="flex justify-between text-teal-800">
                                            <span>Giảm giá</span>
                                            <span>-{formatCurrency(order.discount)}</span>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="mt-4 flex items-end justify-between border-t border-stone-300 pt-4">
                                    <span className="text-base text-zinc-900">Tổng thanh toán</span>
                                    <span className="text-2xl font-semibold text-teal-800">
                                        {formatCurrency(order.total)}
                                    </span>
                                </div>
                            </div>

                            {order.statusHistories?.length ? (
                                <div>
                                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                                        Lịch sử trạng thái
                                    </h3>
                                    <div className="space-y-3">
                                        {order.statusHistories.map((entry, index) => (
                                            <div
                                                key={`${entry.status}-${index}`}
                                                className="flex items-start gap-3 rounded-lg border border-stone-200 px-4 py-3"
                                            >
                                                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-800" />
                                                <div>
                                                    <p className="font-medium text-zinc-900">
                                                        {entry.label}
                                                    </p>
                                                    <p className="text-sm text-neutral-500">
                                                        {entry.atLabel}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <OrderHistory history={order.statusHistories} />
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <div className="border-t border-stone-200 px-6 py-4">
                </div>
            </div>
        </div>
    );
}
