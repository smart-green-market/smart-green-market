import { CalendarDays, ClipboardList, Package } from "lucide-react";
import { formatDateVi } from "../../../../utils/userProductUtils";
import StarRating from "../../Product/StarRating";

function ProductThumb({ title, imageUrl }) {
    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={title}
                className="h-[72px] w-[72px] shrink-0 rounded-2xl border border-stone-100 object-cover shadow-sm md:h-[88px] md:w-[88px]"
            />
        );
    }

    return (
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm md:h-[88px] md:w-[88px]">
            <Package className="h-8 w-8 text-emerald-700/80" strokeWidth={1.5} />
        </div>
    );
}

function MetaRow({ icon: Icon, children }) {
    return (
        <div className="flex items-start gap-1.5 text-sm text-neutral-500">
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <span className="min-w-0 break-all leading-snug">{children}</span>
        </div>
    );
}

function StatusBadge({ tone = "pending", children }) {
    const tones = {
        pending: "bg-amber-50 text-amber-700 ring-amber-100",
        reviewed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    };

    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${tones[tone]}`}
        >
            {children}
        </span>
    );
}

function ActionButton({ variant = "secondary", onClick, children, className = "" }) {
    const styles =
        variant === "primary"
            ? "bg-emerald-800 text-white hover:bg-emerald-900 shadow-sm shadow-emerald-900/10"
            : variant === "outline"
              ? "border border-emerald-800 bg-white text-emerald-800 hover:bg-emerald-50"
              : "border border-stone-200 bg-white text-neutral-700 hover:border-stone-300 hover:bg-stone-50";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-10 cursor-pointer items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all ${styles} ${className}`}
        >
            {children}
        </button>
    );
}

export default function PendingReviewCard({ item, onViewOrder, onReview }) {
    const orderLabel = item.order_code || `#${item.order_id}`;

    return (
        <article className="group overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-all hover:border-emerald-200/80 hover:shadow-md">
            {/* Desktop */}
            <div className="hidden md:flex md:items-center md:gap-6 md:p-6">
                <ProductThumb
                    title={item.product_title}
                    imageUrl={item.product_thumbnail_url}
                />

                <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                            <h3 className="truncate text-lg font-semibold tracking-tight text-emerald-950">
                                {item.product_title}
                            </h3>
                            <MetaRow icon={ClipboardList}>
                                Mã đơn{" "}
                                <span className="font-medium text-zinc-800">
                                    {orderLabel}
                                </span>
                            </MetaRow>
                        </div>
                        <StatusBadge tone="pending">Chưa đánh giá</StatusBadge>
                    </div>

                    {item.completed_at ? (
                        <MetaRow icon={CalendarDays}>
                            Hoàn thành{" "}
                            <span className="font-medium text-neutral-600">
                                {formatDateVi(item.completed_at)}
                            </span>
                        </MetaRow>
                    ) : null}
                </div>

                <div className="flex w-[168px] shrink-0 flex-col gap-2">
                    <ActionButton
                        className="w-full"
                        onClick={() => onViewOrder?.(item.order_id)}
                    >
                        Xem chi tiết
                    </ActionButton>
                    <ActionButton
                        className="w-full"
                        variant="primary"
                        onClick={() => onReview?.(item)}
                    >
                        Đánh giá
                    </ActionButton>
                </div>
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-4 p-4 md:hidden">
                <div className="flex items-start gap-3">
                    <ProductThumb
                        title={item.product_title}
                        imageUrl={item.product_thumbnail_url}
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold leading-snug text-emerald-950">
                                {item.product_title}
                            </h3>
                            <StatusBadge tone="pending">Chưa đánh giá</StatusBadge>
                        </div>
                        <MetaRow icon={ClipboardList}>
                            Mã đơn{" "}
                            <span className="font-medium text-zinc-800">
                                {orderLabel}
                            </span>
                        </MetaRow>
                        {item.completed_at ? (
                            <MetaRow icon={CalendarDays}>
                                Hoàn thành{" "}
                                <span className="font-medium text-neutral-600">
                                    {formatDateVi(item.completed_at)}
                                </span>
                            </MetaRow>
                        ) : null}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <ActionButton
                        className="w-full"
                        onClick={() => onViewOrder?.(item.order_id)}
                    >
                        Xem chi tiết
                    </ActionButton>
                    <ActionButton
                        className="w-full"
                        variant="primary"
                        onClick={() => onReview?.(item)}
                    >
                        Đánh giá
                    </ActionButton>
                </div>
            </div>
        </article>
    );
}

