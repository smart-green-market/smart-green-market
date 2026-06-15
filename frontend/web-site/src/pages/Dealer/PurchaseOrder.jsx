import { useState, useEffect } from "react";
import { ClipboardList, Plus } from "lucide-react";
import SupplierFilter from "../../components/Dealer/Supplier/SupplierFilter";
import PurchaseOrderList from "../../components/Dealer/PurchaseOrder/PurchaseOrderList";
import axios from "axios";
import Pagination from "../../components/common/Pagination";
export default function DealerPurchaseOrderPage() {
    

    const data = [
        {
            id: "NH-0431",
            supplier: "Hợp tác xã Rau sạch Đà Lạt",
            date: "08/06/2026",
            items: "100kg Cải thìa, 50kg Bông cải xanh, 30kg Cà chua bi",
            amount: "4,650,000 đ",
            status: "Đã hoàn thành",
            deliveryDate: "09/06/2026"
        },
        {
            id: "NH-0430",
            supplier: "Nông trại Xanh Lâm Đồng",
            date: "07/06/2026",
            items: "200kg Khoai tây vàng, 100kg Cà rốt, 50kg Bí ngòi",
            amount: "5,400,000 đ",
            status: "Đã hoàn thành",
            deliveryDate: "08/06/2026"
        },
        {
            id: "NH-0429",
            supplier: "Trại nấm Hữu cơ Minh Đức",
            date: "06/06/2026",
            items: "30kg Nấm đùi gà, 20kg Nấm rơm tươi",
            amount: "1,800,000 đ",
            status: "Chờ giao hàng",
            deliveryDate: "Dự kiến 10/06/2026"
        },
        {
            id: "NH-0428",
            supplier: "Hợp tác xã Rau sạch Đà Lạt",
            date: "01/06/2026",
            items: "80kg Xà lách lolo, 40kg Rau muống hạt",
            amount: "2,200,000 đ",
            status: "Đã hủy",
            deliveryDate: "--"
        }, {
            id: "NH-0431",
            supplier: "Hợp tác xã Rau sạch Đà Lạt",
            date: "08/06/2026",
            items: "100kg Cải thìa, 50kg Bông cải xanh, 30kg Cà chua bi",
            amount: "4,650,000 đ",
            status: "Đã hoàn thành",
            deliveryDate: "09/06/2026"
        },
        {
            id: "NH-0430",
            supplier: "Nông trại Xanh Lâm Đồng",
            date: "07/06/2026",
            items: "200kg Khoai tây vàng, 100kg Cà rốt, 50kg Bí ngòi",
            amount: "5,400,000 đ",
            status: "Đã hoàn thành",
            deliveryDate: "08/06/2026"
        },
        {
            id: "NH-0429",
            supplier: "Trại nấm Hữu cơ Minh Đức",
            date: "06/06/2026",
            items: "30kg Nấm đùi gà, 20kg Nấm rơm tươi",
            amount: "1,800,000 đ",
            status: "Chờ giao hàng",
            deliveryDate: "Dự kiến 10/06/2026"
        },
        {
            id: "NH-0428",
            supplier: "Hợp tác xã Rau sạch Đà Lạt",
            date: "01/06/2026",
            items: "80kg Xà lách lolo, 40kg Rau muống hạt",
            amount: "2,200,000 đ",
            status: "Đã hủy",
            deliveryDate: "--"
        }, {
            id: "NH-0431",
            supplier: "Hợp tác xã Rau sạch Đà Lạt",
            date: "08/06/2026",
            items: "100kg Cải thìa, 50kg Bông cải xanh, 30kg Cà chua bi",
            amount: "4,650,000 đ",
            status: "Đã hoàn thành",
            deliveryDate: "09/06/2026"
        },
        {
            id: "NH-0430",
            supplier: "Nông trại Xanh Lâm Đồng",
            date: "07/06/2026",
            items: "200kg Khoai tây vàng, 100kg Cà rốt, 50kg Bí ngòi",
            amount: "5,400,000 đ",
            status: "Đã hoàn thành",
            deliveryDate: "08/06/2026"
        },
        {
            id: "NH-0429",
            supplier: "Trại nấm Hữu cơ Minh Đức",
            date: "06/06/2026",
            items: "30kg Nấm đùi gà, 20kg Nấm rơm tươi",
            amount: "1,800,000 đ",
            status: "Chờ giao hàng",
            deliveryDate: "Dự kiến 10/06/2026"
        },
        {
            id: "NH-0428",
            supplier: "Hợp tác xã Rau sạch Đà Lạt",
            date: "01/06/2026",
            items: "80kg Xà lách lolo, 40kg Rau muống hạt",
            amount: "2,200,000 đ",
            status: "Đã hủy",
            deliveryDate: "--"
        }
    ];
    // const filteredOrders = data.filter((order) => {
    //     const matchesSearch =
    //         order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //         order.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //         order.items.toLowerCase().includes(searchQuery.toLowerCase());
    //     const matchesStatus = statusFilter === "" || order.status === statusFilter;
    //     return matchesSearch && matchesStatus;
    // });


    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

     // States cho phân trang backend
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    // const limit = 10; // Số phần tử mỗi trang gửi lên backend

    
    const filterOptions = [
        { label: "Tất cả", value: "", colorClass: "text-neutral-700" },
        { label: "Đã hoàn thành", value: "Đã hoàn thành", colorClass: "text-emerald-700" },
        { label: "Chờ giao hàng", value: "Chờ giao hàng", colorClass: "text-amber-700" },
        { label: "Đã hủy", value: "Đã hủy", colorClass: "text-red-700" }
    ];

    const handleViewDetail = (order) => {
        console.log("Xem chi tiết đơn nhập hàng:", order);
    };
    //  Gọi API mỗi khi trang, bộ lọc tìm kiếm hoặc trạng thái thay đổi
    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                // const response = await axios.get("/api/dealer/purchase-orders", {
                //     params: {
                //         page: currentPage,
                //         limit: limit,
                //         search: searchQuery,
                //         status: statusFilter
                //     }
                // });
                
                // Giả sử API trả về định dạng { data: Array, totalPages: Number }
                setPurchaseOrders(data);
                setTotalPages(data.length%10);
            } catch (error) {
                console.error("Lỗi khi tải đơn nhập hàng:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [currentPage, searchQuery, statusFilter]);


    // Reset về trang 1 khi gõ tìm kiếm hoặc thay đổi filter trạng thái
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    

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
                <button className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 cursor-pointer self-start sm:self-auto">
                    <Plus className="w-4 h-4" /> Tạo đơn nhập mới
                </button>
            </div>

            {/* Filter */}
            <SupplierFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                filterOptions={filterOptions}
                placeholder="Tìm kiếm đơn nhập hàng (Mã đơn, Nhà cung cấp...)"
            />

            {/* List of orders */}

            {/* <PurchaseOrderList
                purchaseOrders={filteredOrders}
                onViewDetail={handleViewDetail}
            /> */}


            {loading ? (
                <div className="text-center py-10">Đang tải dữ liệu...</div>
            ) : (
                <PurchaseOrderList
                    purchaseOrders={purchaseOrders}
                    onViewDetail={handleViewDetail}
                />
            )}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
            





        </div>
    );
}