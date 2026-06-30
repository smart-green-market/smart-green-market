import { useEffect, useState } from "react";
import { ImagePlus, RotateCcw, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import {
    buyerOrder,
    handleApiError,
} from "../../../services/api/Buyer/buyerOrder";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 5;

function ImagePreviewLightbox({ src, alt, onClose }) {
    if (!src) return null;

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
            onClick={onClose}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Đóng xem ảnh"
            >
                <X size={22} />
            </button>
            <img
                src={src}
                alt={alt}
                className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            />
        </div>
    );
}

export default function ReturnOrderModal({
    isOpen,
    onClose,
    dealerSlug,
    order,
    onSuccess,
}) {
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState("");
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setReason("");
            setReasonError("");
            setEvidenceFile(null);
            setPreviewUrl("");
            setLightboxOpen(false);
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    if (!isOpen || !order) return null;

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            toast.warning("Vui lòng chọn file ảnh hợp lệ (JPG, PNG, WEBP).");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            toast.warning(`Ảnh không được lớn hơn ${MAX_FILE_SIZE_MB}MB.`);
            event.target.value = "";
            return;
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setEvidenceFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        event.target.value = "";
    };

    const handleRemoveImage = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setEvidenceFile(null);
        setPreviewUrl("");
    };

    const handleSubmit = async () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setReasonError("Vui lòng nhập lý do trả hàng.");
            return;
        }

        try {
            setLoading(true);
            setReasonError("");

            const payload = new FormData();
            payload.append("reason", trimmed);
            if (evidenceFile) {
                payload.append("evidence_file", evidenceFile);
            }

            await buyerOrder.returnOrder(dealerSlug, order.id, payload);
            toast.success("Đã gửi yêu cầu trả hàng thành công.");
            onSuccess?.();
            onClose?.();
        } catch (error) {
            toast.error(handleApiError(error, "Không thể gửi yêu cầu trả hàng."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
                <div className="mx-4 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-amber-100 bg-white shadow-xl">
                    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                                <RotateCcw className="h-5 w-5 text-amber-700" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Trả hàng</h3>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                        <p className="text-sm text-gray-600">
                            Yêu cầu trả toàn bộ đơn{" "}
                            <span className="font-semibold text-gray-900">{order.order_code}</span>.
                            Vui lòng mô tả lý do và đính kèm ảnh chứng minh (nếu có).
                        </p>

                        <div className="space-y-2">
                            <label
                                htmlFor="return-reason"
                                className="text-sm font-medium text-neutral-700"
                            >
                                Lý do trả hàng <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="return-reason"
                                rows={4}
                                value={reason}
                                onChange={(event) => {
                                    setReason(event.target.value);
                                    if (reasonError) setReasonError("");
                                }}
                                placeholder="Nhập lý do trả hàng..."
                                className={`w-full resize-none rounded-lg border px-4 py-3 text-sm text-zinc-900 outline-none transition focus:ring-2 ${
                                    reasonError
                                        ? "border-red-400 focus:ring-red-200"
                                        : "border-stone-300 focus:ring-amber-200"
                                }`}
                            />
                            {reasonError ? (
                                <p className="text-sm text-red-600">{reasonError}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-neutral-700">
                                Ảnh chứng minh (tùy chọn)
                            </p>

                            {previewUrl ? (
                                <div className="relative inline-block">
                                    <button
                                        type="button"
                                        onClick={() => setLightboxOpen(true)}
                                        className="group relative overflow-hidden rounded-xl border border-stone-200"
                                    >
                                        <img
                                            src={previewUrl}
                                            alt="Ảnh chứng minh trả hàng"
                                            className="h-36 w-36 object-cover"
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/35">
                                            <ZoomIn className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" />
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                                        aria-label="Xóa ảnh"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center transition hover:border-amber-400 hover:bg-amber-50/40">
                                    <ImagePlus className="h-8 w-8 text-stone-400" />
                                    <span className="text-sm font-medium text-stone-600">
                                        Chọn ảnh chứng minh
                                    </span>
                                    <span className="text-xs text-stone-400">
                                        JPG, PNG, WEBP — tối đa {MAX_FILE_SIZE_MB}MB
                                    </span>
                                    <input
                                        type="file"
                                        accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 cursor-pointer rounded-xl border border-neutral-300 px-4 py-2.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                        >
                            Đóng
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 cursor-pointer rounded-xl bg-amber-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                        >
                            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
                        </button>
                    </div>
                </div>
            </div>

            {lightboxOpen ? (
                <ImagePreviewLightbox
                    src={previewUrl}
                    alt="Ảnh chứng minh trả hàng"
                    onClose={() => setLightboxOpen(false)}
                />
            ) : null}
        </>
    );
}
