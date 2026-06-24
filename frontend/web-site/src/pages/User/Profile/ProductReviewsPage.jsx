import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Star } from "lucide-react";
import OrderStatusFilterTabs from "../../../components/User/OrderTracking/OrderStatusFilterTabs";
import OrderListError from "../../../components/User/OrderTracking/OrderListError";
import OrderListEmpty from "../../../components/User/OrderTracking/OrderListEmpty";
import OrderDetailModal from "../../../components/User/OrderTracking/OrderDetailModal";
import Pagination from "../../../components/User/OrderHistory/Pagination";
import PendingReviewCard, {
    MyReviewCard,
} from "../../../components/User/Profile/Reviews/ReviewCard";
import CreateReviewModal from "../../../components/User/Profile/Reviews/CreateReviewModal";
import ReviewDetailModal from "../../../components/User/Profile/Reviews/ReviewDetailModal";
import {
    buyerReviewService,
    handleApiError,
} from "../../../services/api/Buyer/buyerReviewService";
import { useDealerSlug } from "../../../hooks/useStorefrontPaths";
import {
    getPendingReviewKey,
    getReviewTotalPages,
    normalizeMyReviewItem,
    parseMyReviewList,
    parsePendingReviewList,
    REVIEWS_PAGE_SIZE,
} from "../../../utils/buyerReviewUtils";

const EMPTY_STATE = {
    pending: {
        title: "Không có sản phẩm chờ đánh giá",
        description:
            "Các sản phẩm từ đơn hàng đã hoàn thành sẽ hiển thị tại đây để bạn đánh giá.",
    },
    reviewed: {
        title: "Chưa có đánh giá nào",
        description: "Các đánh giá bạn đã gửi sẽ được lưu tại đây.",
    },
};

