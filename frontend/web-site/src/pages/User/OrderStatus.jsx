import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import ActiveOrderCard from "../../components/User/OrderStatus/ActiveOrderCard";
import CompletedOrderCard from "../../components/User/OrderStatus/CompletedOrderCard";
import {
    toActiveOrderCard,
    toCompletedOrderCard,
} from "../../components/User/OrderStatus/orderStatusAdapters";
import OrderDetailModal from "../../components/User/Order/OrderDetailModal";
import { useUserOrders } from "../../hooks/useUserOrders";

export default function OrderStatusPage() {
    const { orders, loading, error } = useUserOrders();
    const [selectedOrder, setSelectedOrder] = useState(null);

    const activeOrders = useMemo(
        () =>
            orders
                .filter((order) =>
                    ["received", "preparing", "shipping"].includes(order.status),
                )
                .map(toActiveOrderCard),
        [orders],
    );

    const completedOrders = useMemo(
        () =>
            orders
                .filter((order) => order.status === "completed")
                .map(toCompletedOrderCard),
        [orders],
    );

    return (
        <div className="mx-auto w-full max-w-[896px] px-4 pb-20 pt-8 sm:px-0">
            <section className="space-y-8">
                <div>
                    <h1 className="text-3xl font-semibold text-emerald-950">Đơn hàng của bạn</h1>
                    <p className="text-base text-neutral-700">
                        Quản lý và theo dõi lộ trình nông sản từ trang trại đến bàn ăn.
                    </p>
                </div>

                {loading ? (
                    <div className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
                        {error}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {activeOrders.length > 0 ? (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-emerald-950">
                                    Đang xử lý
                                </h2>
                                {activeOrders.map((order) => (
                                    <ActiveOrderCard
                                        key={order.sourceOrder.id}
                                        order={order}
                                        onViewDetail={setSelectedOrder}
                                    />
                                ))}
                            </div>
                        ) : null}

                        {completedOrders.length > 0 ? (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-emerald-950">
                                    Đã hoàn thành
                                </h2>
                                {completedOrders.map((order) => (
                                    <CompletedOrderCard
                                        key={order.sourceOrder.id}
                                        order={order}
                                        onViewDetail={setSelectedOrder}
                                    />
                                ))}
                            </div>
                        ) : null}

                        {activeOrders.length === 0 && completedOrders.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-sm text-neutral-500">
                                Chưa có đơn hàng để theo dõi.
                            </div>
                        ) : null}
                    </div>
                )}
            </section>

            {selectedOrder ? (
                <OrderDetailModal
                    orderId={selectedOrder.id}
                    fallbackOrder={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            ) : null}
        </div>
    );
}
