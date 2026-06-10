import { X } from "lucide-react";

export default function EditProfileModal({ open, profile, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[512px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 p-6">
          <h3 className="text-2xl font-semibold text-emerald-950">Chỉnh sửa thông tin</h3>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-zinc-100">
            <X className="h-4 w-4 text-zinc-900" />
          </button>
        </div>

        <div className="space-y-6 p-8">
          <div className="flex flex-col items-center">
            <img
              src={profile.avatar}
              alt={profile.fullName}
              className="h-24 w-24 rounded-full border-2 border-emerald-200 object-cover"
            />
            <p className="pt-2 text-xs font-medium text-neutral-500">Thay đổi ảnh đại diện</p>
          </div>

          <Field label="Họ tên" value={profile.fullName} editable />
          <Field label="Email" value={profile.email} />
          <Field label="Số điện thoại" value={profile.phone} editable />
        </div>

        <div className="flex justify-end gap-3 bg-zinc-100 p-6">
          <button type="button" onClick={onClose} className="px-6 py-2 text-base text-neutral-700">
            Hủy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-teal-800 px-6 py-2 text-base text-white hover:bg-teal-900"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, editable = false }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <div
        className={`rounded-lg px-4 py-2.5 outline outline-1 outline-stone-300 ${
          editable ? "bg-white" : "bg-zinc-100"
        }`}
      >
        <p className="text-base text-zinc-900">{value}</p>
      </div>
    </div>
  );
}
