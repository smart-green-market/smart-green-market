import React from "react";
import { MapPin, Plus, Phone, User } from "lucide-react";

/**
 * AddressSelector
 * Hiển thị danh sách địa chỉ nhận hàng đã lưu, cho phép chọn 1 địa chỉ
 * và thêm địa chỉ mới.
 *
 * Props:
 * - addresses: Array<{ id, name, phone, address, isDefault }>
 * - selectedId: id địa chỉ đang được chọn
 * - onSelect: (id) => void
 * - onAddNew: () => void
 */
export default function AddressSelector({
  addresses = [],
  selectedId,
  onSelect,
  onAddNew,
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <MapPin size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Địa chỉ nhận hàng
            </h2>
            <p className="text-sm text-slate-400">
              Chọn địa chỉ để giao đơn hàng của bạn
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-900"
        >
          <Plus size={16} />
          Thêm địa chỉ mới
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-400">
          Chưa có địa chỉ nhận hàng. Hãy thêm địa chỉ mới.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => {
            const isSelected = addr.id === selectedId;
            return (
              <label
                key={addr.id}
                className={`relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition ${
                  isSelected
                    ? "border-emerald-700 bg-emerald-50/60 ring-1 ring-emerald-700"
                    : "border-slate-200 bg-white hover:border-emerald-300"
                }`}
              >
                <input
                  type="radio"
                  name="shipping-address"
                  className="absolute right-4 top-4 h-4 w-4 accent-emerald-800"
                  checked={isSelected}
                  onChange={() => onSelect(addr.id)}
                />

                <div className="flex items-center gap-2 pr-6">
                  <User size={14} className="text-slate-400" />
                  <span className="font-semibold text-slate-800">
                    {addr.name}
                  </span>
                  {addr.isDefault && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      Mặc định
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Phone size={14} className="text-slate-400" />
                  {addr.phone}
                </div>

                <p className="text-sm leading-relaxed text-slate-600">
                  {addr.address}
                </p>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}
