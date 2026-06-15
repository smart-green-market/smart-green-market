import { useEffect, useMemo, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Loader2,
} from "lucide-react";
import OrderHistoryCard from "../../../components/User/Profile/OrderHistoryCard";
import OrderDetailModal from "../../../components/User/Order/OrderDetailModal";
import { useUserOrders } from "../../../hooks/useUserOrders";

const PAGE_SIZE = 3;

const FILTERS = [
    { key: "all", label: "Tất cả" },
    { key: "active", label: "Đang xử lý" },
    { key: "completed", label: "Hoàn thành" },
    { key: "cancelled", label: "Đã hủy" },
];

export default function OrderHistoryPage() {
    const { orders, loading, error } = useUserOrders();
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const filteredOrders = useMemo(() => {
        if (filter === "all") return orders;
        if (filter === "active") {
            return orders.filter((order) =>
                ["received", "preparing", "shipping"].includes(order.status),
            );
        }
        if (filter === "completed") {
            return orders.filter((order) => order.status === "completed");
        }
        return orders.filter((order) => order.status === "cancelled");
    }, [orders, filter]);

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

    const pageOrders = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredOrders.slice(start, start + PAGE_SIZE);
    }, [filteredOrders, page]);

    useEffect(() => {
        setPage(1);
    }, [filter]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    return (
        <div className="space-y-5">
            <section className="rounded-xl bg-white p-6 shadow-sm outline outline-1 outline-zinc-100">
                <h2 className="text-xl font-semibold text-emerald-950">Lịch sử đơn hàng</h2>
                <p className="mt-1.5 text-sm text-neutral-600">
                    Theo dõi và xem lại các đơn hàng bạn đã đặt trên GreenMarket.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                    {FILTERS.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setFilter(item.key)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                filter === item.key
                                    ? "bg-emerald-200 text-teal-900"
                                    : "bg-zinc-100 text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </section>

            {loading ? (
                <div className="flex h-32 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
                </div>
            ) : error ? (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
                    {error}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-stone-300 bg-white px-4 py-12 text-center text-sm text-neutral-500">
                    Không có đơn hàng nào trong mục này.
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {pageOrders.map((order) => (
                            <OrderHistoryCard
                                key={order.id}
                                order={order}
                                onViewDetail={setSelectedOrder}
                            />
                        ))}
                    </div>

                    {filteredOrders.length > PAGE_SIZE ? (
                        <OrderPagination
                            page={page}
                            totalPages={totalPages}
                            onChange={setPage}
                        />
                    ) : null}
                </>
            )}

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

function OrderPagination({ page, totalPages, onChange }) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex items-center justify-center gap-1 pt-2">
            <PaginationBtn disabled={page === 1} onClick={() => onChange(1)} aria-label="Trang đầu">
                <ChevronsLeft className="h-4 w-4" />
            </PaginationBtn>
            <PaginationBtn
                disabled={page === 1}
                onClick={() => onChange(page - 1)}
                aria-label="Trang trước"
            >
                <ChevronLeft className="h-4 w-4" />
            </PaginationBtn>

            {pages.map((p) => (
                <button
                    key={p}
                    type="button"
                    onClick={() => onChange(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                        p === page
                            ? "bg-emerald-700 text-white"
                            : "text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800"
                    }`}
                >
                    {p}
                </button>
            ))}

            <PaginationBtn
                disabled={page === totalPages}
                onClick={() => onChange(page + 1)}
                aria-label="Trang sau"
            >
                <ChevronRight className="h-4 w-4" />
            </PaginationBtn>
            <PaginationBtn
                disabled={page === totalPages}
                onClick={() => onChange(totalPages)}
                aria-label="Trang cuối"
            >
                <ChevronsRight className="h-4 w-4" />
            </PaginationBtn>
        </div>
    );
}

function PaginationBtn({ disabled, onClick, children, ...props }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
            {...props}
        >
            {children}
        </button>
    );
}
