import { MapPin, X } from "lucide-react";

export default function AddAddressModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-[672px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-300 bg-zinc-100 px-8 py-6">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-teal-800" />
            <h3 className="text-2xl font-semibold text-emerald-950">Thêm địa chỉ mới</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-zinc-200">
            <X className="h-4 w-4 text-zinc-900" />
          </button>
        </div>

        <div className="max-h-[62vh] space-y-6 overflow-y-auto p-8">
          <Field label="Tên người nhận" placeholder="Nhập họ và tên" />
          <Field label="Số điện thoại" placeholder="Nhập số điện thoại" />
          <Field label="Tỉnh/Thành phố" placeholder="Chọn tỉnh/thành" asSelect />
          <Field label="Quận/Huyện" placeholder="Chọn quận/huyện" asSelect />
          <Field label="Phường/Xã" placeholder="Chọn phường/xã" asSelect />
          <Field label="Số nhà/Tên đường" placeholder="Ví dụ: 123 Đường Hàm Nghi" />
          <Field label="Ghi chú thêm" placeholder="Nhà cao, cổng trắng" multiline />

          <label className="inline-flex items-center gap-3">
            <input type="checkbox" className="h-5 w-5 rounded border border-stone-300" />
            <span className="text-base text-zinc-900">Đặt làm địa chỉ mặc định</span>
          </label>
        </div>

        <div className="flex justify-end gap-4 border-t border-stone-300 bg-zinc-100 p-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg outline outline-1 outline-neutral-500 px-8 py-3 text-base text-neutral-700"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-teal-800 px-8 py-3 text-base text-white hover:bg-teal-900"
          >
            Lưu địa chỉ
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, multiline = false, asSelect = false }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold tracking-wide text-neutral-700">{label}</p>
      {multiline ? (
        <textarea
          rows={3}
          placeholder={placeholder}
          className="w-full rounded-lg bg-gray-50 px-4 py-3.5 text-base text-gray-500 outline outline-1 outline-stone-300"
        />
      ) : (
        <div className="relative">
          <input
            placeholder={placeholder}
            readOnly={asSelect}
            className="w-full rounded-lg bg-gray-50 px-4 py-3.5 text-base text-gray-500 outline outline-1 outline-stone-300"
          />
          {asSelect && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              ▼
            </span>
          )}
        </div>
      )}
    </div>
  );
}
