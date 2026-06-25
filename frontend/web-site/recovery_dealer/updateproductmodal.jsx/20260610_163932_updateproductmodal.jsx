import { useState } from "react";
import { Tag, X, ClipboardList } from "lucide-react";
export default function UpdateProductModal({ data, onClose }) {
  const [adjustment, setAdjustment] = useState(0)
  const [reason, setReason] = useState("")
  const [discount, setDiscount] = useState(0)
  const [discountDate, setDiscountDate] = useState("")

  const handleSubmit = async () => {
    // await api.patch(`/inventory/${data.id}/`, { adjustment, reason, discount })
    console.log("Luu thay doi");
    onClose()
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose} // click ngoài để đóng
    >
      {/* Modal box — stopPropagation để click trong không đóng */}
      <div
        className="bg-white rounded-2xl shadow-xl w-[480px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-neutral-800">
            Cập nhật Sản phẩm
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section: Cập nhật tồn kho */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-neutral-700">
              Cập nhật tồn kho
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">
                Số lượng hiện tại
              </label>
              <input
                type="number"
                value={data.stock}
                disabled
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-neutral-50 text-neutral-400"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">
                Số lượng điều chỉnh (+/-)
              </label>
              <input
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs text-neutral-500 mb-1 block">
              Lý do điều chỉnh
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Chọn lý do...</option>
              <option value="damage">Hàng hỏng</option>
              <option value="recount">Kiểm kê lại</option>
              <option value="return">Trả hàng NCC</option>
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-100 my-4" />

        {/* Section: Áp dụng khuyến mãi */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-neutral-700">
              Áp dụng khuyến mãi
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">
                Mức giảm giá (%)
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">
                Thời gian áp dụng
              </label>
              <input
                type="date"
                value={discountDate}
                onChange={(e) => setDiscountDate(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}