// ============================================================
// OrderHistoryPage.jsx — trang lịch sử đơn hàng
// Quản lý toàn bộ state: filter tab, phân trang, fetch API
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import FilterTabs  from "../../../components/User/OrderHistory/FilterTabs";
import OrderCard   from "../../../components/User/orderHistory/OrderCard";
import Pagination  from "../../../components/User/orderHistory/Pagination";
import EmptyState  from "../../../components/User/orderHistory/EmptyState";
// import OrderDetailModal  from "../../../components/User/OrderTracking/OrderDetailModal";
const LIMIT = 5; // số đơn hàng mỗi trang
  
// -------------------------------------------------------
// MOCK DATA — chỉ completed
// Xóa khi API sẵn sàng, thay bằng getOrders({ status: "completed", ... })
// -------------------------------------------------------
const MOCK_COMPLETED_ORDERS = [
  {
    id: "ORD-2024-065",
    status: "completed",
    storeName: "FarmFresh Đà Lạt",
    orderDate: "20/5/2024 • 17:00",
    thumbnail: "https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=120&q=70",
    items: [
      { name: "Cải xanh hữu cơ", quantity: "1kg", price: 28000 },
      { name: "Rau muống sạch",   quantity: "500g", price: 25000 },
    ],
    totalPrice: 53000,
    deliveryAddress: "65 Huỳnh Thúc Kháng, Phường Sài Gòn, Tp.HCM",
    paymentMethod: "Thanh toán qua Ngân hàng",
    completedDate: "21/5/2024 • 10:15",
  },
  {
    id: "ORD-2024-058",
    status: "completed",
    storeName: "Vườn Sạch Organic",
    orderDate: "18/5/2024 • 10:30",
    thumbnail: "https://images.unsplash.com/photo-1543364195-bfe6e4932397?w=120&q=70",
    items: [
      { name: "Dâu tây Đà Lạt",   quantity: "500g", price: 120000 },
      { name: "Việt quất nhập khẩu", quantity: "250g", price: 130000 },
      { name: "Nho xanh không hạt",  quantity: "1kg",  price: 70000  },
    ],
    totalPrice: 320000,
    deliveryAddress: "12 Nguyễn Huệ, Quận 1, Tp.HCM",
    paymentMethod: "COD (Thanh toán khi nhận hàng)",
    completedDate: "19/5/2024 • 14:30",
  },
  {
    id: "ORD-2024-049",
    status: "completed",
    storeName: "CKC Fresh Mart",
    orderDate: "14/5/2024 • 08:00",
    thumbnail: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=120&q=70",
    items: [
      { name: "Ớt chuông đỏ",   quantity: "300g", price: 35000 },
      { name: "Ớt chuông vàng", quantity: "300g", price: 37000 },
    ],
    totalPrice: 72000,
    deliveryAddress: "88 Lê Văn Sỹ, Quận 3, Tp.HCM",
    paymentMethod: "Thanh toán qua Ngân hàng",
    completedDate: "15/5/2024 • 09:00",
  },
  {
    id: "ORD-2024-041",
    status: "completed",
    storeName: "GreenLand Store",
    orderDate: "10/5/2024 • 16:20",
    thumbnail: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=120&q=70",
    items: [
      { name: "Súp lơ trắng hữu cơ", quantity: "1 cái", price: 45000 },
    ],
    totalPrice: 45000,
    deliveryAddress: "200 Đinh Tiên Hoàng, Bình Thạnh, Tp.HCM",
    paymentMethod: "COD (Thanh toán khi nhận hàng)",
    completedDate: "11/5/2024 • 11:45",
  },
  {
    id: "ORD-2024-033",
    status: "completed",
    storeName: "Nông Trại Xanh",
    orderDate: "06/5/2024 • 09:00",
    thumbnail: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=120&q=70",
    items: [
      { name: "Táo Fuji Nhật",    quantity: "1kg",  price: 95000 },
      { name: "Lê Hàn Quốc",     quantity: "500g", price: 75000 },
      { name: "Cam Úc không hạt", quantity: "1kg",  price: 80000 },
    ],
    totalPrice: 250000,
    deliveryAddress: "45 Trần Hưng Đạo, Quận 5, Tp.HCM",
    paymentMethod: "Thanh toán qua Ngân hàng",
    completedDate: "07/5/2024 • 13:20",
  },
  {
    id: "ORD-2024-025",
    status: "completed",
    storeName: "SaigonFresh Market",
    orderDate: "01/5/2024 • 13:00",
    thumbnail: "https://images.unsplash.com/photo-1506484381205-f7945653044d?w=120&q=70",
    items: [
      { name: "Bơ sáp Đắk Lắk",   quantity: "2 trái", price: 80000 },
      { name: "Xoài cát Hoà Lộc",  quantity: "1kg",    price: 65000 },
    ],
    totalPrice: 145000,
    deliveryAddress: "33 Võ Văn Tần, Quận 3, Tp.HCM",
    paymentMethod: "COD (Thanh toán khi nhận hàng)",
    completedDate: "02/5/2024 • 10:00",
  },
  {
    id: "ORD-2024-018",
    status: "completed",
    storeName: "Vina Organic",
    orderDate: "25/4/2024 • 07:30",
    thumbnail: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=120&q=70",
    items: [
      { name: "Khoai lang mật",   quantity: "2kg", price: 44000 },
      { name: "Khoai tây Đà Lạt", quantity: "1kg", price: 30000 },
      { name: "Củ dền đỏ",        quantity: "500g",price: 22000 },
      { name: "Cà rốt baby",      quantity: "300g",price: 18000 },
    ],
    totalPrice: 114000,
    deliveryAddress: "10 Phạm Văn Đồng, Thủ Đức, Tp.HCM",
    paymentMethod: "Thanh toán qua Ngân hàng",
    completedDate: "26/4/2024 • 14:00",
  },
];
 
