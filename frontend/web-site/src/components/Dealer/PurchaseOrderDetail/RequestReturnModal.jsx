import { useState, useEffect, useRef } from "react";
import { X, Upload, Check, AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function RequestReturnModal({
  isOpen,
  onClose,
  onConfirm,
  loading: externalLoading = false,
}) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const fileInputRef = useRef(null);

  const loading = externalLoading || internalLoading;

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setReasonError("");
      setEvidenceFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Tệp quá lớn. Vui lòng chọn tệp dưới 5MB.");
        return;
      }
      setEvidenceFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Chỉ hỗ trợ tải lên hình ảnh!");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Tệp quá lớn. Vui lòng chọn tệp dưới 5MB.");
        return;
      }
      setEvidenceFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setEvidenceFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmSubmit = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setReasonError("Vui lòng nhập lý do trả hàng.");
      return;
    }

    try {
      setInternalLoading(true);
      setReasonError("");
      await onConfirm?.(trimmedReason, evidenceFile);
      onClose();
    } catch (error) {
      console.error(error);
      // Lỗi sẽ được xử lý ở component cha hoặc hiện trong onConfirm
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-150 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
              <RotateCcw className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Yêu cầu trả hàng</h3>
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

        {/* Body */}
        <div className="space-y-4 px-6 py-4">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-amber-800 text-xs font-semibold leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <span>
              Lưu ý: Gửi yêu cầu trả hàng khi nhận hàng lỗi, hỏng hoặc thiếu. Vui lòng cung cấp hình ảnh thực tế làm bằng bằng chứng.
            </span>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label htmlFor="return-reason" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Lý do trả hàng <span className="text-red-500">*</span>
            </label>
            <textarea
              id="return-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError("");
              }}
              placeholder="Nhập lý do trả hàng cụ thể (mặt hàng bị lỗi, số lượng sai...)"
              className={`w-full resize-none rounded-xl border px-4 py-3 text-sm text-zinc-900 outline-none transition focus:ring-2 ${
                reasonError
                  ? "border-red-400 focus:ring-red-200"
                  : "border-stone-300 focus:ring-red-200"
              }`}
            />
            {reasonError && <p className="text-xs text-red-600 font-semibold">{reasonError}</p>}
          </div>

          {/* Evidence File Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Hình ảnh bằng chứng (nếu có)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`group border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                evidenceFile 
                  ? "border-emerald-500 bg-emerald-50/15" 
                  : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-300"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {previewUrl ? (
                <div className="relative w-full max-w-[120px] aspect-square rounded-lg border border-neutral-200 overflow-hidden shadow-xs">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                    <Upload className="w-4 h-4 text-neutral-400 group-hover:text-red-500 transition-colors" />
                  </div>
                  <p className="text-xs font-bold text-neutral-600 group-hover:text-red-700 transition-colors">
                    Kéo thả hoặc nhấp để chọn ảnh chụp
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Hỗ trợ JPG, PNG (Tối đa 5MB)
                  </p>
                </div>
              )}
            </div>

            {evidenceFile && !previewUrl && (
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/20 text-xs font-semibold text-emerald-800">
                <span className="truncate max-w-[240px]">{evidenceFile.name}</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 hover:bg-emerald-100 rounded-full text-emerald-600 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-neutral-100 bg-neutral-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 cursor-pointer rounded-xl border border-neutral-300 px-4 py-2.5 text-xs font-bold text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleConfirmSubmit}
            disabled={loading}
            className="flex-1 cursor-pointer rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 text-xs font-bold text-white transition-all shadow-md shadow-red-500/10 hover:shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}
