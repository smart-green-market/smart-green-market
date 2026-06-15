import { useState, useRef } from "react";

export default function EditStoreModal({ profile, onClose, onSave, isSaving }) {
  const initial = {
    store_name: profile.store_name || "",
    store_address: profile.store_address || "",
    description: profile.description || "",
  };
  const [form, setForm] = useState(initial);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(profile.logo_url || null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const isDirty = Object.keys(initial).some((key) => form[key] !== initial[key]) || logoFile !== null;

  const fields = [
    { label: "Tên cửa hàng", key: "store_name", type: "text" },
    { label: "Địa chỉ cửa hàng", key: "store_address", type: "text" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={!isSaving ? onClose : undefined} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
        <h3 className="text-base font-semibold text-emerald-950 mb-5">Chỉnh sửa thông tin cửa hàng</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Logo cửa hàng</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs text-center leading-tight">Chưa có<br/>logo</span>
                )}
              </div>
              <label className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors">
                Chọn ảnh mới
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isSaving} />
              </label>
            </div>
          </div>
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
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Mô tả</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={isSaving}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none ${
                form.description !== initial.description ? "border-emerald-600 focus:border-emerald-600" : "border-gray-200 focus:border-emerald-500"
              }`}
            />
          </div>
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
            onClick={() => onSave({ ...form, logoFile })}
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
