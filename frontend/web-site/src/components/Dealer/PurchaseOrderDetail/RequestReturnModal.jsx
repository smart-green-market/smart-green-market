import { useState, useEffect, useRef } from "react";
import { X, Upload, Check, AlertTriangle, RotateCcw, Package, FileText } from "lucide-react";
import { toast } from "sonner";

export default function RequestReturnModal({
  isOpen,
  onClose,
  onConfirm,
  loading: externalLoading = false,
  orderItems = [],
}) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [itemsError, setItemsError] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const fileInputRef = useRef(null);

  const loading = externalLoading || internalLoading;

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setReasonError("");
      setEvidenceFile(null);
      setReturnItems([]);
      setItemsError("");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } else if (orderItems) {
      const returnableItems = orderItems.filter((item) => {
        const status = item.review_status || item.item_status;
        return status === "approved" && Number(item.quantity || 0) > 0;
      });
      setReturnItems(
        returnableItems.map((item) => ({
          id: item.id,
          name: item.name,
          unit: item.unit || "Kg",
          product_thumbnail_url: item.product_thumbnail_url,
          price: item.price,
          maxQuantity: item.quantity,
          quantity: "",
          reason: "",
          checked: false,
        }))
      );
    }
  }, [isOpen, orderItems]);

  const hasDetailedReason = returnItems.some((item) => item.checked && item.reason.trim() !== "");

  if (!isOpen) return null;

  const handleCheckboxChange = (id, checked) => {
    setItemsError("");
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            checked,
            quantity: checked ? String(item.maxQuantity) : "",
          };
        }
        return item;
      })
    );
  };

  const handleQuantityChange = (id, val) => {
    setItemsError("");
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const num = parseFloat(val);
          const shouldCheck = !isNaN(num) && num > 0;
          return {
            ...item,
            quantity: val,
            checked: item.checked || shouldCheck,
          };
        }
        return item;
      })
    );
  };

  const handleItemReasonChange = (id, val) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            reason: val,
          };
        }
        return item;
      })
    );
  };

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
    const selected = returnItems.filter((item) => item.checked);
    if (selected.length === 0) {
      setItemsError("Vui lòng chọn ít nhất một sản phẩm để trả hàng.");
      return;
    }

    // Validate quantities for selected items
    for (const item of selected) {
      const q = parseFloat(item.quantity);
      if (isNaN(q) || q <= 0) {
        setItemsError(`Số lượng trả hàng cho "${item.name}" phải là số lớn hơn 0.`);
        return;
      }
      if (q > item.maxQuantity) {
        setItemsError(
          `Số lượng trả hàng cho "${item.name}" không được vượt quá số lượng đã giao (${item.maxQuantity} ${item.unit}).`
        );
        return;
      }
    }

    const trimmedReason = reason.trim();
    const hasDetailedReason = selected.some((item) => item.reason.trim() !== "");

    if (!trimmedReason && !hasDetailedReason) {
      setReasonError("Vui lòng nhập lý do trả hàng chung hoặc chi tiết lỗi cho sản phẩm.");
      return;
    }

    try {
      setInternalLoading(true);
      setReasonError("");
      setItemsError("");

      const payloadItems = selected.map((item) => ({
        purchase_order_item_id: item.id,
        quantity: parseFloat(item.quantity),
        reason: item.reason.trim(),
      }));

      let finalReason = trimmedReason;
      if (!finalReason) {
        const detailedReasons = selected
          .filter((item) => item.reason.trim() !== "")
          .map((item) => `${item.name}: ${item.reason.trim()}`)
          .join("; ");
        finalReason = `Trả hàng theo chi tiết sản phẩm (${detailedReasons})`;
      }

      await onConfirm?.(finalReason, evidenceFile, payloadItems);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-150 px-6 py-4 shrink-0">
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
        <div className="space-y-4 px-6 py-4 overflow-y-auto flex-1">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-amber-800 text-xs font-semibold leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <span>
              Lưu ý: Gửi yêu cầu trả hàng khi nhận hàng lỗi, hỏng hoặc thiếu. Vui lòng cung cấp hình ảnh thực tế làm bằng bằng chứng.
            </span>
          </div>

          {/* Product List Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              Sản phẩm yêu cầu trả <span className="text-red-500">*</span>
            </label>
            
            {itemsError && (
              <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl">
                {itemsError}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto pr-1 space-y-2 border border-neutral-100 rounded-xl p-2 bg-neutral-50/30">
              {returnItems.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4">
                  Không có sản phẩm nào trong phiếu nhập.
                </p>
              ) : (
                returnItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all ${
                      item.checked
                        ? "border-emerald-500 bg-emerald-50/5"
                        : "border-neutral-200 bg-white hover:bg-neutral-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        id={`return-chk-${item.id}`}
                        checked={item.checked}
                        onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 cursor-pointer"
                      />

                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-neutral-50 overflow-hidden shrink-0 border border-neutral-100 flex items-center justify-center">
                        {item.product_thumbnail_url ? (
                          <img
                            src={item.product_thumbnail_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = document.createElement('span');
                              placeholder.className = 'text-neutral-400 font-extrabold text-[10px] uppercase';
                              placeholder.innerText = item.name ? item.name.substring(0, 2) : 'SP';
                              e.target.parentNode.appendChild(placeholder);
                            }}
                          />
                        ) : (
                          <Package className="w-4.5 h-4.5 text-neutral-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={`return-chk-${item.id}`}
                          className="text-xs font-bold text-neutral-800 cursor-pointer hover:text-emerald-700 select-none block truncate"
                        >
                          {item.name}
                        </label>
                        <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">
                          Đã nhận: <span className="text-neutral-700">{item.maxQuantity} {item.unit}</span> | Đơn giá: {item.price.toLocaleString("vi-VN")}đ
                        </p>
                      </div>

                      {/* Quantity Input */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase">Trả:</span>
                        <input
                          type="number"
                          min="0.01"
                          max={item.maxQuantity}
                          step="any"
                          value={item.quantity}
                          disabled={!item.checked}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          placeholder="0.00"
                          className={`w-20 rounded-lg border px-2 py-1 text-right text-xs font-bold text-neutral-800 outline-none transition focus:ring-2 ${
                            item.checked
                              ? "border-emerald-300 focus:ring-emerald-100"
                              : "border-neutral-200 bg-neutral-50 cursor-not-allowed text-neutral-400"
                          }`}
                        />
                        <span className="text-[10px] font-bold text-neutral-500 w-8">{item.unit}</span>
                      </div>
                    </div>

                    {/* Specific reason note for item */}
                    {item.checked && (
                      <div className="mt-2.5 pl-7 flex items-center gap-2 border-t border-neutral-100 pt-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider shrink-0">
                          Chi tiết lỗi:
                        </span>
                        <input
                          type="text"
                          placeholder="Mô tả cụ thể (ví dụ: bị dập, mốc, thiếu 1kg...) (tùy chọn)"
                          value={item.reason}
                          onChange={(e) => handleItemReasonChange(item.id, e.target.value)}
                          className="flex-1 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 outline-none focus:ring-1 focus:ring-emerald-200 focus:border-emerald-400 transition placeholder:text-neutral-300"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label htmlFor="return-reason" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Lý do trả hàng chung {!hasDetailedReason && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id="return-reason"
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError("");
              }}
              placeholder="Nhập lý do trả hàng tổng quan (ví dụ: Hàng giao lỗi nhiều, không đúng chất lượng...)"
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
              Hình ảnh bằng bằng chứng (nếu có)
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
        <div className="flex gap-3 border-t border-neutral-100 bg-neutral-50 px-6 py-4 shrink-0">
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

