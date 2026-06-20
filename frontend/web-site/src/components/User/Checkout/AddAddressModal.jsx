import React, { useState } from "react";
import { X } from "lucide-react";

/**
 * AddAddressModal
 * Modal form để thêm địa chỉ nhận hàng mới.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onSave: (address: { name, phone, address, isDefault }) => void
 */
export default function AddAddressModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    isDefault: false,
  });

  if (!open) return null;

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) return;
    onSave(form);
    setForm({ name: "", phone: "", address: "", isDefault: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            Thêm địa chỉ mới
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Họ tên người nhận">
            <input
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Nguyễn Văn A"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </Field>

          <Field label="Số điện thoại">
            <input
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              placeholder="09xxxxxxxx"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </Field>

          <Field label="Địa chỉ chi tiết">
            <textarea
              value={form.address}
              onChange={handleChange("address")}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
              rows={3}
              required
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={handleChange("isDefault")}
              className="h-4 w-4 accent-emerald-800"
            />
            Đặt làm địa chỉ mặc định
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-emerald-800 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
            >
              Lưu địa chỉ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}
