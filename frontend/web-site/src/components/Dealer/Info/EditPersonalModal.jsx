import { useState } from "react";

export default function EditPersonalModal({ account, onClose, onSave, isSaving }) {
  const initial = {
    full_name: account?.full_name || "",
    email: account?.email || "",
    phone: account?.phone || "",
  };
  const [form, setForm] = useState(initial);
  const isDirty = Object.keys(initial).some((key) => form[key] !== initial[key]);

  const fields = [
    { label: "Họ và tên", key: "full_name", type: "text" },
    { label: "Email", key: "email", type: "email" },
    { label: "Số điện thoại", key: "phone", type: "tel" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={!isSaving ? onClose : undefined} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
        <h3 className="text-base font-semibold text-emerald-950 mb-5">Chỉnh sửa thông tin cá nhân</h3>
        <div className="flex flex-col gap-4">
          {fields.map(({ label, key, type }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                disabled={isSaving}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                  form[key] !== initial[key] ? "border-emerald-600 focus:border-emerald-600" : "border-gray-200 focus:border-emerald-500"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isSaving || !isDirty}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center ${
              isSaving ? "bg-emerald-400 cursor-not-allowed" : isDirty ? "bg-emerald-700 hover:bg-emerald-800 cursor-pointer" : "bg-emerald-300 cursor-not-allowed"
            }`}
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
