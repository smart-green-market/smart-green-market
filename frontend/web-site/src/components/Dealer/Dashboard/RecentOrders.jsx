import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { dealerCustumerOrder } from "../../../services/api/dealerCustumerOrder";
import { formatCurrency, formatDate } from "./utils";
import SortableHeader from "../../common/SortableHeader";
import useTableSort from "../../../hooks/useTableSort";

const COLUMN_CONFIG = {
    order_code: { key: "order_code", type: "string" },
    customer_name: { key: "customer_name", type: "string" },
    total_amount: { key: "total_amount", type: "number" },
    status: { key: "status", type: "string" },
    created_at: { key: "created_at", type: "date" }
};

export default function RecentOrders({ initialOrders = [], initialParams = {} }) {
    const navigate = useNavigate();
    const [orders, setOrders] = useState(initialOrders);
    const [selectedOrders, setSelectedOrders] = useState([]);
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

    const handleBulkConfirm = async () => {
        const pendingOrderIds = orders
            .filter(o => selectedOrders.includes(o.id) && o.status === 'pending')
            .map(o => o.id);

        if (pendingOrderIds.length === 0) return;

        try {
            setLoading(true);
            const confirmPromises = pendingOrderIds.map(id => dealerCustumerOrder.Confirmed(id));
            await Promise.all(confirmPromises);

            await fetchOrders(page);
            setSelectedOrders([]);
        } catch (error) {
            console.error("Lỗi xác nhận đơn hàng:", error);
            alert("Có lỗi xảy ra khi xác nhận đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchOrders(1);
    }, [fetchOrders]);

    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const { sortedData, sortColumn, sortDirection, handleSort } = useTableSort(orders, COLUMN_CONFIG);

    return (
        <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-emerald-950">Đơn hàng gần nhất</h2>
                    <p className="text-xs text-neutral-400">Các giao dịch phân phối mới nhất</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedOrders.length > 0 && orders.some(o => selectedOrders.includes(o.id) && o.status === 'pending') && (
                        <button
                            onClick={handleBulkConfirm}
                            disabled={loading}
                            className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Xác nhận ({orders.filter(o => selectedOrders.includes(o.id) && o.status === 'pending').length})
                        </button>
                    )}
                    <button 
                        onClick={() => navigate('/dai-ly/ban-hang')}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                        Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-100">
                            <th className="py-4 px-6 text-left w-12">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    checked={sortedData.length > 0 && selectedOrders.length === sortedData.length}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedOrders(sortedData.map(o => o.id));
                                        } else {
                                            setSelectedOrders([]);
                                        }
                                    }}
                                />
                            </th>
                            <SortableHeader column="order_code" label="Mã đơn" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader column="customer_name" label="Khách hàng" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                            <th className="py-4 px-6 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-left">Sản phẩm</th>
                            <SortableHeader column="total_amount" label="Tổng tiền" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader column="status" label="Trạng thái" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="center" />
                            <SortableHeader column="created_at" label="Thời gian" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="right" />
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="py-6 text-center text-sm text-neutral-400">Đang tải...</td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="py-4 text-center text-sm text-neutral-400">Không có đơn hàng nào</td>
                            </tr>
                        ) : (
                            sortedData.map((order, idx) => (
                                <tr key={order.id || idx} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                                    <td className="py-3.5 px-6">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                            checked={selectedOrders.includes(order.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedOrders(prev => [...prev, order.id]);
                                                } else {
                                                    setSelectedOrders(prev => prev.filter(id => id !== order.id));
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="py-3.5 px-6 text-xs font-bold text-emerald-800">{order.order_code || `DH-${order.id}`}</td>
                                    <td className="py-3.5 px-6 text-xs font-semibold text-neutral-800">{order.customer_name}</td>
                                    <td className="py-3.5 px-6 text-xs text-neutral-600 truncate max-w-[200px]">
                                        {order.item_count + " sản phẩm"}
                                    </td>
                                    <td className="py-3.5 px-6 text-xs font-bold text-neutral-800">{formatCurrency(order.total_amount)}</td>
                                    <td className="py-3.5 px-6 text-center">
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
                                    <td className="py-3.5 px-6 text-xs text-neutral-400 text-right">{formatDate(order.created_at)}</td>
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
