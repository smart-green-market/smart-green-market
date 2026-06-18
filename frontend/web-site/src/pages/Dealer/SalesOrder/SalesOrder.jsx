import { useState } from "react";
import { ShoppingCart, Plus, CheckCircle2, Truck, Printer } from "lucide-react";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
import SalesOrderList from "../../../components/Dealer/SalesOrder/SalesOrderList";
import SalesOrderStatsCards from "../../../components/Dealer/SalesOrder/SalesOrderStatsCards";
import CreateSalesOrderModal from "../../../components/Dealer/SalesOrder/CreateSalesOrderModal";
import SalesOrderDetailPanel from "../../../components/Dealer/SalesOrder/SalesOrderDetailPanel";
import PrintInvoiceModal from "../../../components/Dealer/SalesOrder/PrintInvoiceModal";

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

    const initialSalesOrders = [
        {
            id: "BH-1092",
            customer: "Cửa hàng Rau Sạch Quận 1",
            address: "15 Nguyễn Đình Chiểu, Quận 1, TP.HCM",
            date: "09/06/2026",
            items: "15kg Cải thìa hữu cơ, 10kg Cà chua bi, 5kg Hành lá",
            amount: "1,250,000 đ",
            payment: "Đã thanh toán",
            delivery: "Đã giao",
            status: "Đã giao"
        },
        {
            id: "BH-1091",
            customer: "Siêu thị mini SafeFood",
            address: "42 Lê Lợi, Quận 1, TP.HCM",
            date: "09/06/2026",
            items: "20kg Dâu tây Đà Lạt, 50kg Khoai tây vàng",
            amount: "3,400,000 đ",
            payment: "Chưa thanh toán",
            delivery: "Đang giao hàng",
            status: "Đang giao hàng"
        },
        {
            id: "BH-1093",
            customer: "Quán Ăn Sân Vườn",
            address: "112 Võ Văn Tần, Quận 3, TP.HCM",
            date: "10/06/2026",
            items: "15kg Cải thìa hữu cơ, 10kg Cà chua bi",
            amount: "650,000 đ",
            payment: "Chưa thanh toán",
            delivery: "Chờ xác nhận",
            status: "Chờ xác nhận"
        },
        {
            id: "BH-1094",
            customer: "Cửa hàng Hữu Cơ xanh",
            address: "88 Điện Biên Phủ, Bình Thạnh, TP.HCM",
            date: "10/06/2026",
            items: "20kg Dưa lưới, 10kg Xoài cát",
            amount: "1,150,000 đ",
            payment: "Đã thanh toán",
            delivery: "Đang chuẩn bị hàng",
            status: "Đang chuẩn bị hàng"
        },
        {
            id: "BH-1090",
            customer: "Hợp tác xã xanh Quận 3",
            address: "15 Cống Quỳnh, Quận 1, TP.HCM",
            date: "08/06/2026",
            items: "10kg Nấm đùi gà hữu cơ, 5kg Ngò rí",
            amount: "680,000 đ",
            payment: "Đã thanh toán",
            delivery: "Đã giao"
        },
        {
            id: "BH-1089",
            customer: "Nước ép Healthy Juice",
            address: "223 Nguyễn Trãi, Quận 5, TP.HCM",
            date: "08/06/2026",
            items: "30kg Cần tây Tây Nguyên, 15kg Táo xanh hữu cơ",
            amount: "1,850,000 đ",
            payment: "Đã hủy",
            delivery: "Đã hủy"
        }
    ];

    const [salesOrders, setSalesOrders] = useState(initialSalesOrders);

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
        { label: "Đang chuẩn bị", value: "Đang chuẩn bị hàng", colorClass: "text-indigo-700" },
        { label: "Đang giao", value: "Đang giao hàng", colorClass: "text-amber-700" },
        { label: "Đã giao", value: "Đã giao", colorClass: "text-emerald-700" },
        { label: "Đã huỷ", value: "Đã hủy", colorClass: "text-red-700" }
    ];

    const handleViewDetail = (order) => {
        setSelectedOrder(order);
    };

    const handleBulkConfirm = () => {
        const selectedIds = selectedRows.map(r => r.id);
        setSalesOrders(prev => prev.map(order => {
            if (selectedIds.includes(order.id) && order.status === "Chờ xác nhận") {
                return { ...order, status: "Đang chuẩn bị hàng", delivery: "Đang chuẩn bị hàng" };
            }
            return order;
        }));
        setClearSelectedToggle(!clearSelectedToggle);
        setSelectedRows([]);
    };

    const handleBulkDeliver = () => {
        const selectedIds = selectedRows.map(r => r.id);
        setSalesOrders(prev => prev.map(order => {
            // "Đang chuẩn bị hàng" -> "Đang giao hàng"
            if (selectedIds.includes(order.id) && (order.status === "Đang chuẩn bị hàng" || order.status === "Chờ xác nhận")) {
                return { ...order, status: "Đang giao hàng", delivery: "Đang giao hàng" };
            }
            return order;
        }));
        setClearSelectedToggle(!clearSelectedToggle);
        setSelectedRows([]);
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
                {selectedRows.length > 0 && (() => {
                    const hasPendingConfirmation = selectedRows.some(r => (r.status || r.delivery) === "Chờ xác nhận");
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
                                {hasPreparing && (
                                    <button 
                                        onClick={handleBulkDeliver}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                                    >
                                        <Truck className="w-4 h-4" /> Giao hàng đồng loạt
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