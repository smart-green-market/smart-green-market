import { useEffect, useMemo, useState, useCallback } from "react";
import { ClipboardList } from "lucide-react";

import OrderStatusFilterTabs from "../../components/User/OrderTracking/OrderStatusFilterTabs";
import OrderTrackingCard from "../../components/User/OrderTracking/OrderTrackingCard";
import OrderListLoading from "../../components/User/OrderTracking/OrderListLoading";
import OrderListError from "../../components/User/OrderTracking/OrderListError";
import OrderListEmpty from "../../components/User/OrderTracking/OrderListEmpty";
import OrderDetailModal from "../../components/User/OrderTracking/OrderDetailModal";

import {
  buyerOrder,
  handleApiError,
  parseBuyerOrderList,
} from "../../services/api/Buyer/buyerOrder";
import { useDealerSlug } from "../../hooks/useStorefrontPaths";
import { matchesStatusFilter, isActiveTrackingOrder } from "../../utils/orderUtils";

const FILTER_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "processing", label: "Đang xử lý" },
  { key: "shipping", label: "Đang giao" },
];

export default function OrderTrackingPage() {
  const dealerSlug = useDealerSlug();

  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!dealerSlug) {
      setOrders([]);
      setError("Không xác định được cửa hàng. Vui lòng truy cập lại từ liên kết cửa hàng.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await buyerOrder.getAll(dealerSlug);
      setOrders(parseBuyerOrderList(data));
    } catch (err) {
      setError(handleApiError(err, "Không tải được danh sách đơn hàng. Vui lòng thử lại."));
    } finally {
      setIsLoading(false);
    }
  }, [dealerSlug]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const activeOrders = useMemo(
    () => orders.filter((order) => isActiveTrackingOrder(order.status)),
    [orders],
  );

  const filteredOrders = useMemo(
    () => activeOrders.filter((order) => matchesStatusFilter(order.status, activeFilter)),
    [activeOrders, activeFilter],
  );

  const tabsWithCount = useMemo(
    () =>
      FILTER_TABS.map((tab) => ({
        ...tab,
        count:
          tab.key === "all"
            ? activeOrders.length
            : activeOrders.filter((order) =>
                matchesStatusFilter(order.status, tab.key),
              ).length,
      })),
    [activeOrders],
  );

  const handleViewDetail = useCallback((orderId) => {
    setSelectedOrderId(orderId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedOrderId(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <ClipboardList size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Theo dõi đơn hàng</h1>
            <p className="text-sm text-slate-400">
              Các đơn hàng đang được xử lý và giao
            </p>
          </div>
        </div>

        <OrderStatusFilterTabs
          tabs={tabsWithCount}
          activeKey={activeFilter}
          onChange={setActiveFilter}
        />

        {isLoading ? (
          <OrderListLoading />
        ) : error ? (
          <OrderListError message={error} onRetry={fetchOrders} />
        ) : filteredOrders.length === 0 ? (
          <OrderListEmpty />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderTrackingCard
                key={order.id}
                order={order}
                onViewDetail={handleViewDetail}
              />
            ))}
          </div>
        )}
      </div>

      <OrderDetailModal
        dealerSlug={dealerSlug}
        orderId={selectedOrderId}
        isOpen={selectedOrderId != null}
        onClose={handleCloseDetail}
        onOrderUpdated={fetchOrders}
      />
    </div>
  );
}
