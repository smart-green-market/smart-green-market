import { useEffect, useState } from "react";
import { dealerService } from "../../../services/api/dealerService";
import { accountService } from "../../../services/api/accountService";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/authProvider";
import { Store } from "lucide-react";

import EditPersonalModal from "../../../components/Dealer/Info/EditPersonalModal";
import EditStoreModal from "../../../components/Dealer/Info/EditStoreModal";
import StoreInfoCard from "../../../components/Dealer/Info/StoreInfoCard";
import PersonalInfoCard from "../../../components/Dealer/Info/PersonalInfoCard";
import DocumentsCard from "../../../components/Dealer/Info/DocumentsCard";

function getChangedFields(initial, current) {
  const changed = {};
  Object.keys(initial).forEach((key) => {
    if (current[key] !== initial[key]) {
      changed[key] = current[key];
    }
  });
  return changed;
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
      
      const hasChanges = Object.keys(changedFields).length > 0 || form.logoFile;

      if (hasChanges) {
        let payload = changedFields;
        
        // Use FormData if logo is provided
        if (form.logoFile) {
          payload = new FormData();
          if (changedFields.store_name) payload.append("store_name", changedFields.store_name);
          if (changedFields.store_address) payload.append("store_address", changedFields.store_address);
          if (changedFields.description) payload.append("description", changedFields.description);
          payload.append("logo", form.logoFile);
        }

        if (profile.id) {
           const updated = await dealerService.update(profile.id, payload);
           setProfile((p) => ({ ...p, ...updated, account: p.account }));
        } else {
           let payloadForCreate = { ...form };
           if (form.logoFile) {
               payloadForCreate = new FormData();
               payloadForCreate.append("store_name", form.store_name);
               payloadForCreate.append("store_address", form.store_address);
               payloadForCreate.append("description", form.description);
               payloadForCreate.append("logo", form.logoFile);
           }
           const created = await dealerService.create(payloadForCreate);
           setProfile((p) => ({ ...created, account: p.account }));
        }
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
        <StoreInfoCard profile={profile} onEdit={() => setEditingStore(true)} />

        {/* Thông tin cá nhân */}
        <PersonalInfoCard profile={profile} onEdit={() => setEditingPersonal(true)} />

        {/* Giấy tờ pháp lý */}
        <DocumentsCard documents={profile?.documents} />
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
