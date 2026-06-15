import { useState } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import SupplierFilter from "../../components/Dealer/Supplier/SupplierFilter";
import SalesOrderList from "../../components/Dealer/SalesOrder/SalesOrderList";

export default function DealerSalesOrderPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const salesOrders = [
        {
            id: "BH-1092",
            customer: "Cửa hàng Rau Sạch Quận 1",
            date: "09/06/2026",
            items: "15kg Cải thìa hữu cơ, 10kg Cà chua bi, 5kg Hành lá",
            amount: "1,250,000 đ",
            payment: "Đã thanh toán",
            delivery: "Đã giao"
        },
        {
            id: "BH-1091",
            customer: "Siêu thị mini SafeFood",
            date: "09/06/2026",
            items: "20kg Dâu tây Đà Lạt, 50kg Khoai tây vàng",
            amount: "3,400,000 đ",
            payment: "Chưa thanh toán",
            delivery: "Đang giao hàng"
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
        console.log("Xem chi tiết đơn bán hàng:", order);
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
                <button className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 cursor-pointer self-start sm:self-auto">
                    <Plus className="w-4 h-4" /> Xuất đơn bán mới
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

            {/* Orders list */}
            <SalesOrderList
                salesOrders={filteredOrders}
                onViewDetail={handleViewDetail}
            />
        </div>
    );
}