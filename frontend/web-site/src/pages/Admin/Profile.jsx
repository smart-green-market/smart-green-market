import { useState } from "react";
import { useAuth } from "../../hooks/useAuth"; // Đường dẫn tuỳ thuộc cấu trúc folder của bạn
import { User, Eye, ShieldAlert } from "lucide-react";
import ProfileViewModal from "../../components/Admin/Profile/ProfileViewModal";

export default function ProfilePage() {
    // 1. Lấy dữ liệu user từ context hoặc global state qua Custom Hook useAuth
    const { user } = useAuth(); 
    const [isOpenModal, setIsOpenModal] = useState(false);

    // Bóc tách dữ liệu tài khoản từ cấu trúc data API trả về
    const accountData = user?.account || null;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* TIÊU ĐỀ PAGE */}
            <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-neutral-900">Quản lý tài khoản</h1>
                <p className="text-sm text-neutral-500">Xem và cập nhật thông tin định danh của Admin trên hệ thống.</p>
            </div>

            <hr className="border-neutral-200 mb-8" />

            {/* CARD THÔNG TIN TỔNG QUAN TRÊN PAGE */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                            {accountData?.avatar_url ? (
                                <img src={accountData.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <User className="w-8 h-8" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-neutral-800">
                                    {accountData?.full_name || accountData?.username || "Admin Account"}
                                </h2>
                                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                    {accountData?.role}
                                </span>
                            </div>
                            <p className="text-sm text-neutral-500 mt-0.5">{accountData?.email}</p>
                        </div>
                    </div>

                    {/* NÚT BẤM KÍCH HOẠT MODAL CHI TIẾT */}
                    <button
                        onClick={() => setIsOpenModal(true)}
                        className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-semibold text-sm transition-colors shadow-sm shrink-0"
                    >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết Profile
                    </button>
                </div>

                {/* THÔNG BÁO QUYỀN HẠN HỆ THỐNG */}
                <div className="bg-neutral-50 px-6 py-3.5 border-t border-neutral-100 flex items-center gap-2.5 text-xs font-medium text-neutral-600">
                    <ShieldAlert className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span>Tài khoản của bạn có toàn quyền quản trị cấp cao nhất của hệ thống (Root Admin).</span>
                </div>
            </div>

            {/* CALL MODAL VÀ TRUYỀN DỮ LIỆU ĐÃ ĐƯỢC CHUẨN HOÁ VÀO */}
            <ProfileViewModal 
                isOpen={isOpenModal}
                onClose={() => setIsOpenModal(false)}
                user={accountData} 
            />
        </div>
    );
}