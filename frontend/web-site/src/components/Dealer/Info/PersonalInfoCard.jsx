import { Edit } from "lucide-react";
import { InfoField, Badge, formatPhone } from "./InfoHelpers";

export default function PersonalInfoCard({ profile, onEdit }) {
  if (!profile || !profile.account) return null;

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
        <div>
          <h2 className="font-bold text-emerald-950">Thông tin cá nhân</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Thông tin chủ đại lý và tài khoản đăng nhập</p>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
        </button>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-100">
          {(profile.account?.avatar_url || profile.account?.avatar) ? (
            <img
              src={profile.account.avatar_url || profile.account.avatar}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover shrink-0 border border-neutral-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xl flex items-center justify-center shrink-0">
              {profile.account?.full_name ? profile.account.full_name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <div>
            <p className="font-bold text-emerald-950 text-lg">{profile.account?.full_name || "Chưa cập nhật"}</p>
            <p className="text-sm text-neutral-500 mb-2">@{profile.account?.username}</p>
            <Badge label="Tài khoản Đại lý" variant="green" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Email liên hệ" value={profile.account?.email} />
          <InfoField label="Số điện thoại" value={formatPhone(profile.account?.phone)} />
          {/* <InfoField label="Ngày tạo tài khoản" value={formatDate(profile.account?.created_at)} /> */}
        </div>
      </div>
    </div>
  );
}
