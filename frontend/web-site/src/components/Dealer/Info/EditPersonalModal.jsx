import { useState } from "react";

export default function EditPersonalModal({ account, onClose, onSave, isSaving }) {
  const initial = {
    full_name: account?.full_name || "",
    email: account?.email || "",
    phone: account?.phone || "",
  };
  const [form, setForm] = useState(initial);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(account?.avatar_url || account?.avatar || "");

  const isDirty = Object.keys(initial).some((key) => form[key] !== initial[key]) || !!avatarFile;

  const fields = [
    { label: "Họ và tên", key: "full_name", type: "text" },
    { label: "Email", key: "email", type: "email" },
    { label: "Số điện thoại", key: "phone", type: "tel" },
  ];

  const handleSave = () => {
    onSave({
      ...form,
      avatarFile,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={!isSaving ? onClose : undefined} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
        <h3 className="text-base font-semibold text-emerald-950 mb-5">Chỉnh sửa thông tin cá nhân</h3>

        {/* Chọn ảnh đại diện (Avatar) */}
        <div className="flex flex-col items-center gap-2 mb-5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ảnh đại diện</label>
          <div className="flex flex-col items-center gap-3">
            <label className="relative group w-20 h-20 cursor-pointer block">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-20 h-20 rounded-full object-cover border border-gray-200 group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-700 font-bold text-2xl flex items-center justify-center border border-dashed border-emerald-300 group-hover:bg-emerald-100 transition-colors">
                  {form.full_name ? form.full_name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-semibold">
                Thay đổi
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setForm(f => ({ ...f })); // Trigger dirty state check update
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }
                }}
                disabled={isSaving}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {fields.map(({ label, key, type }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                disabled={isSaving}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${form[key] !== initial[key] ? "border-emerald-600 focus:border-emerald-600" : "border-gray-200 focus:border-emerald-500"
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
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center ${isSaving ? "bg-emerald-400 cursor-not-allowed" : isDirty ? "bg-emerald-700 hover:bg-emerald-800 cursor-pointer" : "bg-emerald-300 cursor-not-allowed"
              }`}
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
