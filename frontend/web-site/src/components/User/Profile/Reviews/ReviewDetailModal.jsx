import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
    buyerReviewService,
    handleApiError,
} from "../../../../services/api/Buyer/buyerReviewService";
import { useBodyScrollLock } from "../../../../hooks/useBodyScrollLock";
import { normalizeMyReviewItem } from "../../../../utils/buyerReviewUtils";
import { formatDateVi } from "../../../../utils/userProductUtils";
import StarRating from "../../Product/StarRating";
import UpdateReviewModal from "./UpdateReviewModal";

export default function ReviewDetailModal({
    open,
    dealerSlug,
    reviewId,
    onClose,
    onSuccess,
}) {
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [editOpen, setEditOpen] = useState(false);

    useEffect(() => {
        if (!open || !reviewId || !dealerSlug) return undefined;

        let cancelled = false;

        async function loadReview() {
            setLoading(true);
            setError("");
            setReview(null);
            setEditOpen(false);

            try {
                const data = await buyerReviewService.getById(dealerSlug, reviewId);
                if (!cancelled) {
                    setReview(normalizeMyReviewItem(data));
                }
            } catch (err) {
                if (!cancelled) {
                    setError(handleApiError(err, "Không thể tải chi tiết đánh giá."));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadReview();

        return () => {
            cancelled = true;
        };
    }, [open, reviewId, dealerSlug]);

    const handleUpdateSuccess = (updated) => {
        const normalized = normalizeMyReviewItem(updated);
        setReview(normalized);
        setEditOpen(false);
        onSuccess?.(updated);
    };

    useBodyScrollLock(open);

    if (!open) return null;

    return (
        <>
            {!editOpen ? (
            <div
                className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-black/45 p-4"
                role="dialog"
                aria-modal="true"
                onClick={(event) => {
                    if (event.target === event.currentTarget) onClose();
                }}
            >
                <div className="flex max-h-[min(90vh,100dvh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                    <div className="flex items-start justify-between border-b border-stone-200 px-6 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-emerald-950">
                                Chi tiết đánh giá
                            </h2>
                            {review?.product_title ? (
                                <p className="mt-1 text-sm text-neutral-600">
                                    {review.product_title}
                                </p>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1 text-neutral-500 hover:bg-stone-100"
                            aria-label="Đóng modal"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
                            </div>
                        ) : error ? (
                            <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </p>
                        ) : review ? (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <StarRating value={review.rating} size="lg" />
                                    <span className="text-sm font-semibold text-emerald-950">
                                        {review.rating.toFixed(1)} / 5
                                    </span>
                                </div>

                                <div className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-neutral-700">
                                    <p>
                                        Mã đơn:{" "}
                                        <span className="font-medium text-zinc-900">
                                            {review.order_code || `#${review.order_id}`}
                                        </span>
                                    </p>
                                    {review.created_at ? (
                                        <p className="mt-1">
                                            Ngày đánh giá: {formatDateVi(review.created_at)}
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-medium text-neutral-700">
                                        Nội dung
                                    </p>
                                    <p className="text-sm leading-relaxed text-zinc-800">
                                        {review.comment || "Không có nội dung bình luận."}
                                    </p>
                                </div>

                                {review.images?.length ? (
                                    <div>
                                        <p className="mb-2 text-sm font-medium text-neutral-700">
                                            Hình ảnh
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {review.images.map((imageUrl, index) => (
                                                <img
                                                    key={`${review.id}-image-${index}`}
                                                    src={imageUrl}
                                                    alt={`Ảnh đánh giá ${index + 1}`}
                                                    className="h-24 w-24 rounded-xl border border-stone-200 object-cover"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="border-t border-stone-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditOpen(true)}
                                        className="h-11 w-full rounded-xl bg-emerald-800 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
                                    >
                                        Cập nhật đánh giá
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            ) : null}

            <UpdateReviewModal
                open={editOpen}
                dealerSlug={dealerSlug}
                review={review}
                onClose={() => setEditOpen(false)}
                onSuccess={handleUpdateSuccess}
            />
        </>
    );
}
