import { useState } from "react";
import { ChevronDown } from "lucide-react";
import StarRating from "./StarRating";

const MOCK_SUMMARY = {
    average: 4.8,
    total: 124,
    distribution: [
        { stars: 5, percent: 85 },
        { stars: 4, percent: 10 },
        { stars: 3, percent: 3 },
        { stars: 2, percent: 1 },
        { stars: 1, percent: 1 },
    ],
};

const MOCK_REVIEWS = [
    {
        id: 1,
        name: "Lê Minh Anh",
        initial: "L",
        meta: "Đã mua hàng • 2 ngày trước",
        rating: 5,
        content: "Rau nấu canh ngon",
        image: "https://placehold.co/96x96",
    },
    {
        id: 2,
        name: "Hoàng Nam",
        initial: "H",
        meta: "Đã mua hàng • 1 tuần trước",
        rating: 5,
        content: "Rau cũng được",
    },
];

export default function ProductReviews() {
    const [expanded, setExpanded] = useState(false);
    const visibleReviews = expanded ? MOCK_REVIEWS : MOCK_REVIEWS.slice(0, 2);

    return (
        <section className="border-t border-stone-300 pt-12">
            <h2 className="mb-8 font-['Noto_Serif',serif] text-3xl font-semibold text-emerald-950">
                Đánh giá sản phẩm
            </h2>

            <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
                <div className="flex flex-col gap-6">
                    <div className="rounded-2xl bg-zinc-100 p-8 text-center">
                        <p className="text-5xl font-bold text-emerald-950">
                            {MOCK_SUMMARY.average}
                        </p>
                        <StarRating value={MOCK_SUMMARY.average} size="lg" className="mt-2 justify-center" />
                        <p className="mt-2 text-sm text-neutral-700">
                            Dựa trên {MOCK_SUMMARY.total} đánh giá từ khách hàng
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {MOCK_SUMMARY.distribution.map((row) => (
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
                </div>

                <div className="flex flex-col gap-10">
                    {visibleReviews.map((review, index) => (
                        <div key={review.id}>
                            {index > 0 ? <div className="mb-10 border-t border-stone-300" /> : null}
                            <div className="flex flex-col gap-4">
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
                                <p className="text-base text-zinc-900">{review.content}</p>
                                {review.image ? (
                                    <img
                                        src={review.image}
                                        alt=""
                                        className="h-24 w-24 rounded-lg border border-stone-300 object-cover"
                                    />
                                ) : null}
                            </div>
                        </div>
                    ))}

                    {!expanded && MOCK_SUMMARY.total > MOCK_REVIEWS.length ? (
                        <button
                            type="button"
                            onClick={() => setExpanded(true)}
                            className="inline-flex items-center gap-2 self-start text-base text-emerald-950 transition-colors hover:text-emerald-700"
                        >
                            Xem thêm {MOCK_SUMMARY.total - MOCK_REVIEWS.length} đánh giá khác
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