export function MyReviewCard({ item, onViewOrder, onViewReview }) {
    const orderLabel = item.order_code || `#${item.order_id}`;

    const contentBlock = (isMobile) => (
        <div className="min-w-0 flex-1 space-y-2 md:space-y-3">
            <div
                className={
                    isMobile
                        ? "space-y-2"
                        : "flex items-start justify-between gap-3"
                }
            >
                <div className={`min-w-0 space-y-1 ${isMobile ? "" : "flex-1"}`}>
                    <div
                        className={
                            isMobile
                                ? "flex flex-wrap items-center gap-2"
                                : undefined
                        }
                    >
                        <h3
                            className={`font-semibold tracking-tight text-emerald-950 ${
                                isMobile
                                    ? "text-base leading-snug"
                                    : "truncate text-lg"
                            }`}
                        >
                            {item.product_title}
                        </h3>
                        {isMobile ? (
                            <StatusBadge tone="reviewed">Đã đánh giá</StatusBadge>
                        ) : null}
                    </div>
                    <MetaRow icon={ClipboardList}>
                        Mã đơn{" "}
                        <span className="font-medium text-zinc-800">
                            {orderLabel}
                        </span>
                    </MetaRow>
                </div>
                {!isMobile ? (
                    <StatusBadge tone="reviewed">Đã đánh giá</StatusBadge>
                ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <StarRating value={item.rating} size="md" />
                <span className="text-sm font-semibold text-amber-600">
                    {item.rating.toFixed(1)}
                </span>
                {item.created_at ? (
                    <span className="text-xs text-neutral-500 md:text-sm">
                        • {formatDateVi(item.created_at)}
                    </span>
                ) : null}
            </div>

            {item.comment ? (
                <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600">
                    {item.comment}
                </p>
            ) : (
                <p className="text-sm italic text-neutral-400">
                    Không có nội dung bình luận
                </p>
            )}
        </div>
    );

    return (
        <article className="group overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-all hover:border-emerald-200/80 hover:shadow-md">
            <div className="hidden md:flex md:items-center md:gap-6 md:p-6">
                <ProductThumb title={item.product_title} imageUrl={item.images?.[0]} />
                {contentBlock(false)}
                <div className="flex w-[168px] shrink-0 flex-col gap-2">
                    <ActionButton
                        className="w-full"
                        onClick={() => onViewOrder?.(item.order_id)}
                    >
                        Chi tiết đơn
                    </ActionButton>
                    <ActionButton
                        className="w-full"
                        variant="outline"
                        onClick={() => onViewReview?.(item.id)}
                    >
                        Xem đánh giá
                    </ActionButton>
                </div>
            </div>

            <div className="flex flex-col gap-4 p-4 md:hidden">
                <div className="flex items-start gap-3">
                    <ProductThumb
                        title={item.product_title}
                        imageUrl={item.images?.[0]}
                    />
                    {contentBlock(true)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <ActionButton
                        className="w-full"
                        onClick={() => onViewOrder?.(item.order_id)}
                    >
                        Chi tiết đơn
                    </ActionButton>
                    <ActionButton
                        className="w-full"
                        variant="outline"
                        onClick={() => onViewReview?.(item.id)}
                    >
                        Xem đánh giá
                    </ActionButton>
                </div>
            </div>
        </article>
    );
}
