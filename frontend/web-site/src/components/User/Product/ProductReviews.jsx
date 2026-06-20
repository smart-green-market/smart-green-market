import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StarRating from "./StarRating";
import {
    MOCK_PRODUCT_REVIEWS,
    MOCK_REVIEW_SUMMARY,
    REVIEWS_PER_PAGE,
} from "./mockProductReviews";

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

function ReviewPagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const pageItems = buildPageItems(page, totalPages);

    return (
        <div className="flex items-center justify-center gap-1.5 pt-4">
            <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-neutral-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang trước"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {pageItems.map((item) => {
                if (typeof item === "string") {
                    return (
                        <span
                            key={item}
                            className="flex h-9 min-w-9 items-center justify-center px-1 text-sm text-neutral-400"
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
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${
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
                disabled={page >= totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-neutral-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang sau"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

function ReviewItem({ review }) {
    return (
        <article className="border-b border-stone-300 py-6 last:border-b-0">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200 text-base font-bold text-teal-800">
                        {review.initial}
                    </div>
                    <div>
                        <p className="text-base text-emerald-950">{review.name}</p>
                        <p className="text-xs text-neutral-700">{review.meta}</p>
                    </div>
                </div>
                <StarRating value={review.rating} />
            </div>
            <p className="mt-3 text-base text-zinc-900">{review.content}</p>
        </article>
    );
}

export default function ProductReviews({
    summary = MOCK_REVIEW_SUMMARY,
    reviews = MOCK_PRODUCT_REVIEWS,
    perPage = REVIEWS_PER_PAGE,
}) {
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(reviews.length / perPage));

    const pageReviews = useMemo(() => {
        const start = (page - 1) * perPage;
        return reviews.slice(start, start + perPage);
    }, [page, perPage, reviews]);

    const handlePageChange = (nextPage) => {
        setPage(Math.min(Math.max(1, nextPage), totalPages));
    };

    return (
        <section className="border-t border-stone-300 pt-12">
            <h2 className="mb-8 font-['Noto_Serif',serif] text-3xl font-semibold text-emerald-950">
                Đánh giá sản phẩm
            </h2>

            <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
                <aside className="flex flex-col gap-6">
                    <div className="rounded-2xl bg-zinc-100 p-8 text-center">
                        <p className="text-5xl font-bold text-emerald-950">
                            {summary.average.toFixed(1)}
                        </p>
                        <StarRating
                            value={summary.average}
                            size="lg"
                            className="mt-2 justify-center"
                        />
                        <p className="mt-2 text-sm text-neutral-700">
                            Dựa trên {summary.total} đánh giá từ khách hàng
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {summary.distribution.map((row) => (
                            <div key={row.stars} className="flex items-center gap-4">
                                <span className="w-12 text-sm text-neutral-700">{row.stars} sao</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                                    <div
                                        className="h-full rounded-full bg-teal-800"
                                        style={{ width: `${row.percent}%` }}
                                    />
                                </div>
                                <span className="w-10 text-right text-sm text-zinc-900">
                                    {row.percent}%
                                </span>
                            </div>
                        ))}
                    </div>
                </aside>

                <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                    {pageReviews.length ? (
                        pageReviews.map((review) => (
                            <ReviewItem key={review.id} review={review} />
                        ))
                    ) : (
                        <p className="py-8 text-center text-base text-neutral-500">
                            Chưa có đánh giá nào.
                        </p>
                    )}

                    <ReviewPagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>
        </section>
    );
}
