import { useState } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
import SalesOrderList from "../../../components/Dealer/SalesOrder/SalesOrderList";
import CreateSalesOrderModal from "../../../components/Dealer/SalesOrder/CreateSalesOrderModal";
import SalesOrderDetailPanel from "../../../components/Dealer/SalesOrder/SalesOrderDetailPanel";

export default function DealerSalesOrderPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const salesOrders = [
        {
            id: "BH-1092",
            customer: "Cửa hàng Rau Sạch Quận 1",
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
            date: "08/06/2026",
            items: "10kg Nấm đùi gà hữu cơ, 5kg Ngò rí",
            amount: "680,000 đ",
            payment: "Đã thanh toán",
            delivery: "Đã giao"
        },
        {
            id: "BH-1089",
            customer: "Nước ép Healthy Juice",
            date: "08/06/2026",
            items: "30kg Cần tây Tây Nguyên, 15kg Táo xanh hữu cơ",
            amount: "1,850,000 đ",
            payment: "Đã hủy",
            delivery: "Đã hủy"
        },
        {
            id: "BH-1089",
            customer: "Nước ép Healthy Juice",
            date: "08/06/2026",
            items: "30kg Cần tây Tây Nguyên, 15kg Táo xanh hữu cơ",
            amount: "1,850,000 đ",
            payment: "Đã hủy",
            delivery: "Đã hủy"
        },
        {
            id: "BH-1089",
            customer: "Nước ép Healthy Juice",
            date: "08/06/2026",
            items: "30kg Cần tây Tây Nguyên, 15kg Táo xanh hữu cơ",
            amount: "1,850,000 đ",
            payment: "Đã hủy",
            delivery: "Đã hủy"
        },
        {
            id: "BH-1089",
            customer: "Nước ép Healthy Juice",
            date: "08/06/2026",
            items: "30kg Cần tây Tây Nguyên, 15kg Táo xanh hữu cơ",
            amount: "1,850,000 đ",
            payment: "Đã hủy",
            delivery: "Đã hủy"
        },
        {
            id: "BH-1089",
            customer: "Nước ép Healthy Juice",
            date: "08/06/2026",
            items: "30kg Cần tây Tây Nguyên, 15kg Táo xanh hữu cơ",
            amount: "1,850,000 đ",
            payment: "Đã hủy",
            delivery: "Đã hủy"
        },
        {
            id: "BH-1089",
            customer: "Nước ép Healthy Juice",
            date: "08/06/2026",
            items: "30kg Cần tây Tây Nguyên, 15kg Táo xanh hữu cơ",
            amount: "1,850,000 đ",
            payment: "Đã hủy",
            delivery: "Đã hủy"
        },
        {
            id: "BH-1089",
            customer: "Nước ép Healthy Juice",
            date: "08/06/2026",
            items: "30kg Cần tây Tây Nguyên, 15kg Táo xanh hữu cơ",
            amount: "1,850,000 đ",
            payment: "Đã hủy",
            delivery: "Đã hủy"
        }
    ];

    const filteredOrders = salesOrders.filter((order) => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.items.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "" || order.delivery === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filterOptions = [
        { label: "Tất cả trạng thái", value: "", colorClass: "text-neutral-700" },
        { label: "Đã giao", value: "Đã giao", colorClass: "text-emerald-700" },
        { label: "Đang giao", value: "Đang giao hàng", colorClass: "text-amber-700" },
        { label: "Đã hủy", value: "Đã hủy", colorClass: "text-red-700" }
    ];

    const handleViewDetail = (order) => {
        setSelectedOrder(order);
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
            <div className={`flex flex-col ${selectedOrder ? "lg:flex-row lg:items-start" : ""} gap-6 relative`}>
                <div className={`flex-1 ${selectedOrder ? "lg:w-2/3" : "w-full"}`}>
                    <SalesOrderList
                        salesOrders={filteredOrders}
                        onViewDetail={handleViewDetail}
                        selectedOrderId={selectedOrder?.id}
                    />
                </div>
                {selectedOrder && (
                    <div className="w-full lg:w-1/3 lg:sticky lg:top-6 h-[calc(100vh-3rem)]">
                        <SalesOrderDetailPanel 
                            order={selectedOrder} 
                            onClose={() => setSelectedOrder(null)} 
                        />
                    </div>
                )}
            </div>

            <CreateSalesOrderModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
            />
        </div>
    );
}