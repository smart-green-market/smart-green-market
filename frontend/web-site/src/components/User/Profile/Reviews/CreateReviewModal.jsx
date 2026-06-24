import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import {
    buyerReviewService,
    handleApiError,
} from "../../../../services/api/Buyer/buyerReviewService";
import {
    buildReviewFormData,
    validateReviewForm,
} from "../../../../utils/buyerReviewUtils";
import { appToast } from "../../../common/toast";
import BuyerConfirmModal from "../../Ui/BuyerConfirmModal";
import { useBodyScrollLock } from "../../../../hooks/useBodyScrollLock";

const MAX_IMAGES = 5;

const RATING_LABELS = {
    1: "Rất tệ",
    2: "Tệ",
    3: "Bình thường",
    4: "Tốt",
    5: "Tuyệt vời",
};

function createLocalImage(file) {
    return {
        key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
    };
}

export default function CreateReviewModal({
    open,
    dealerSlug,
    item,
    onClose,
    onSuccess,
}) {
    const inputRef = useRef(null);
    const inputId = useId();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [images, setImages] = useState([]);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    useEffect(() => {
        if (!open) return;

        setRating(5);
        setComment("");
        setImages([]);
        setError("");
        setShowSubmitConfirm(false);
    }, [open, item?.order_id, item?.dealer_product_id]);

    useBodyScrollLock(open);

    if (!open || !item) return null;

    const handlePickImages = (event) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (!files.length) return;

        const invalid = files.find((file) => !file.type.startsWith("image/"));
        if (invalid) {
            setError("Vui lòng chọn file ảnh hợp lệ (JPG, PNG, WEBP).");
            return;
        }

        const remaining = MAX_IMAGES - images.length;
        if (remaining <= 0) {
            setError(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh.`);
            return;
        }

        const nextFiles = files.slice(0, remaining);
        if (files.length > remaining) {
            setError(`Chỉ thêm được ${remaining} ảnh nữa (tối đa ${MAX_IMAGES}).`);
        } else {
            setError("");
        }

        setImages((prev) => [...prev, ...nextFiles.map(createLocalImage)]);
    };

    const handleRemoveImage = (key) => {
        setImages((prev) => {
            const target = prev.find((image) => image.key === key);
            if (target?.preview) URL.revokeObjectURL(target.preview);
            return prev.filter((image) => image.key !== key);
        });
        setError("");
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const imageFiles = images.map((image) => image.file);
        const validationError = validateReviewForm({ rating, imageFiles });
        if (validationError) {
            setError(validationError);
            return;
        }

        setError("");
        setShowSubmitConfirm(true);
    };

    const handleConfirmSubmit = async () => {
        const imageFiles = images.map((image) => image.file);

        setSubmitting(true);
        setError("");

        try {
            const formData = buildReviewFormData({
                order_id: item.order_id,
                dealer_product_id: item.dealer_product_id,
                rating,
                comment,
                imageFiles,
            });

            const created = await buyerReviewService.create(dealerSlug, formData);
            appToast.success("Đánh giá sản phẩm thành công.");
            setShowSubmitConfirm(false);
            onSuccess?.(created);
            onClose?.();
        } catch (err) {
            setError(handleApiError(err, "Không thể gửi đánh giá. Vui lòng thử lại."));
            setShowSubmitConfirm(false);
        } finally {
            setSubmitting(false);
        }
    };

    const canAddMore = images.length < MAX_IMAGES;

    return (
        <>
            <div
                className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-black/45 p-4 backdrop-blur-[1px]"
                role="dialog"
                aria-modal="true"
                onClick={(event) => {
                    if (event.target === event.currentTarget) onClose();
                }}
            >
                <div className="flex max-h-[min(90vh,100dvh)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="shrink-0 border-b border-stone-100 px-6 py-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-lg font-semibold text-emerald-950">
                                Đánh giá sản phẩm
                            </h2>
                            <p className="mt-1 truncate text-sm text-neutral-500">
                                {item.product_title}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-stone-100 hover:text-neutral-700"
                            aria-label="Đóng modal"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 py-5">
                    <section className="rounded-xl bg-stone-50 px-4 py-5">
                        <p className="mb-3 text-center text-sm font-medium text-neutral-700">
                            Chọn số sao
                        </p>
                        <div className="flex justify-center gap-2">
                            {Array.from({ length: 5 }, (_, index) => {
                                const value = index + 1;
                                const active = value <= rating;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setRating(value)}
                                        className="cursor-pointer rounded-lg p-1 transition-transform hover:scale-110 active:scale-95"
                                        aria-label={`${value} sao`}
                                    >
                                        <Star
                                            className={`h-9 w-9 ${
                                                active
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-stone-300"
                                            }`}
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-2 text-center text-sm font-medium text-amber-600">
                            {rating}/5 — {RATING_LABELS[rating]}
                        </p>
                    </section>

                    

                    <section>
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-neutral-700">
                                Hình ảnh
                            </p>
                            <span className="text-xs text-neutral-400">
                                {images.length}/{MAX_IMAGES}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                            {images.map((image) => (
                                <div
                                    key={image.key}
                                    className="relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-50"
                                >
                                    <img
                                        src={image.preview}
                                        alt="Ảnh đánh giá"
                                        className="h-full w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            handleRemoveImage(image.key);
                                        }}
                                        className="cursor-pointer absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-600"
                                        aria-label="Xóa ảnh"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            {canAddMore ? (
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="cursor-pointer flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 bg-stone-50 text-neutral-500 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-700"
                                >
                                    <ImagePlus className="h-6 w-6" />
                                    <span className="px-1 text-center text-[10px] font-medium leading-tight">
                                        {images.length === 0
                                            ? "Thêm ảnh"
                                            : "Thêm nữa"}
                                    </span>
                                </button>
                            ) : null}
                        </div>

                        <input
                            ref={inputRef}
                            id={inputId}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handlePickImages}
                        />

                        <p className="mt-2 text-xs text-neutral-500">
                            Tối thiểu 1 ảnh, tối đa {MAX_IMAGES} ảnh. Nhấn{" "}
                            <span className="font-medium">×</span> trên ảnh để
                            xóa trước khi gửi.
                        </p>
                    </section>

                    <section>
                        <label
                            htmlFor="review-comment"
                            className="mb-2 block text-sm font-medium text-neutral-700"
                        >
                            Nội dung đánh giá
                        </label>
                        <textarea
                            id="review-comment"
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            rows={4}
                            placeholder="Chia sẻ trải nghiệm về sản phẩm..."
                            className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                    </section>

                    {error ? (
                        <p
                            role="alert"
                            className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    ) : null}
                    </div>

                    <div className="flex shrink-0 gap-3 border-t border-stone-100 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="cursor-pointer h-11 flex-1 rounded-xl border border-stone-200 text-sm font-semibold text-neutral-700 transition-colors hover:bg-stone-50 disabled:opacity-60"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="cursor-pointer inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-800 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                "Gửi đánh giá"
                            )}
                        </button>
                    </div>
                </form>
                </div>
            </div>

            <BuyerConfirmModal
                open={showSubmitConfirm}
                onClose={() => !submitting && setShowSubmitConfirm(false)}
                onConfirm={handleConfirmSubmit}
                title="Xác nhận gửi đánh giá"
                message={
                    <span>
                        Bạn có chắc muốn gửi đánh giá{" "}
                        <strong className="font-semibold text-emerald-950">
                            {rating}/5 sao ({RATING_LABELS[rating]})
                        </strong>{" "}
                        cho sản phẩm{" "}
                        <strong className="font-semibold text-emerald-950">
                            {item.product_title}
                        </strong>
                        ?
                    </span>
                }
                confirmText="Gửi đánh giá"
                cancelText="Quay lại"
                variant="info"
                loading={submitting}
            />
        </>
    );
}
