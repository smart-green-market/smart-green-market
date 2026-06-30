import { useCallback, useEffect, useMemo, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import OrderStatusFilterTabs from "../../../components/User/OrderTracking/OrderStatusFilterTabs";
import OrderReturnSubFilterTabs from "../../../components/User/OrderHistory/OrderReturnSubFilterTabs";
import OrderTrackingCard from "../../../components/User/OrderTracking/OrderTrackingCard";
import OrderListError from "../../../components/User/OrderTracking/OrderListError";
import OrderListEmpty from "../../../components/User/OrderTracking/OrderListEmpty";
import OrderDetailModal from "../../../components/User/OrderTracking/OrderDetailModal";
import CancelOrderModal from "../../../components/User/OrderTracking/CancelOrderModal";
import ReturnOrderModal from "../../../components/User/OrderTracking/ReturnOrderModal";
import Pagination from "../../../components/User/OrderHistory/Pagination";

import {
  buyerOrder,
  handleApiError,
  parseBuyerOrderList,
} from "../../../services/api/Buyer/buyerOrder";
import { useDealerSlug, useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import {
  isHistoryOrder,
  isReturnOrder,
  matchesHistoryStatusFilter,
  RETURN_ORDER_STATUSES,
  sortOrdersByCreatedDesc,
} from "../../../utils/orderUtils";

const PAGE_SIZE = 5;

const FILTER_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
  { key: "return", label: "Trả hàng" },
];

const EMPTY_STATE = {
  all: {
    title: "Chưa có đơn hàng trong lịch sử",
    description:
      "Các đơn đã hoàn thành, đã hủy hoặc trong luồng trả hàng sẽ được lưu tại đây.",
    actionLabel: "Theo dõi đơn đang xử lý",
  },
  completed: {
    title: "Chưa có đơn hàng hoàn thành",
    description: "Đơn hàng hoàn tất sẽ hiển thị tại đây sau khi giao thành công.",
    actionLabel: "Theo dõi đơn đang xử lý",
  },
  cancelled: {
    title: "Chưa có đơn hàng đã hủy",
    description: "Các đơn bị hủy sẽ được lưu lại để bạn tra cứu.",
    actionLabel: "",
  },
  return: {
    title: "Chưa có đơn hàng trả hàng",
    description: "Các đơn đã gửi yêu cầu trả hàng sẽ hiển thị tại đây.",
    actionLabel: "",
  },
};

export default function OrderHistoryPage() {
  const dealerSlug = useDealerSlug();
  const paths = useStorefrontPaths();

  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [returnSubFilter, setReturnSubFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);

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
      setError(handleApiError(err, "Không tải được lịch sử đơn hàng. Vui lòng thử lại."));
    } finally {
      setIsLoading(false);
    }
  }, [dealerSlug]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const historyOrders = useMemo(
    () => sortOrdersByCreatedDesc(orders.filter((order) => isHistoryOrder(order.status))),
    [orders],
  );

  const filteredOrders = useMemo(
    () =>
      sortOrdersByCreatedDesc(
        historyOrders.filter((order) =>
          matchesHistoryStatusFilter(order.status, activeFilter, returnSubFilter),
        ),
      ),
    [historyOrders, activeFilter, returnSubFilter],
  );

  const returnOrders = useMemo(
    () => historyOrders.filter((order) => isReturnOrder(order.status)),
    [historyOrders],
  );

  const returnSubFilterCounts = useMemo(() => {
    const counts = { all: returnOrders.length };
    RETURN_ORDER_STATUSES.forEach((status) => {
      counts[status] = returnOrders.filter((order) => order.status === status).length;
    });
    return counts;
  }, [returnOrders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const pageOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  const tabsWithCount = useMemo(
    () =>
      FILTER_TABS.map((tab) => ({
        ...tab,
        count:
          tab.key === "all"
            ? historyOrders.length
            : tab.key === "return"
              ? returnOrders.length
              : historyOrders.filter((order) =>
                  matchesHistoryStatusFilter(order.status, tab.key),
                ).length,
      })),
    [historyOrders, returnOrders],
  );

  const stats = useMemo(() => {
    const completed = historyOrders.filter((order) => order.status === "completed").length;
    const cancelled = historyOrders.filter((order) => order.status === "cancelled").length;
    return { completed, cancelled };
  }, [historyOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, returnSubFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleFilterChange = useCallback((filterKey) => {
    setActiveFilter(filterKey);
    if (filterKey !== "return") {
      setReturnSubFilter("all");
    }
    setCurrentPage(1);
  }, []);

  const handleReturnSubFilterChange = useCallback((subKey) => {
    setReturnSubFilter(subKey);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleViewDetail = useCallback((orderId) => {
    setSelectedOrderId(orderId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedOrderId(null);
  }, []);

  const handleCancelRequest = useCallback((order) => {
    setCancelTarget(order);
  }, []);

  const handleReturnRequest = useCallback((order) => {
    setReturnTarget(order);
  }, []);

  const handleActionSuccess = useCallback(() => {
    fetchOrders();
    setSelectedOrderId(null);
  }, [fetchOrders]);

  const emptyState = EMPTY_STATE[activeFilter] ?? EMPTY_STATE.all;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white px-6 py-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <History size={22} />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-emerald-950">
                Lịch sử đơn hàng
              </h1>
            </div>
          </div>

          <Link
            to={paths.orderStatus}
            className="text-sm font-medium text-emerald-700 no-underline hover:text-emerald-900 hover:underline"
          >
            Theo dõi đơn đang xử lý →
          </Link>
        </div>

        <OrderStatusFilterTabs
          tabs={tabsWithCount}
          activeKey={activeFilter}
          onChange={handleFilterChange}
        />

        {activeFilter === "return" ? (
          <OrderReturnSubFilterTabs
            activeKey={returnSubFilter}
            counts={returnSubFilterCounts}
            onChange={handleReturnSubFilterChange}
          />
        ) : null}
      </section>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
        </div>
      ) : error ? (
        <OrderListError message={error} onRetry={fetchOrders} />
      ) : filteredOrders.length === 0 ? (
        <OrderListEmpty
          title={emptyState.title}
          description={emptyState.description}
          actionLabel={emptyState.actionLabel}
          actionHref={emptyState.actionLabel ? paths.orderStatus : ""}
        />
      ) : (
        <>
          <div className="space-y-4">
            {pageOrders.map((order) => (
              <OrderTrackingCard
                key={order.id}
                order={order}
                onViewDetail={handleViewDetail}
                onCancelOrder={handleCancelRequest}
                onReturnOrder={handleReturnRequest}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={handlePageChange}
          />
        </>
      )}

      <OrderDetailModal
        dealerSlug={dealerSlug}
        orderId={selectedOrderId}
        isOpen={selectedOrderId != null}
        onClose={handleCloseDetail}
        onOrderUpdated={fetchOrders}
        onCancelOrder={handleCancelRequest}
        onReturnOrder={handleReturnRequest}
      />

      <CancelOrderModal
        isOpen={cancelTarget != null}
        onClose={() => setCancelTarget(null)}
        dealerSlug={dealerSlug}
        order={cancelTarget}
        onSuccess={handleActionSuccess}
      />

      <ReturnOrderModal
        isOpen={returnTarget != null}
        onClose={() => setReturnTarget(null)}
        dealerSlug={dealerSlug}
        order={returnTarget}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