export default function ProductReviewsPage() {
    const dealerSlug = useDealerSlug();

    const [activeFilter, setActiveFilter] = useState("pending");
    const [currentPage, setCurrentPage] = useState(1);
    const [pendingItems, setPendingItems] = useState([]);
    const [reviewedItems, setReviewedItems] = useState([]);
    const [reviewedCount, setReviewedCount] = useState(0);
    const [reviewedPageSize, setReviewedPageSize] = useState(REVIEWS_PAGE_SIZE);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [selectedReviewId, setSelectedReviewId] = useState(null);

    const fetchPendingReviews = useCallback(async () => {
        const data = await buyerReviewService.pendingReview(dealerSlug);
        return parsePendingReviewList(data);
    }, [dealerSlug]);

    const fetchReviewedReviews = useCallback(
        async (page) => {
            const data = await buyerReviewService.getAll(dealerSlug, {
                page,
                page_size: REVIEWS_PAGE_SIZE,
            });
            return parseMyReviewList(data);
        },
        [dealerSlug],
    );

    const loadData = useCallback(async () => {
        if (!dealerSlug) {
            setPendingItems([]);
            setReviewedItems([]);
            setError("Không xác định được cửa hàng. Vui lòng truy cập lại từ liên kết cửa hàng.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [pendingResult, reviewedResult] = await Promise.allSettled([
                fetchPendingReviews(),
                fetchReviewedReviews(currentPage),
            ]);

            if (pendingResult.status === "fulfilled") {
                setPendingItems(pendingResult.value);
            } else {
                setPendingItems([]);
                console.warn(
                    "[product-reviews] pending:",
                    pendingResult.reason,
                );
            }

            if (reviewedResult.status === "fulfilled") {
                const reviewedData = reviewedResult.value;
                setReviewedItems(reviewedData.results);
                setReviewedCount(reviewedData.count);
                setReviewedPageSize(reviewedData.page_size || REVIEWS_PAGE_SIZE);
            } else {
                setReviewedItems([]);
                setReviewedCount(0);
                console.warn(
                    "[product-reviews] reviewed:",
                    reviewedResult.reason,
                );
            }

            const pendingFailed = pendingResult.status === "rejected";
            const reviewedFailed = reviewedResult.status === "rejected";

            if (pendingFailed && reviewedFailed) {
                setError(
                    handleApiError(
                        pendingResult.reason,
                        "Không tải được danh sách đánh giá. Vui lòng thử lại.",
                    ),
                );
            }
        } catch (err) {
            setError(handleApiError(err, "Không tải được danh sách đánh giá. Vui lòng thử lại."));
        } finally {
            setIsLoading(false);
        }
    }, [dealerSlug, currentPage, fetchPendingReviews, fetchReviewedReviews]);

    const reloadActiveTab = useCallback(async () => {
        if (!dealerSlug) return;

        try {
            if (activeFilter === "pending") {
                const pendingList = await fetchPendingReviews();
                setPendingItems(pendingList);
            } else {
                const reviewedData = await fetchReviewedReviews(currentPage);
                setReviewedItems(reviewedData.results);
                setReviewedCount(reviewedData.count);
                setReviewedPageSize(reviewedData.page_size || REVIEWS_PAGE_SIZE);
            }
        } catch (err) {
            setError(handleApiError(err, "Không tải được danh sách đánh giá. Vui lòng thử lại."));
        }
    }, [
        activeFilter,
        currentPage,
        dealerSlug,
        fetchPendingReviews,
        fetchReviewedReviews,
    ]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter]);

    const pendingTotalPages = Math.max(
        1,
        Math.ceil(pendingItems.length / REVIEWS_PAGE_SIZE),
    );
    const reviewedTotalPages = getReviewTotalPages(reviewedCount, reviewedPageSize);

    const totalPages =
        activeFilter === "pending" ? pendingTotalPages : reviewedTotalPages;

    const pagePendingItems = useMemo(() => {
        const start = (currentPage - 1) * REVIEWS_PAGE_SIZE;
        return pendingItems.slice(start, start + REVIEWS_PAGE_SIZE);
    }, [pendingItems, currentPage]);

    const tabsWithCount = useMemo(
        () => [
            { key: "pending", label: "Chưa đánh giá", count: pendingItems.length },
            { key: "reviewed", label: "Đã đánh giá", count: reviewedCount },
        ],
        [pendingItems.length, reviewedCount],
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handleFilterChange = useCallback((filterKey) => {
        setActiveFilter(filterKey);
        setCurrentPage(1);
    }, []);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleReviewUpdateSuccess = useCallback(async () => {
        await reloadActiveTab();
    }, [reloadActiveTab]);

    const handleReviewSuccess = useCallback(
        async (createdReview) => {
            const normalized = normalizeMyReviewItem(createdReview);
            const pendingKey = getPendingReviewKey({
                order_id: normalized?.order_id,
                dealer_product_id: normalized?.dealer_product_id,
            });

            setPendingItems((prev) =>
                prev.filter((item) => getPendingReviewKey(item) !== pendingKey),
            );

            if (activeFilter === "reviewed") {
                await reloadActiveTab();
            } else {
                const reviewedData = await fetchReviewedReviews(1);
                setReviewedItems(reviewedData.results);
                setReviewedCount(reviewedData.count);
            }
        },
        [activeFilter, fetchReviewedReviews, reloadActiveTab],
    );

    const emptyState = EMPTY_STATE[activeFilter] ?? EMPTY_STATE.pending;
    const listItems =
        activeFilter === "pending" ? pagePendingItems : reviewedItems;

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-gray-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
                <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <Star size={22} />
                    </span>
                    <div>
                        <h1 className="text-xl font-semibold text-emerald-950">
                            Đánh giá sản phẩm
                        </h1>
                        <p className="text-sm text-neutral-600">
                            Đánh giá sản phẩm sau khi đơn hàng hoàn thành
                        </p>
                    </div>
                </div>

                <OrderStatusFilterTabs
                    tabs={tabsWithCount}
                    activeKey={activeFilter}
                    onChange={handleFilterChange}
                />
            </section>

            {isLoading ? (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-gray-200 bg-white">
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
                </div>
            ) : error ? (
                <OrderListError message={error} onRetry={loadData} />
            ) : listItems.length === 0 ? (
                <OrderListEmpty
                    title={emptyState.title}
                    description={emptyState.description}
                />
            ) : (
                <>
                    <div className="space-y-4">
                        {activeFilter === "pending"
                            ? pagePendingItems.map((item) => (
                                  <PendingReviewCard
                                      key={getPendingReviewKey(item)}
                                      item={item}
                                      onViewOrder={setSelectedOrderId}
                                      onReview={setReviewTarget}
                                  />
                              ))
                            : reviewedItems.map((item) => (
                                  <MyReviewCard
                                      key={item.id}
                                      item={item}
                                      onViewOrder={setSelectedOrderId}
                                      onViewReview={setSelectedReviewId}
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
                onClose={() => setSelectedOrderId(null)}
            />

            <CreateReviewModal
                open={reviewTarget != null}
                dealerSlug={dealerSlug}
                item={reviewTarget}
                onClose={() => setReviewTarget(null)}
                onSuccess={handleReviewSuccess}
            />

            <ReviewDetailModal
                open={selectedReviewId != null}
                dealerSlug={dealerSlug}
                reviewId={selectedReviewId}
                onClose={() => setSelectedReviewId(null)}
                onSuccess={handleReviewUpdateSuccess}
            />
        </div>
    );
}
