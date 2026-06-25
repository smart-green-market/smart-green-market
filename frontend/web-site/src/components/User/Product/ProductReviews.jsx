import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import {
    buyerReviewService,
    handleApiError,
} from "../../../services/api/Buyer/buyerReviewService";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import {
    getReviewTotalPages,
    mapProductReviewItem,
    mapProductReviewSummary,
    REVIEWS_PAGE_SIZE,
} from "../../../utils/buyerReviewUtils";
import StarRating from "./StarRating";

const MAX_PAGE_BUTTONS = 3;

function buildPageItems(currentPage, totalPages, maxButtons = MAX_PAGE_BUTTONS) {
    if (totalPages <= maxButtons) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items = [];
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(2, currentPage - half);
    let end = Math.min(totalPages - 1, currentPage + half);

    if (currentPage <= half + 1) {
        end = maxButtons;
    } else if (currentPage >= totalPages - half) {
        start = totalPages - maxButtons + 1;
    }

    items.push(1);

    if (start > 2) {
        items.push("ellipsis-start");
    }

    for (let page = start; page <= end; page += 1) {
        if (page !== 1 && page !== totalPages) {
            items.push(page);
        }
    }

    if (end < totalPages - 1) {
        items.push("ellipsis-end");
    }

    if (totalPages > 1) {
        items.push(totalPages);
    }

    return items;
}

