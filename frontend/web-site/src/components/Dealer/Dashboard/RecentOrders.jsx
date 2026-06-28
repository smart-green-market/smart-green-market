import { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { dealerCustumerOrder } from "../../../services/api/dealerCustumerOrder";
import { formatCurrency, formatDate } from "./utils";

export default function RecentOrders({ initialOrders = [], initialParams = {} }) {
    const [orders, setOrders] = useState(initialOrders);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);

    const pageSize = initialParams.page_size || 5;

    const fetchOrders = useCallback(async (targetPage) => {
        try {
            setLoading(true);
            const res = await dealerCustumerOrder.getAll({
                ...initialParams,
                page: targetPage,
                page_size: pageSize,
            });
            const results = res.results || res;
            setOrders(Array.isArray(results) ? results : []);
            setPage(res.page || targetPage);
            setTotalCount(res.count || 0);
            setHasMore(res.has_more || false);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }, [initialParams, pageSize]);

    // Fetch on mount
    useEffect(() => {
        fetchOrders(1);
    }, [fetchOrders]);

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return (
        <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-emerald-950">Đơn hàng gần nhất</h2>
                    <p className="text-xs text-neutral-400">Các giao dịch phân phối mới nhất</p>
                </div>
                <button className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-0.5 cursor-pointer">
                    Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-100">
                            <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase">Mã đơn</th>
                            <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase">Khách hàng</th>
                            <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase">Sản phẩm</th>
                            <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase">Tổng tiền</th>
                            <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase text-center">Trạng thái</th>
                            <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase text-right">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="py-6 text-center text-sm text-neutral-400">Đang tải...</td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-4 text-center text-sm text-neutral-400">Không có đơn hàng nào</td>
                            </tr>
                        ) : (
                            orders.map((order, idx) => (
                                <tr key={order.id || idx} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                                    <td className="py-3.5 px-4 text-xs font-bold text-emerald-800">{order.order_code || `DH-${order.id}`}</td>
                                    <td className="py-3.5 px-4 text-xs font-semibold text-neutral-800">{order.customer_name}</td>
                                    <td className="py-3.5 px-4 text-xs text-neutral-600 truncate max-w-[200px]">
                                        {order.item_count + " sản phẩm"}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs font-bold text-neutral-800">{formatCurrency(order.total_amount)}</td>
                                    <td className="py-3.5 px-4 text-center">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${['delivered', 'completed'].includes(order.status) ? "bg-emerald-100 text-emerald-800" :
                                            order.status === "pending" ? "bg-amber-100 text-amber-800" :
                                                order.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                                            }`}>
                                            {order.status === 'pending' ? 'Chờ xác nhận' :
                                                order.status === 'confirmed' ? 'Đã xác nhận' :
                                                    order.status === 'processing' ? 'Đang chuẩn bị' :
                                                        order.status === 'shipping' ? 'Đang giao' :
                                                            order.status === 'delivered' ? 'Đã giao' :
                                                                order.status === 'completed' ? 'Hoàn tất' : 'Đã hủy'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-neutral-400 text-right">{formatDate(order.created_at)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalCount > pageSize && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                    <span className="text-xs text-neutral-400">
                        Trang {page}/{totalPages} · {totalCount} đơn hàng
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchOrders(page - 1)}
                            disabled={page <= 1 || loading}
                            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => fetchOrders(page + 1)}
                            disabled={!hasMore || loading}
                            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
