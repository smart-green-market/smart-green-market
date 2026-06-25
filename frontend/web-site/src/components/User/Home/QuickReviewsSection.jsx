import { Star } from "lucide-react";

const REVIEWS = [
    {
        name: "Chị Lan",
        role: "Nội trợ tại Quận 7, TP.HCM",
        avatar: "https://placehold.co/80x80/e8f5ef/006c49?text=Lan",
        content:
            "Rau củ ở đây rất tươi, giao hàng nhanh và đóng gói cẩn thận. Gia đình tôi rất hài lòng vì không lo hóa chất.",
    },
    {
        name: "Anh Minh",
        role: "Chủ nhà hàng tại Quận 1",
        avatar: "https://placehold.co/80x80/e8f5ef/006c49?text=Minh",
        content:
            "Hợp tác hơn 1 năm, chất lượng nông sản ổn định, giá hợp lý. Nguồn hàng đáng tin cậy cho nhà hàng.",
    },
    {
        name: "Cô Hương",
        role: "Giáo viên tại Quận Bình Thạnh",
        avatar: "https://placehold.co/80x80/e8f5ef/006c49?text=Huong",
        content:
            "Đặt hàng online rất tiện, giao đúng giờ. Rau sạch, giá tốt hơn siêu thị nhiều. Sẽ tiếp tục ủng hộ.",
    },
];

function StarRating() {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => (
                <Star
                    key={index}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                />
            ))}
        </div>
    );
}

export default function QuickReviewsSection() {
    return (
        <section className="bg-white py-14 sm:py-16">
            <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
                <div className="mb-10 text-center">
                    <h2 className="text-2xl font-bold text-emerald-950 sm:text-3xl">
                        Khách hàng nói gì về chúng tôi
                    </h2>
                    <p className="mt-2 text-sm text-neutral-500 sm:text-base">
                        Nghe chia sẻ từ những khách hàng đã tin tưởng sử dụng sản
                        phẩm của Smart Green Market
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {REVIEWS.map((review) => (
                        <article
                            key={review.name}
                            className="rounded-2xl border border-stone-100 bg-stone-50/50 p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <img
                                    src={review.avatar}
                                    alt={review.name}
                                    className="h-12 w-12 rounded-full border-2 border-emerald-100 object-cover"
                                />
                                <div>
                                    <p className="font-semibold text-emerald-950">
                                        {review.name}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        {review.role}
                                    </p>
                                </div>
                            </div>
                            <p className="mt-4 text-sm italic leading-relaxed text-neutral-600">
                                &ldquo;{review.content}&rdquo;
                            </p>
                            <div className="mt-4">
                                <StarRating />
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
