import { Loader2 } from "lucide-react";

/**
 * Props:
 *   saving           : boolean
 *   loadingSellingIds: boolean
 *   btnColor         : string
 *   onClose          : () => void
 *   onSubmit         : () => void
 */
export default function ModalFooter({ saving, loadingSellingIds, btnColor, onClose, onSubmit }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between bg-stone-50 rounded-b-2xl flex-shrink-0">
      <p className="text-xs text-zinc-400">
        <span className="text-red-500 font-semibold">*</span> Các trường thông tin bắt buộc
      </p>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-zinc-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-50"
        >
          Hủy
        </button>

        <button
          onClick={onSubmit}
          disabled={saving || loadingSellingIds}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white ${btnColor} rounded-lg transition-colors disabled:opacity-70 min-w-[130px] justify-center`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</>
          ) : loadingSellingIds ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Đang tải...</>
          ) : (
            "Lưu sản phẩm"
          )}
        </button>
      </div>
    </div>
  );
}
