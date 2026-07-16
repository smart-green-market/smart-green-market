import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Plus, CheckCircle2, Truck, Printer, Package, XCircle } from "lucide-react";
import { toast } from "sonner";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
import SalesOrderList from "../../../components/Dealer/SalesOrder/SalesOrderList";
import SalesOrderStatsCards from "../../../components/Dealer/SalesOrder/SalesOrderStatsCards";
import CreateSalesOrderModal from "../../../components/Dealer/SalesOrder/CreateSalesOrderModal";
import SalesOrderDetailPanel from "../../../components/Dealer/SalesOrder/SalesOrderDetailPanel";
import PrintInvoiceModal from "../../../components/Dealer/SalesOrder/PrintInvoiceModal";
import RejectModal from "../../../components/common/RejectModal";
import ProposeDeliveryRescheduleModal from "../../../components/Dealer/SalesOrder/ProposeDeliveryRescheduleModal";
import { dealerOrderService } from "../../../services/api/dealerOrderService";
import { useOrderRealtimeRefresh } from "../../../hooks/useOrderRealtimeRefresh";
import { ORDER_REFERENCE_TYPES } from "../../../utils/orderRealtimeUtils";

export default function DealerSalesOrderPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [countStatus, setCountStatus] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [clearSelectedToggle, setClearSelectedToggle] = useState(false);

    // Cancel modal state
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [orderToReschedule, setOrderToReschedule] = useState(null);
    const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

    // Return review modal states
    const [isReturnRejectModalOpen, setIsReturnRejectModalOpen] = useState(false);
    const [orderToRejectReturn, setOrderToRejectReturn] = useState(null);

    // Print Modal State
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [ordersToPrint, setOrdersToPrint] = useState([]);

    const [salesOrders, setSalesOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const mapStatusToVietnamese = (status) => {
        switch (status) {
            case "pending": return "Chờ xác nhận";
            case "confirmed": return "Đã xác nhận";
            case "processing": return "Đang chuẩn bị hàng";
            case "shipping": return "Đang giao hàng";
            case "delivered": return "Đã giao";
            case "completed": return "Hoàn tất";
            case "cancelled": return "Đã hủy";
            case "return_requested": return "Yêu cầu trả hàng";
            case "returned": return "Đã trả hàng";
            case "waiting_stock": return "Chờ hàng về kho";
            case "delivery_reschedule_proposed": return "Chờ xác nhận đổi ngày giao";
            default: return status || "Chờ xác nhận";
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (debouncedSearchQuery !== searchQuery) {
                setDebouncedSearchQuery(searchQuery);
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, debouncedSearchQuery]);

    const fetchOrders = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setIsLoading(true);
        try {
            const data = await dealerOrderService.getAll({ page: currentPage, page_size: 10, search: debouncedSearchQuery, status: statusFilter });
            const results = data.results || (Array.isArray(data) ? data : []);
            setTotalPages(Math.max(1, Math.ceil((data.count || results.length) / 10)));

            const formattedOrders = results.map(order => ({
                uniqueId: order.id,
                id: order.order_code,
                customer: order.customer_name,
                address: "Chưa có địa chỉ",
                date: order.delivery_time,
                items: `${order.item_count || 1} sản phẩm`,
                amount: new Intl.NumberFormat('vi-VN').format(Number(order.total_amount || 0)) + ' đ',
                payment: order.payment_method,
                delivery: mapStatusToVietnamese(order.status),
                status: mapStatusToVietnamese(order.status),
                originalData: order
            }));
            setSalesOrders(formattedOrders);

            if (data.count_status) {
                setCountStatus(data.count_status);
            } else {
                setCountStatus(null);
            }

            const count = data.count || 0;
            if (statusFilter === "") {
                setTotalCount(count);
            } else if (data.count_status) {
                setTotalCount(Object.values(data.count_status).reduce((sum, val) => sum + (val || 0), 0));
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách đơn hàng", error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [currentPage, debouncedSearchQuery, statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const refreshDetailPanel = useCallback(async (orderId) => {
        try {
            const detail = await dealerOrderService.getById(orderId);
            setSelectedOrder(prev => {
                if (!prev || prev.originalData?.id !== orderId) return prev;
                return {
                    ...prev,
                    status: mapStatusToVietnamese(detail.status),
                    delivery: mapStatusToVietnamese(detail.status),
                    originalData: detail
                };
            });
        } catch { /* ignore */ }
    }, []);

    useOrderRealtimeRefresh({
        referenceTypes: [ORDER_REFERENCE_TYPES.CUSTOMER_ORDER],
        watchOrderId: selectedOrder?.originalData?.id ?? null,
        onRefresh: () => fetchOrders({ silent: true }),
        onDetailRefresh: (parsed) => refreshDetailPanel(parsed.referenceId),
    });

    const filteredOrders = salesOrders; // Nếu backend đã filter thì bỏ qua. Nhưng tạm giữ lại data trả về. (Đã pass search param cho API)

    const filterOptions = [
        { label: "Tất cả trạng thái", value: "", colorClass: "text-neutral-700" },
        { label: "Chờ xác nhận", value: "pending", colorClass: "text-sky-700" },
        { label: "Đã xác nhận", value: "confirmed", colorClass: "text-indigo-700" },
        { label: "Đang chuẩn bị", value: "processing", colorClass: "text-amber-700" },
        { label: "Chờ hàng về kho", value: "waiting_stock", colorClass: "text-orange-700" },
        { label: "Chờ xác nhận đổi ngày giao", value: "delivery_reschedule_proposed", colorClass: "text-violet-700" },
        { label: "Đang giao", value: "shipping", colorClass: "text-blue-700" },
        { label: "Đã giao", value: "delivered", colorClass: "text-emerald-700" },
        { label: "Yêu cầu trả hàng", value: "return_requested", colorClass: "text-rose-700" },
        { label: "Đã trả hàng", value: "returned", colorClass: "text-red-700" },
        { label: "Hoàn tất", value: "completed", colorClass: "text-teal-700" },
        { label: "Đã huỷ", value: "cancelled", colorClass: "text-red-700" }
    ];

    const handleViewDetail = async (order) => {
        try {
            const detail = await dealerOrderService.getById(order.originalData.id);
            setSelectedOrder({
                ...order,
                originalData: detail
            });
        } catch (error) {
            console.error("Lỗi lấy chi tiết đơn hàng", error);
            setSelectedOrder(order);
        }
    };

    const handleBulkConfirm = async () => {
        try {
            const confirmPromises = selectedRows
                .filter(row => row.status === "Chờ xác nhận")
                .map(row => dealerOrderService.confirmOrder(row.originalData.id));

            await Promise.all(confirmPromises);

            await fetchOrders();
            setClearSelectedToggle(!clearSelectedToggle);
            setSelectedRows([]);
        } catch (error) {
            console.error("Lỗi khi xác nhận đơn hàng đồng loạt", error);
            alert("Có lỗi xảy ra khi xác nhận đơn hàng");
        }
    };

    const handleSingleConfirm = async (order) => {
        try {
            await dealerOrderService.confirmOrder(order.originalData.id);
            await fetchOrders();
            await refreshDetailPanel(order.originalData.id);
        } catch (error) {
            console.error("Lỗi khi xác nhận đơn hàng", error);
            alert("Có lỗi xảy ra khi xác nhận đơn hàng");
        }
    };

    const handleCancelClick = (order) => {
        setOrderToCancel(order);
        setIsCancelModalOpen(true);
    };

    const handleProposeRescheduleClick = (order) => {
        setOrderToReschedule(order);
        setRescheduleModalOpen(true);
    };

    const handleProposeRescheduleSubmit = async (payload) => {
        if (!orderToReschedule?.originalData?.id) return;
        setRescheduleSubmitting(true);
        try {
            await dealerOrderService.proposeDeliveryReschedule(
                orderToReschedule.originalData.id,
                payload,
            );
            toast.success("Đã gửi đề xuất đổi ngày giao");
            setRescheduleModalOpen(false);
            setOrderToReschedule(null);
            await fetchOrders();
            await refreshDetailPanel(orderToReschedule.originalData.id);
        } catch (error) {
            toast.error(error?.response?.data?.detail || "Không thể gửi đề xuất đổi ngày giao");
            throw error;
        } finally {
            setRescheduleSubmitting(false);
        }
    };

    const handleBulkCancelClick = () => {
        setOrderToCancel(null);
        setIsCancelModalOpen(true);
    };

    const handleCancelOrderConfirm = async (reason) => {
        try {
            if (orderToCancel) {
                // Hủy đơn lẻ
                await dealerOrderService.cancelOrder(orderToCancel.originalData.id, { reason });
                toast.success(`Đã hủy đơn hàng ${orderToCancel.id} thành công!`);
                await fetchOrders();
                await refreshDetailPanel(orderToCancel.originalData.id);
            } else {
                // Hủy hàng loạt
                const cancelableRows = selectedRows.filter(row => {
                    const status = row.status || row.delivery;
                    return status === "Chờ xác nhận" || status === "Đã xác nhận" || status === "Đang chuẩn bị hàng";
                });

                const cancelPromises = cancelableRows.map(row =>
                    dealerOrderService.cancelOrder(row.originalData.id, { reason })
                );

                await Promise.all(cancelPromises);
                toast.success(`Đã hủy thành công ${cancelableRows.length} đơn hàng!`);
                await fetchOrders();
                setClearSelectedToggle(!clearSelectedToggle);
                setSelectedRows([]);

                if (selectedOrder) {
                    const wasCancelled = cancelableRows.some(row => row.originalData.id === selectedOrder.originalData.id);
                    if (wasCancelled) {
                        await refreshDetailPanel(selectedOrder.originalData.id);
                    }
                }
            }
        } catch (error) {
            console.error("Lỗi khi hủy đơn hàng:", error);
            const errMsg = error.response?.data?.detail || "Không thể hủy đơn hàng.";
            toast.error(errMsg);
            throw error;
        }
    };

    const handleStartProcessing = async (order) => {
        try {
            await dealerOrderService.startProcessing(order.originalData.id);
            await fetchOrders();
            await refreshDetailPanel(order.originalData.id);
        } catch (error) {
            console.error("Lỗi khi chuyển trạng thái đang chuẩn bị hàng", error);
            alert("Có lỗi xảy ra khi chuyển trạng thái");
        }
    };

    const handleShipOrder = async (order) => {
        try {
            await dealerOrderService.shipOrder(order.originalData.id);
            await fetchOrders();
            await refreshDetailPanel(order.originalData.id);
        } catch (error) {
            console.error("Lỗi khi chuyển trạng thái giao hàng", error);
            alert("Có lỗi xảy ra khi chuyển trạng thái giao hàng");
        }
    };

    const handleBulkStartProcessing = async () => {
        try {
            const processPromises = selectedRows
                .filter(row => row.status === "Đã xác nhận")
                .map(row => dealerOrderService.startProcessing(row.originalData.id));

            await Promise.all(processPromises);

            await fetchOrders();
            setClearSelectedToggle(!clearSelectedToggle);
            setSelectedRows([]);
        } catch (error) {
            console.error("Lỗi khi chuẩn bị hàng đồng loạt", error);
            alert("Có lỗi xảy ra khi chuyển trạng thái chuẩn bị hàng");
        }
    };

    const handleBulkDeliver = async () => {
        try {
            const shipPromises = selectedRows
                .filter(row => row.status === "Đang chuẩn bị hàng")
                .map(row => dealerOrderService.shipOrder(row.originalData.id));

            await Promise.all(shipPromises);

            await fetchOrders();
            setClearSelectedToggle(!clearSelectedToggle);
            setSelectedRows([]);
        } catch (error) {
            console.error("Lỗi khi giao hàng đồng loạt", error);
            alert("Có lỗi xảy ra khi bắt đầu giao hàng đồng loạt");
        }
    };

    const handleApproveReturn = async (order) => {
        const orderId = order.originalData.id;
        const returnId = order.originalData.return_summary?.pending_return_id;
        if (!returnId) {
            toast.error("Không tìm thấy ID yêu cầu trả hàng.");
            return;
        }

        if (!window.confirm(`Bạn có chắc chắn muốn duyệt yêu cầu trả hàng cho đơn hàng ${order.id}?`)) {
            return;
        }

        try {
            await dealerOrderService.reviewReturn(orderId, returnId, { approved: true, review_note: "Đồng ý trả hàng" });
            toast.success("Đã duyệt yêu cầu trả hàng thành công!");
            await fetchOrders();
            await refreshDetailPanel(orderId);
        } catch (error) {
            console.error("Lỗi khi duyệt yêu cầu trả hàng:", error);
            const errMsg = error.response?.data?.detail || "Duyệt yêu cầu thất bại.";
            toast.error(errMsg);
        }
    };

    const handleRejectReturnClick = (order) => {
        setOrderToRejectReturn(order);
        setIsReturnRejectModalOpen(true);
    };

    const handleRejectReturnConfirm = async (reason) => {
        if (!orderToRejectReturn) return;
        const orderId = orderToRejectReturn.originalData.id;
        const returnId = orderToRejectReturn.originalData.return_summary?.pending_return_id;
        if (!returnId) {
            toast.error("Không tìm thấy ID yêu cầu trả hàng.");
            return;
        }

        try {
            await dealerOrderService.reviewReturn(orderId, returnId, { approved: false, review_note: reason });
            toast.success("Đã từ chối yêu cầu trả hàng thành công!");
            setIsReturnRejectModalOpen(false);
            setOrderToRejectReturn(null);
            await fetchOrders();
            await refreshDetailPanel(orderId);
        } catch (error) {
            console.error("Lỗi khi từ chối yêu cầu trả hàng:", error);
            const errors = error.response?.data;
            if (errors && typeof errors === 'object') {
                const errorMsg = Object.entries(errors)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join('\n');
                toast.error(errorMsg || 'Lỗi khi xử lý từ chối trả hàng');
            } else {
                toast.error('Lỗi khi xử lý từ chối trả hàng. Vui lòng thử lại.');
            }
            throw error;
        }
    };

    const handleBulkPrint = () => {
        setOrdersToPrint(selectedRows);
        setIsPrintModalOpen(true);
    };

    const handleSinglePrint = (order) => {
        setOrdersToPrint([order]);
        setIsPrintModalOpen(true);
    };

    return (
        <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-emerald-600" /> Quản Lý Đơn Bán Hàng
                    </h1>
                    <p className="text-sm text-emerald-800/70 mt-1">
                        Theo dõi danh sách khách hàng đặt mua nông sản sỉ/lẻ từ đại lý của bạn.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 cursor-pointer self-start sm:self-auto">
                    <Plus className="w-4 h-4" /> Tạo đơn bán mới
                </button>
            </div>

            {/* Stats Cards */}
            <SalesOrderStatsCards
                salesOrders={salesOrders}
                activeFilter={statusFilter}
                onFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                countStatus={countStatus}
                totalCount={totalCount}
            />

            {/* Filter */}
            <SupplierFilter
                searchQuery={searchQuery}
                onSearchChange={(val) => setSearchQuery(val)}
                statusFilter={statusFilter}
                onStatusChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                filterOptions={filterOptions}
                placeholder="Tìm kiếm đơn bán hàng (Mã đơn, Khách hàng...)"
            />

            {/* Orders list & Detail Panel */}
            <div className="relative">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                ) : (
                    <>
                        {selectedRows.length > 0 && (() => {
                            const hasPendingConfirmation = selectedRows.some(r => (r.status || r.delivery) === "Chờ xác nhận");
                            const hasConfirmed = selectedRows.some(r => (r.status || r.delivery) === "Đã xác nhận");
                            const hasPreparing = selectedRows.some(r => (r.status || r.delivery) === "Đang chuẩn bị hàng");
                            const hasCancelable = selectedRows.some(r => {
                                const st = r.status || r.delivery;
                                return st === "Chờ xác nhận" || st === "Đã xác nhận" || st === "Đang chuẩn bị hàng" || st === "Chờ hàng về kho";
                            });
                            const canPrint = selectedRows.every(r => (r.status || r.delivery) !== "Đã hủy");

                            return (
                                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4">
                                    <span className="text-sm font-bold text-emerald-800">
                                        Đã chọn {selectedRows.length} đơn hàng
                                    </span>
                                    <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
                                        {hasPendingConfirmation && (
                                            <button
                                                onClick={handleBulkConfirm}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> Xác nhận đơn hàng
                                            </button>
                                        )}
                                        {hasConfirmed && (
                                            <button
                                                onClick={handleBulkStartProcessing}
                                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                                            >
                                                <Package className="w-4 h-4" /> Chuẩn bị hàng
                                            </button>
                                        )}
                                        {hasPreparing && (
                                            <button
                                                onClick={handleBulkDeliver}
                                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                                            >
                                                <Truck className="w-4 h-4" /> Giao hàng
                                            </button>
                                        )}
                                        {hasCancelable && (
                                            <button
                                                onClick={handleBulkCancelClick}
                                                className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                                            >
                                                <XCircle className="w-4 h-4" /> Hủy đơn hàng
                                            </button>
                                        )}
                                        {canPrint && (
                                            <button
                                                onClick={handleBulkPrint}
                                                className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                                            >
                                                <Printer className="w-4 h-4" /> In hoá đơn ({selectedRows.length})
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                        <SalesOrderList
                            salesOrders={filteredOrders}
                            onViewDetail={handleViewDetail}
                            onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
                            clearSelectedRows={clearSelectedToggle}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>

            {/* Overlay Detail Panel */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedOrder(null)}
                    ></div>
                    <div className="relative w-full max-w-md h-[90vh] max-h-[800px]">
                        <SalesOrderDetailPanel
                            order={selectedOrder}
                            onClose={() => setSelectedOrder(null)}
                            onPrint={handleSinglePrint}
                            onConfirm={handleSingleConfirm}
                            onStartProcessing={handleStartProcessing}
                            onShipOrder={handleShipOrder}
                            onCancel={handleCancelClick}
                            onProposeReschedule={handleProposeRescheduleClick}
                            onApproveReturn={handleApproveReturn}
                            onRejectReturn={handleRejectReturnClick}
                        />
                    </div>
                </div>
            )}

            <CreateSalesOrderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <PrintInvoiceModal
                isOpen={isPrintModalOpen}
                orders={ordersToPrint}
                onClose={() => setIsPrintModalOpen(false)}
            />

            <ProposeDeliveryRescheduleModal
                open={rescheduleModalOpen}
                submitting={rescheduleSubmitting}
                onClose={() => {
                    if (!rescheduleSubmitting) {
                        setRescheduleModalOpen(false);
                        setOrderToReschedule(null);
                    }
                }}
                onSubmit={handleProposeRescheduleSubmit}
            />

            <RejectModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleCancelOrderConfirm}
                title={orderToCancel ? "Hủy đơn hàng" : "Hủy hàng loạt đơn hàng"}
                message={orderToCancel
                    ? `Bạn có chắc chắn muốn hủy đơn hàng ${orderToCancel.id} không?`
                    : `Bạn có chắc chắn muốn hủy ${selectedRows.filter(row => {
                        const st = row.status || row.delivery;
                        return st === "Chờ xác nhận" || st === "Đã xác nhận" || st === "Đang chuẩn bị hàng";
                    }).length} đơn hàng đang chọn không?`
                }
                confirmText="Hủy đơn"
                cancelText="Đóng"
                reasonLabel="Lý do hủy"
                reasonPlaceholder="Nhập lý do hủy đơn..."
                reasonRequiredMessage="Vui lòng nhập lý do hủy đơn."
                showToast={false}
            />

            <RejectModal
                isOpen={isReturnRejectModalOpen}
                onClose={() => setIsReturnRejectModalOpen(false)}
                onConfirm={handleRejectReturnConfirm}
                title="Từ chối yêu cầu trả hàng"
                message={orderToRejectReturn ? `Bạn có chắc chắn muốn từ chối yêu cầu trả hàng cho đơn hàng ${orderToRejectReturn.id} không?` : ""}
                confirmText="Từ chối"
                cancelText="Đóng"
                reasonLabel="Lý do từ chối"
                reasonPlaceholder="Nhập lý do từ chối trả hàng..."
                reasonRequiredMessage="Vui lòng nhập lý do từ chối."
                showToast={false}
            />
        </div>
    );
}