function ReviewPagination({ page, totalPages, onPageChange, loading }) {
    if (totalPages <= 1) return null;

    const pageItems = buildPageItems(page, totalPages);

    return (
        <div className="flex items-center justify-center gap-1 pt-3 lg:gap-1.5 lg:pt-4">
            <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 text-neutral-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 lg:h-9 lg:w-9"
                aria-label="Trang trước"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {pageItems.map((item) => {
                if (typeof item === "string") {
                    return (
                        <span
                            key={item}
                            className="flex h-8 min-w-8 items-center justify-center px-1 text-xs text-neutral-400 lg:h-9 lg:min-w-9 lg:text-sm"
                        >
                            …
                        </span>
                    );
                }

                return (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onPageChange(item)}
                        disabled={loading}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:h-9 lg:min-w-9 lg:px-2 lg:text-sm ${
                            item === page
                                ? "bg-emerald-950 text-white"
                                : "border border-stone-300 text-neutral-600 hover:bg-stone-50"
                        }`}
                    >
                        {item}
                    </button>
                );
            })}

            <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 text-neutral-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 lg:h-9 lg:w-9"
                aria-label="Trang sau"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

function ReviewImageLightbox({ imageUrl, onClose }) {
    useBodyScrollLock(Boolean(imageUrl));

    useEffect(() => {
        if (!imageUrl) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [imageUrl, onClose]);

    if (!imageUrl) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/75 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Xem ảnh đánh giá"
            onClick={onClose}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                aria-label="Đóng ảnh"
            >
                <X className="h-5 w-5" />
            </button>

            <img
                src={imageUrl}
                alt="Ảnh đánh giá"
                className="max-h-[min(85vh,100dvh)] max-w-full rounded-lg object-contain shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            />
        </div>
    );
}

function ReviewItem({ review }) {
    const [previewImage, setPreviewImage] = useState(null);

    return (
        <>
            <article className="rounded-lg border border-emerald-100/90 border-l-[3px] border-l-emerald-600 bg-gradient-to-br from-emerald-50/50 via-white to-white p-3 shadow-[0_1px_4px_rgba(6,78,59,0.07)] ring-1 ring-emerald-50/80 sm:p-3.5 lg:p-4">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 sm:h-8 sm:w-8 sm:text-sm">
                            {review.initial}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-emerald-950">
                                {review.name}
                            </p>
                            <p className="break-all text-[11px] leading-snug text-neutral-500 sm:text-xs lg:truncate">
                                {review.meta}
                            </p>
                        </div>
                    </div>
                    <StarRating value={review.rating} size="sm" className="shrink-0 pt-0.5" />
                </div>

                {review.content ? (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700 sm:mt-2.5">
                        {review.content}
                    </p>
                ) : null}

                {review.images?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-2.5">
                        {review.images.map((imageUrl, index) => (
                            <button
                                key={`${review.id}-${index}`}
                                type="button"
                                onClick={() => setPreviewImage(imageUrl)}
                                className="cursor-pointer overflow-hidden rounded-md border border-stone-200 bg-white transition hover:border-emerald-300 hover:ring-2 hover:ring-emerald-100"
                                aria-label={`Xem ảnh đánh giá ${index + 1}`}
                            >
                                <img
                                    src={imageUrl}
                                    alt={`Ảnh đánh giá ${index + 1}`}
                                    className="h-12 w-12 object-cover sm:h-14 sm:w-14"
                                />
                            </button>
                        ))}
                    </div>
                ) : null}
            </article>

            <ReviewImageLightbox
                imageUrl={previewImage}
                onClose={() => setPreviewImage(null)}
            />
        </>
    );
}

export default function ProductReviews({
    dealerSlug,
    productId,
    summary: externalSummary,
}) {
    const [page, setPage] = useState(1);
    const [internalSummary, setInternalSummary] = useState(
        mapProductReviewSummary(null),
    );
    const [reviews, setReviews] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [summaryLoading, setSummaryLoading] = useState(
        externalSummary === undefined,
    );
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [error, setError] = useState("");

    const summary = externalSummary ?? internalSummary;
    const useExternalSummary = externalSummary !== undefined;

    useEffect(() => {
        setPage(1);
    }, [dealerSlug, productId]);

    useEffect(() => {
        if (useExternalSummary || !dealerSlug || !productId) return undefined;

        let cancelled = false;

        async function loadSummary() {
            setSummaryLoading(true);

            try {
                const data = await buyerReviewService.productRating(
                    dealerSlug,
                    productId,
                );
                if (cancelled) return;

                setInternalSummary(mapProductReviewSummary(data));
            } catch (err) {
                if (!cancelled) {
                    setError(handleApiError(err, "Không thể tải tổng hợp đánh giá"));
                }
            } finally {
                if (!cancelled) setSummaryLoading(false);
            }
        }

        loadSummary();

        return () => {
            cancelled = true;
        };
    }, [dealerSlug, productId, useExternalSummary]);

    useEffect(() => {
        if (!dealerSlug || !productId) return undefined;

        let cancelled = false;

        async function loadReviews() {
            setReviewsLoading(true);
            setError("");

            try {
                const data = await buyerReviewService.productReviews(
                    dealerSlug,
                    productId,
                    { page, page_size: REVIEWS_PAGE_SIZE },
                );
                if (cancelled) return;

                const mappedReviews = (data.results || []).map(mapProductReviewItem);
                setReviews(mappedReviews);
                setTotalPages(
                    getReviewTotalPages(data.count, data.page_size || REVIEWS_PAGE_SIZE),
                );
            } catch (err) {
                if (!cancelled) {
                    setReviews([]);
                    setError(handleApiError(err, "Không thể tải danh sách đánh giá"));
                }
            } finally {
                if (!cancelled) setReviewsLoading(false);
            }
        }

        loadReviews();

        return () => {
            cancelled = true;
        };
    }, [dealerSlug, productId, page]);

    const handlePageChange = (nextPage) => {
        setPage(Math.min(Math.max(1, nextPage), totalPages));
    };

    return (
        <section className="border-t border-stone-300 pt-8 lg:pt-12">
            <h2 className="mb-5 text-2xl font-semibold text-emerald-950 sm:text-[1.75rem] lg:mb-8 lg:text-3xl">
                Đánh giá sản phẩm
            </h2>

            <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-10">
                <aside className="flex flex-col gap-4 lg:gap-6">
                    <div className="rounded-2xl bg-zinc-100 p-5 text-center sm:p-6 lg:p-8">
                        {summaryLoading ? (
                            <div className="flex justify-center py-4 lg:py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                            </div>
                        ) : summary.total > 0 ? (
                            <>
                                <p className="text-4xl font-bold text-emerald-950 lg:text-5xl">
                                    {summary.average.toFixed(1)}
                                </p>
                                <StarRating
                                    value={summary.average}
                                    size="lg"
                                    className="mt-2 justify-center"
                                />
                                <p className="mt-2 text-xs text-neutral-700 sm:text-sm">
                                    Dựa trên {summary.total} đánh giá từ khách hàng
                                </p>
                            </>
                        ) : (
                            <p className="py-4 text-sm font-medium text-neutral-500 lg:py-6">
                                Chưa có đánh giá
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2.5 lg:gap-3">
                        {summary.distribution.map((row) => (
                            <div
                                key={row.stars}
                                className="flex items-center gap-2.5 sm:gap-3 lg:gap-4"
                            >
                                <span className="w-10 shrink-0 text-xs text-neutral-700 sm:text-sm lg:w-12">
                                    {row.stars} sao
                                </span>
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 sm:h-2">
                                    <div
                                        className="h-full rounded-full bg-teal-800 transition-all"
                                        style={{ width: `${row.percent}%` }}
                                    />
                                </div>
                                <span className="w-8 shrink-0 text-right text-xs text-zinc-900 sm:text-sm lg:w-10">
                                    {row.percent}%
                                </span>
                            </div>
                        ))}
                    </div>
                </aside>

                <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 shadow-sm sm:p-4 lg:bg-white lg:p-5">
                    {error ? (
                        <p className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700 lg:mb-4 lg:px-4 lg:py-3">
                            {error}
                        </p>
                    ) : null}

                    {reviewsLoading ? (
                        <div className="flex justify-center py-8 lg:py-10">
                            <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
                        </div>
                    ) : reviews.length ? (
                        <div className="flex flex-col gap-2.5 sm:gap-3">
                            {reviews.map((review) => (
                                <ReviewItem key={review.id} review={review} />
                            ))}
                        </div>
                    ) : (
                        <p className="py-6 text-center text-sm text-neutral-500 lg:py-8">
                            Chưa có đánh giá nào.
                        </p>
                    )}

                    <ReviewPagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        loading={reviewsLoading}
                    />
                </div>
            </div>
        </section>
    );
}
