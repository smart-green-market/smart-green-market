import { useState, useEffect } from "react";
import { ClipboardList, Plus } from "lucide-react";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
import PurchaseOrderList from "../../../components/Dealer/PurchaseOrder/PurchaseOrderList";
import PurchaseOrderStatsCard from "../../../components/Dealer/PurchaseOrder/PurchaseOrderStatsCard";
import { purchaseOrderService } from "../../../services/api/purchaseOrderService";
import Pagination from "../../../components/common/Pagination";
import { useNavigate, useLocation } from "react-router-dom";

const mapStatusToFrontend = (status) => {
    const statusMap = {
        pending_supplier_confirmation: "Chờ xác nhận",
        rejected: "Đã từ chối",
        confirmed: "Đã xác nhận",
        deposit_pending_verification: "Chờ duyệt cọc",
        deposit_paid: "Đã thanh toán cọc",
        processing: "Đang chuẩn bị hàng ",
        shipping: "Đang giao hàng",
        delivered: "Đã giao hàng",
        final_payment_pending_verification: "Chờ xác nhận thanh toán cuối",
        completed: "Đã hoàn thành",
        cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
};




export default function DealerPurchaseOrderPage() {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    // States cho phân trang backend
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const page_size = 10;

    const filterOptions = [
        { label: "Tất cả", value: "", colorClass: "text-neutral-700" },
        { label: "Chờ xác nhận", value: "pending_supplier_confirmation", colorClass: "text-sky-700" },
        { label: "Đã từ chối", value: "rejected", colorClass: "text-rose-700" },
        { label: "Đã xác nhận", value: "confirmed", colorClass: "text-cyan-700" },
        { label: "Chờ duyệt cọc", value: "deposit_pending_verification", colorClass: "text-amber-700" },
        { label: "Đang chuẩn bị hàng", value: "processing", colorClass: "text-indigo-700" },
        { label: "Đang giao hàng", value: "shipping", colorClass: "text-orange-700" },
        { label: "Đã giao hàng", value: "delivered", colorClass: "text-teal-700" },
        { label: "Chờ xác nhận thanh toán cuối", value: "final_payment_pending_verification", colorClass: "text-yellow-700" },
        { label: "Đã hoàn thành", value: "completed", colorClass: "text-emerald-700" },
        { label: "Đã hủy", value: "cancelled", colorClass: "text-red-700" }
    ];

    const handleViewDetail = (order) => {
        if (order.rawId) {
            navigate(`/dai-ly/nhap-hang/chi-tiet/${order.rawId}`);
        } else {
            console.warn("Không tìm thấy ID đơn nhập hàng:", order);
        }
    };

    //  Gọi API mỗi khi trang hoặc trạng thái route thay đổi
    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const params = {
                    page: currentPage,
                    page_size: page_size,
                };
                if (searchQuery) params.search = searchQuery;
                if (statusFilter) params.status = statusFilter;

                const response = await purchaseOrderService.getAll(params);

                const results = response?.results || [];
                const mappedList = results.map((item) => ({
                    rawId: item.id,
                    id: item.order_code,
                    supplier: item.supplier_name,
                    date: new Date(item.created_at).toLocaleDateString("vi-VN"),
                    items: "Xem chi tiết đơn hàng",
                    amount: `${Number(item.total_amount).toLocaleString("vi-VN")} đ`,
                    status: mapStatusToFrontend(item.status),
                    deliveryDate: item.requested_delivery_time
                        ? new Date(item.requested_delivery_time).toLocaleDateString("vi-VN")
                        : "Chưa xác định",
                }));
                //Check đơn mới đã tồn tại chưa để thêm lên đầu
                let list = [...mappedList];
                if (location.state?.newOrder) {
                    const newO = location.state.newOrder;
                    if (!list.some(o => o.id === newO.id)) {
                        list = [newO, ...list];
                    }
                }
                setPurchaseOrders(list);
                //Tính toán để phân trang
                const count = response?.count || 0;
                const pageSize = response?.page_size || page_size;
                setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
            } catch (error) {
                console.error("Lỗi khi tải đơn nhập hàng:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [currentPage, location.state, searchQuery, statusFilter]);

    // Tìm kiếm và lọc theo trạng thái
    const filteredData = purchaseOrders; // Backend đã xử lý filter, ở đây không filter thêm để tránh lỗi phân trang




    return (
        <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-emerald-600" /> Quản Lý Đơn Nhập Hàng
                    </h1>
                    <p className="text-sm text-emerald-800/70 mt-1">
                        Theo dõi lịch sử mua và nhập nông sản từ nhà vườn về kho hàng của đại lý.
                    </p>
                </div>
                <button
                    onClick={() => navigate("/dai-ly/nhap-hang/tao-moi")}
                    className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 cursor-pointer self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" /> Tạo đơn nhập mới
                </button>
            </div>

            {/* Stats Cards */}
            <PurchaseOrderStatsCard
                orders={purchaseOrders}
                activeFilter={statusFilter}
                onFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
            />

            {/* Filter */}
            <SupplierFilter
                searchQuery={searchQuery}
                onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
                statusFilter={statusFilter}
                onStatusChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                filterOptions={filterOptions}
                placeholder="Tìm kiếm đơn nhập hàng (Mã đơn, Nhà cung cấp...)"
            />

            {/* List of orders */}
            <div className="relative">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                ) : (
                    <>
                        <PurchaseOrderList
                            purchaseOrders={filteredData}
                            onViewDetail={handleViewDetail}
                        />
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>






        </div>
    );
}