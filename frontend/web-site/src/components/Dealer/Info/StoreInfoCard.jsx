import { Edit, Store } from "lucide-react";
import { InfoField, Badge } from "./InfoHelpers";

export default function StoreInfoCard({ profile, onEdit }) {
  if (!profile) return null;

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
        <div>
          <h2 className="font-bold text-emerald-950">Thông tin cửa hàng</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Hiển thị với nhà cung cấp và khách hàng</p>
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
          <div className="w-16 h-16 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            {profile.logo_url ? (
              <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              profile.store_name ? profile.store_name.charAt(0).toUpperCase() : <Store className="w-8 h-8" />
            )}
          </div>
          <div>
            <p className="font-bold text-emerald-950 text-lg">{profile.store_name || "Chưa cập nhật"}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge label="Cửa hàng Đại lý" variant="blue" />
              <span className="text-xs text-neutral-500 font-medium">{profile.id ? `#DL${String(profile.id).padStart(4, "0")}` : "Chưa có mã"}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Tên cửa hàng" value={profile.store_name} />
          <InfoField label="Mã đại lý" value={profile.id ? `#DL${String(profile.id).padStart(4, "0")}` : "Chưa có"} />
          <InfoField label="Địa chỉ" value={profile.store_address} />
          <InfoField label="Mô tả" value={profile.description} />
          <div className="col-span-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Đường dẫn cửa hàng (Storefront URL)
            </p>
            <div className="text-sm font-medium text-gray-800 break-all">
              {profile.storefront_url ? (
                <a
                  href={profile.storefront_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                >
                  {profile.storefront_url}
                </a>
              ) : (
                "Chưa có"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
