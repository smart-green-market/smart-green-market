import { useState, useEffect } from "react";
import { ShoppingCart, Plus, CheckCircle2, Truck, Printer, Package } from "lucide-react";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
import SalesOrderList from "../../../components/Dealer/SalesOrder/SalesOrderList";
import SalesOrderStatsCards from "../../../components/Dealer/SalesOrder/SalesOrderStatsCards";
import CreateSalesOrderModal from "../../../components/Dealer/SalesOrder/CreateSalesOrderModal";
import SalesOrderDetailPanel from "../../../components/Dealer/SalesOrder/SalesOrderDetailPanel";
import PrintInvoiceModal from "../../../components/Dealer/SalesOrder/PrintInvoiceModal";
import { dealerOrderService } from "../../../services/api/dealerOrderService";

export default function DealerSalesOrderPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [clearSelectedToggle, setClearSelectedToggle] = useState(false);
    
    // Print Modal State
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [ordersToPrint, setOrdersToPrint] = useState([]);

    const [salesOrders, setSalesOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const mapStatusToVietnamese = (status) => {
        switch(status) {
            case "pending": return "Chờ xác nhận";
            case "confirmed": return "Đã xác nhận";
            case "processing": return "Đang chuẩn bị hàng";
            case "shipping": return "Đang giao hàng";
            case "delivered": return "Đã giao";
            case "completed": return "Hoàn tất";
            case "cancelled": return "Đã hủy";
            default: return status || "Chờ xác nhận";
        }
    };

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await dealerOrderService.getAll();
            const results = data.results || (Array.isArray(data) ? data : []);
            
            const formattedOrders = results.map(order => ({
                uniqueId: order.id,
                id: order.order_code,
                customer: order.customer_name,
                address: "Chưa có địa chỉ", 
                date: order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : (order.delivery_date || ""),
                items: `${order.item_count || 1} sản phẩm`,
                amount: new Intl.NumberFormat('vi-VN').format(Number(order.total_amount || 0)) + ' đ',
                payment: order.payment_method,
                delivery: mapStatusToVietnamese(order.status),
                status: mapStatusToVietnamese(order.status),
                originalData: order
            }));
            setSalesOrders(formattedOrders);
        } catch (error) {
            console.error("Lỗi lấy danh sách đơn hàng", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = salesOrders.filter((order) => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.items.toLowerCase().includes(searchQuery.toLowerCase());
        const statusVal = order.status || order.delivery;
        const matchesStatus = statusFilter === "" || statusVal === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filterOptions = [
        { label: "Tất cả trạng thái", value: "", colorClass: "text-neutral-700" },
        { label: "Chờ xác nhận", value: "Chờ xác nhận", colorClass: "text-sky-700" },
        { label: "Đã xác nhận", value: "Đã xác nhận", colorClass: "text-indigo-700" },
        { label: "Đang chuẩn bị", value: "Đang chuẩn bị hàng", colorClass: "text-amber-700" },
        { label: "Đang giao", value: "Đang giao hàng", colorClass: "text-blue-700" },
        { label: "Đã giao", value: "Đã giao", colorClass: "text-emerald-700" },
        { label: "Đã huỷ", value: "Đã hủy", colorClass: "text-red-700" }
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

    const refreshDetailPanel = async (orderId) => {
        try {
            const detail = await dealerOrderService.getById(orderId);
            setSelectedOrder(prev => ({
                ...prev,
                status: mapStatusToVietnamese(detail.status),
                delivery: mapStatusToVietnamese(detail.status),
                originalData: detail
            }));
        } catch {}
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
            <SalesOrderStatsCards salesOrders={salesOrders} />

            {/* Filter */}
            <SupplierFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
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
                    
                    return (
                        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                            <span className="text-sm font-bold text-emerald-800">
                                Đã chọn {selectedRows.length} đơn hàng
                            </span>
                            <div className="flex gap-3">
                                {hasPendingConfirmation && (
                                    <button 
                                        onClick={handleBulkConfirm}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Xác nhận đơn hàng
                                    </button>
                                )}
                                {hasConfirmed && (
                                    <button 
                                        onClick={handleBulkStartProcessing}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                                    >
                                        <Package className="w-4 h-4" /> Chuẩn bị hàng
                                    </button>
                                )}
                                {hasPreparing && (
                                    <button 
                                        onClick={handleBulkDeliver}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                                    >
                                        <Truck className="w-4 h-4" /> Giao hàng
                                    </button>
                                )}
                                <button 
                                    onClick={handleBulkPrint}
                                    className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> In hoá đơn ({selectedRows.length})
                                </button>
                            </div>
                        </div>
                    );
                })()}
                        <SalesOrderList
                            salesOrders={filteredOrders}
                            onViewDetail={handleViewDetail}
                            onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
                            clearSelectedRows={clearSelectedToggle}
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
        </div>
    );
}