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
        if (!profile) setLoading(true);
        const [dealers, linkData] = await Promise.all([
          dealerService.getAll(),
          dealerService.getStorefrontLink().catch((err) => {
            console.error("Lỗi khi fetch storefront link:", err);
            return null;
          })
        ]);

        console.log("Dữ liệu LinkData nhận được:", linkData);

        const profileData = dealers?.[0] || null;
        const storefrontUrl = linkData?.storefront_url || null;

        setProfile((prev) => {
          const base = profileData || prev || {};
          return {
            ...base,
            storefront_url: storefrontUrl,
            account: profileData?.account ? { ...user, ...profileData.account } : user,
            store_name: base.store_name || "Chưa cập nhật",
            store_address: base.store_address || "Chưa cập nhật",
            description: base.description || "Chưa cập nhật",
            documents: base.documents || [],
          };
        });
      } catch (error) {
        console.error("Failed to load dealer profile:", error);
        toast.error("Không thể tải thông tin cập nhật cửa hàng.");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);


  //Xử lý cập nhật thông tin cá nhận
  const handleSavePersonal = async (form) => {
    try {
      setIsUpdating(true);
      const savedUserStr = localStorage.getItem("user");
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : {};

      const changedFields = getChangedFields(
        { full_name: profile.account.full_name, email: profile.account.email, phone: profile.account.phone },
        { full_name: form.full_name, email: form.email, phone: form.phone }
      );
      
      const hasChanges = Object.keys(changedFields).length > 0 || form.avatarFile;

      if (hasChanges) {
        let updatedAccount = profile.account;

        // 1. Cập nhật chữ (PUT /profile/)
        if (Object.keys(changedFields).length > 0) {
          const textPayload = {
            email: form.email,
            full_name: form.full_name,
            phone: form.phone
          };
          updatedAccount = await accountService.updateProfile(textPayload);
        }

        // 2. Cập nhật ảnh (POST /profile/avatar/)
        if (form.avatarFile) {
          const formData = new FormData();
          formData.append("avatar", form.avatarFile);
          try {
            const avatarResult = await accountService.updateAvatar(formData);
            // Nếu api trả về chuỗi hoặc array, tự động bỏ qua việc rải (spread) vào object
            if (typeof avatarResult === 'object' && avatarResult !== null && !Array.isArray(avatarResult)) {
              updatedAccount = { ...updatedAccount, ...avatarResult };
            }
          } catch (avatarErr) {
            console.error("Lỗi khi gọi API upload avatar:", avatarErr.response?.data || avatarErr.message);
            // Nếu backend vẫn lưu file thành công nhưng trả về HTTP lỗi (400/500/CORS/JSON), 
            // chúng ta vẫn cập nhật giao diện tạm thời bằng ảnh đã preview
            updatedAccount = { ...updatedAccount, avatar_url: URL.createObjectURL(form.avatarFile) };
            toast.warning("Lưu ảnh thành công nhưng server trả về phản hồi lỗi. Bạn vui lòng check console F12!");
          }
        }
        
        // ==============================================================================
        // LOCAL STATE UPDATE (Cập nhật trạng thái cục bộ)
        // ==============================================================================
        // Trộn thông tin cũ với thông tin mới vừa trả về từ API
        const nextAccount = { ...profile.account, ...updatedAccount };
        
        // 1. setProfile: Thay đổi State của React. Ngay lập tức vẽ lại (re-render) cái thẻ
        // <PersonalInfoCard /> trên màn hình bằng hình ảnh và tên mới MÀ KHÔNG CẦN F5.
        setProfile((p) => ({ ...p, account: nextAccount }));
        
        // 2. localStorage.setItem: Lưu đè thông tin mới vào bộ nhớ trình duyệt để đồng bộ dữ liệu
        // cho các chỗ dùng chung (Ví dụ: Thanh Navbar ở góc trên bên phải trang web).
        localStorage.setItem("user", JSON.stringify({ ...savedUser, ...updatedAccount }));
        
        toast.success("Cập nhật thông tin cá nhân thành công!");
      }
      setEditingPersonal(false);
    } catch (error) {
      console.error("Lưu cá nhân lỗi:", error);
      const data = error.response?.data;
      if (data?.message) {
        toast.error(data.message);
      } else {
        toast.error(`Cập nhật cá nhân thất bại: ${error.message}`);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  
   //Xử lý cập nhật thông tin cửa hàng
  const handleSaveStore = async (form) => {
    try {
      setIsUpdating(true);
      const changedFields = getChangedFields(
        { store_name: profile.store_name, store_address: profile.store_address, description: profile.description },
        form
      );
      
      const hasChanges = Object.keys(changedFields).length > 0 || form.logoFile;

      if (hasChanges) {
        if (!profile.id) {
          toast.error("Không tìm thấy thông tin cửa hàng để cập nhật.");
          setIsUpdating(false);
          return;
        }

        let payload = changedFields;
        
        if (form.logoFile) {
          payload = new FormData();
          if (changedFields.store_name) payload.append("store_name", changedFields.store_name);
          if (changedFields.store_address) payload.append("store_address", changedFields.store_address);
          if (changedFields.description) payload.append("description", changedFields.description);
          payload.append("logo", form.logoFile);
        }

        const updated = await dealerService.update(profile.id, payload);
        let nextStorefrontUrl = profile.storefront_url;
        try {
          // Lấy lại link cửa hàng (storefront_url) mới nhất nhỡ đâu tên cửa hàng vừa bị đổi
          const linkData = await dealerService.getStorefrontLink();
          nextStorefrontUrl = linkData?.storefront_url || nextStorefrontUrl;
        } catch (err) {
          console.error("Lỗi khi gọi getStorefrontLink sau update:", err);
        }
        
        // ==============================================================================
        // LOCAL STATE UPDATE (Cập nhật trạng thái cục bộ)
        // ==============================================================================
        // Gọi setProfile để chèn Logo, Tên, Địa chỉ mới (nằm trong biến 'updated') đè lên dữ liệu cũ.
        // Nhờ vậy giao diện thẻ <StoreInfoCard /> sẽ tự động cập nhật ngay tức thì mà không cần F5!
        // Lưu ý: Không cần lưu vào localStorage vì Navbar không quan tâm tên cửa hàng.
        setProfile((p) => ({ ...p, ...updated, storefront_url: nextStorefrontUrl, account: p.account }));
        
        toast.success("Cập nhật thông tin cửa hàng thành công!");
      }
      setEditingStore(false);
    } catch (error) {
      console.error("Lưu cửa hàng lỗi:", error);
      const data = error.response?.data;
      if (data?.message) {
        toast.error(data.message);
      } else {
        toast.error(`Cập nhật cửa hàng thất bại: ${error.message}`);
      }
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
        
         {/* Thông tin cá nhân */}
        <PersonalInfoCard profile={profile} onEdit={() => setEditingPersonal(true)} />

        {/* Thông tin cửa hàng */}
        <StoreInfoCard profile={profile} onEdit={() => setEditingStore(true)} />

       

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