// Giả lập phân trang phía client — xóa khi dùng API thật
const mockFetch = ({ page }) => {
  const totalPages = Math.ceil(MOCK_COMPLETED_ORDERS.length / LIMIT) || 1;
  const results    = MOCK_COMPLETED_ORDERS.slice((page - 1) * LIMIT, page * LIMIT);
  return Promise.resolve({ results, totalPages, total: MOCK_COMPLETED_ORDERS.length });
};
// -------------------------------------------------------
 
export default function OrderHistoryPage(){
  const navigate = useNavigate();

  const [activeTab,   setActiveTab]   = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [orders,      setOrders]      = useState([]);
  const [totalPages,  setTotalPages]  = useState(1);
  const [counts,      setCounts]      = useState({});
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState(null);

  // ── Fetch khi tab hoặc trang thay đổi ─────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: thay mockFetch bằng getOrders khi API sẵn sàng
        // const data = await getOrders({ status: activeTab, page: currentPage, limit: LIMIT });
        const data = await mockFetch({ status: activeTab, page: currentPage });

        setOrders(data.results);
        setTotalPages(data.totalPages);
        if (data.counts) setCounts(data.counts);
      } catch (e) {
        setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [activeTab, currentPage]);

  // ── Khi đổi tab → về trang 1 ──────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // ── Navigate sang trang chi tiết ──────────────────────
  const handleViewDetail = (orderId) => {
    navigate(`/orders/${orderId}`);
    // TODO: đảm bảo route /orders/:orderId tồn tại trong App router
  };

  // ── Skeleton loader ────────────────────────────────────
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4 animate-pulse">
      <div className="w-[72px] h-[72px] rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
        <div className="h-3 bg-gray-100 rounded w-2/5" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="h-4 bg-gray-100 rounded w-20" />
        <div className="h-8 bg-gray-100 rounded w-24" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── Header card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5 mb-4">
          <h1 className="text-[20px] font-medium text-gray-900 mb-1">Lịch sử đơn hàng</h1>
          <p className="text-[13px] text-gray-400 mb-4">
            Theo dõi và xem lại các đơn hàng bạn đã đặt trên GreenMarket.
          </p>
          {/* Filter tabs */}
          <FilterTabs
            activeTab={activeTab}
            onChange={handleTabChange}
            counts={counts}
          />
        </div>

        {/* ── Order list ── */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            // Skeleton
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            // Error
            <div className="bg-white rounded-2xl border border-gray-200 py-12 text-center">
              <p className="text-[13px] text-gray-500 mb-2">{error}</p>
              <button
                onClick={() => setCurrentPage((p) => p)} // trigger re-fetch
                className="text-[13px] text-[#1a5c2a] hover:underline"
              >
                Thử lại
              </button>
            </div>
          ) : orders.length === 0 ? (
            // Empty
            <EmptyState activeTab={activeTab} />
          ) : (
            // Order cards
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetail={handleViewDetail}
              />
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {!isLoading && !error && orders.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={(p) => {
              setCurrentPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

      </div>
    </div>
  );
};