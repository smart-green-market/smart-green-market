import { useEffect, useState } from "react";
import { dealerService } from "../../../services/api/dealerService";
import { accountService } from "../../../services/api/accountService";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/authProvider";
import { Store, User, Edit } from "lucide-react";

import EditPersonalModal from "./components/EditPersonalModal";
import EditStoreModal from "./components/EditStoreModal";

// ---- Helpers ----
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatPhone(phone) {
  if (!phone) return "—";
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
}

function getChangedFields(initial, current) {
  const changed = {};
  Object.keys(initial).forEach((key) => {
    if (current[key] !== initial[key]) {
      changed[key] = current[key];
    }
  });
  return changed;
}

// ---- Sub-components ----
function InfoField({ label, value, wide = false }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
    </div>
  );
}

function Badge({ label, variant = "default" }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    yellow: "bg-yellow-50 text-yellow-800 border border-yellow-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    gray: "bg-gray-100 text-gray-600 border border-gray-200",
    default: "bg-gray-100 text-gray-600 border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant]}`}>
      {label}
    </span>
  );
}



export default function DealerInfoPage() {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(() => {
    if (user?.dealer_profile) {
      return { ...user.dealer_profile, account: user };
    }
    return null;
  });
  const [loading, setLoading] = useState(!user?.dealer_profile);
  
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingStore, setEditingStore] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Nếu chưa có profile từ context thì bật loading
        if (!profile) setLoading(true);
        const data = await dealerService.resolveMyProfile();
        // Add account info from context to profile object to match layout
        if (data) {
           setProfile((prev) => ({ ...prev, ...data, account: user }));
        } else if (!profile) {
           // Fallback to user data if profile is not fully created yet
           setProfile({ account: user, store_name: "Chưa cập nhật", store_address: "Chưa cập nhật", description: "Chưa cập nhật", documents: [] });
        }
      } catch (error) {
        console.error("Failed to load dealer profile:", error);
        toast.error("Không thể tải thông tin cập nhật cửa hàng.");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleSavePersonal = async (form) => {
    try {
      setIsUpdating(true);
      const changedFields = getChangedFields(
        { full_name: profile.account.full_name, email: profile.account.email, phone: profile.account.phone },
        form
      );
      if (Object.keys(changedFields).length > 0) {
        await accountService.update(changedFields);
        setProfile((p) => ({ ...p, account: { ...p.account, ...changedFields } }));
        toast.success("Cập nhật thông tin cá nhân thành công!");
      }
      setEditingPersonal(false);
    } catch (error) {
      toast.error("Cập nhật thất bại. Vui lòng thử lại!");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveStore = async (form) => {
    try {
      setIsUpdating(true);
      const changedFields = getChangedFields(
        { store_name: profile.store_name, store_address: profile.store_address, description: profile.description },
        form
      );
      if (Object.keys(changedFields).length > 0) {
        if (profile.id) {
           await dealerService.update(profile.id, changedFields);
        } else {
           const payload = { ...form };
           const created = await dealerService.create(payload);
           setProfile((p) => ({ ...created, account: p.account }));
        }
        setProfile((p) => ({ ...p, ...changedFields }));
        toast.success("Cập nhật thông tin cửa hàng thành công!");
      }
      setEditingStore(false);
    } catch (error) {
      toast.error("Cập nhật thất bại. Vui lòng thử lại!");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-emerald-50/15 min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!profile) return <div className="p-6">Lỗi tải dữ liệu.</div>;

  return (
    <div className="p-6 md:p-10 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-600" /> Cấu Hình Đại Lý
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Quản lý thông tin tài khoản và thông tin cửa hàng của bạn.
          </p>
        </div>

        {/* Thông tin cửa hàng */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
            <div>
              <h2 className="font-bold text-emerald-950">Thông tin cửa hàng</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Hiển thị với nhà cung cấp và khách hàng</p>
            </div>
            <button
              onClick={() => setEditingStore(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Tên cửa hàng" value={profile.store_name} />
            <InfoField label="Mã đại lý" value={profile.id ? `#DL${String(profile.id).padStart(4, "0")}` : "Chưa có"} />
            <InfoField label="Địa chỉ" value={profile.store_address} wide />
            <InfoField label="Mô tả" value={profile.description} wide />
          </div>
        </div>

        {/* Thông tin cá nhân */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
            <div>
              <h2 className="font-bold text-emerald-950">Thông tin cá nhân</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Thông tin chủ đại lý và tài khoản đăng nhập</p>
            </div>
            <button
              onClick={() => setEditingPersonal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-100">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xl flex items-center justify-center shrink-0">
                {profile.account?.full_name ? profile.account.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <p className="font-bold text-emerald-950 text-lg">{profile.account?.full_name || "Chưa cập nhật"}</p>
                <p className="text-sm text-neutral-500 mb-2">@{profile.account?.username}</p>
                <Badge label="Tài khoản Đại lý" variant="green" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField label="Email liên hệ" value={profile.account?.email} />
              <InfoField label="Số điện thoại" value={formatPhone(profile.account?.phone)} />
              <InfoField label="Ngày tạo tài khoản" value={formatDate(profile.account?.created_at)} />
            </div>
          </div>
        </div>

        {/* Giấy tờ pháp lý */}
        {profile?.documents && profile.documents.length > 0 && (
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <div>
                <h2 className="font-bold text-emerald-950">Giấy tờ pháp lý</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Các giấy tờ chứng nhận đã được tải lên</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {profile.documents.map((doc) => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" className="block border border-neutral-200 rounded-xl overflow-hidden hover:border-emerald-500 transition-colors group bg-neutral-50">
                    <div className="h-40 bg-neutral-200 overflow-hidden relative">
                      {doc.file_url ? (
                        <img src={doc.file_url} alt={doc.document_type_label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">Không có ảnh</div>
                      )}
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-sm font-semibold text-neutral-800 line-clamp-1">{doc.document_type_label}</p>
                      <div className="flex justify-between items-center mt-3">
                        <Badge label={doc.status === "approved" ? "Đã duyệt" : doc.status} variant={doc.status === "approved" ? "green" : "yellow"} />
                        <span className="text-[11px] text-neutral-400">{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {editingPersonal && (
        <EditPersonalModal
          account={profile.account}
          onClose={() => setEditingPersonal(false)}
          onSave={handleSavePersonal}
          isSaving={isUpdating}
        />
      )}

      {editingStore && (
        <EditStoreModal
          profile={profile}
          onClose={() => setEditingStore(false)}
          onSave={handleSaveStore}
          isSaving={isUpdating}
        />
      )}
    </div>
  );
}
