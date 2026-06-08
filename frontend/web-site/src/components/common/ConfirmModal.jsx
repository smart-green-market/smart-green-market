import { useState } from "react";
import { X, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "warning", // warning, info, danger
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const variantStyles = {
  warning: {
  icon: ( <AlertTriangle className="w-6 h-6 text-amber-500" />
  ),
      confirmBtn:
          "bg-amber-500 hover:bg-amber-600",

      toastType: "warning",

      successMessage: `${confirmText} dữ liệu thành công`,

      errorMessage: "Không thể cập nhật dữ liệu",
  },

  info: {
      icon: (
          <Info className="w-6 h-6 text-blue-500" />
      ),

      confirmBtn:
          "bg-blue-500 hover:bg-blue-600",

      toastType: "success",

      successMessage: `${confirmText} dữ liệu thành công`,

      errorMessage: "Không thể thêm dữ liệu",
  },

  danger: {
      icon: (
          <AlertTriangle className="w-6 h-6 text-red-500" />
      ),

      confirmBtn:
          "bg-red-500 hover:bg-red-600",

      toastType: "error",

      successMessage: `${confirmText} dữ liệu thành công`,

      errorMessage: "Không thể xóa dữ liệu",
  },
};

const style =
variantStyles[variant] ||
variantStyles.warning;

  const handleConfirm = async () => {
  try {
  setLoading(true);
      await onConfirm();

      // dynamic toast
      if (style.toastType === "success") {
          toast.success(style.successMessage);
      }

      else if (style.toastType === "warning") {
          toast.warning(style.successMessage);
      }

      else if (style.toastType === "error") {
          toast.error(style.successMessage);
      }

      onClose();

  } catch (error) {
      console.error(error);

      toast.error(style.errorMessage);

  } finally {
      setLoading(false);
  }

  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {style.icon}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Footer */}
            <div className="flex gap-3 px-6 py-4 bg-neutral-50 border-t border-neutral-200">
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="cursor-pointer flex-1 px-4 py-2.5 border border-neutral-300 rounded-xl text-neutral-700 font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50"
                >
                    {cancelText}
                </button>

                <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className={`cursor-pointer flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-4 disabled:opacity-50 ${style.confirmBtn}`}
                >
                    {loading
                        ? "Đang xử lý..."
                        : confirmText}
                </button>
            </div>
        </div>
    </div>
  );
}