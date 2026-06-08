import { X, User, Mail, Phone, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

export default function ProfileViewModal({ isOpen, onClose, user }) {
    if (!isOpen || !user) return null;

    const { username, email, full_name, phone, avatar_url, role, status } = user;

    // Cấu hình hiển thị trạng thái tài khoản
    const statusConfig = status === "active" 
        ? { label: "Hoạt động", bg: "bg-green-100", text: "text-green-700", icon: <CheckCircle2 className="w-4 h-4" /> }
        : { label: "Khóa", bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="w-4 h-4" /> };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            {/* MODAL CARD */}
            <div className="w-full max-w-[550px] bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-neutral-500" />
                        <h2 className="text-lg font-bold text-neutral-800">Thông tin tài khoản</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="cursor-pointer p-1.5 rounded-full hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 flex flex-col gap-6 overflow-y-auto">
                    
                    {/* AVATAR & TÊN CHÍNH */}
                    <div className="flex items-center gap-4 border-b border-neutral-100 pb-5">
                        <div className="w-20 h-20 rounded-full border-2 border-neutral-200 bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0">
                            {avatar_url ? (
                                <img src={avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-neutral-400" />
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xl font-bold text-neutral-900">
                                {full_name || username}
                            </h3>
                            <span className="text-sm font-mono text-neutral-400">@{username}</span>
                            <div className="flex gap-2 mt-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase bg-zinc-900 text-white tracking-wider">
                                    {role}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                                    {statusConfig.icon}
                                    {statusConfig.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CHI TIẾT CÁC TRƯỜNG THÔNG TIN */}
                    <div className="flex flex-col gap-4">
                        <ProfileField 
                            label="Địa chỉ Email" 
                            value={email} 
                            icon={<Mail className="w-4 h-4 text-neutral-500" />} 
                        />
                        <ProfileField 
                            label="Số điện thoại" 
                            value={phone} 
                            icon={<Phone className="w-4 h-4 text-neutral-500" />} 
                        />
                        <ProfileField 
                            label="Họ và tên" 
                            value={full_name || "Chưa cập nhật"} 
                            icon={<User className="w-4 h-4 text-neutral-500" />} 
                            isMissing={!full_name}
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="cursor-pointer px-5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-900 text-white font-medium text-sm transition-colors shadow-sm"
                    >
                        Đóng lại
                    </button>
                </div>
            </div>
        </div>
    );
}

// Sub-component hiển thị từng dòng thông tin
function ProfileField({ label, value, icon, isMissing }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-neutral-500 tracking-wide uppercase">
                {label}
            </span>
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50/50">
                {icon}
                <span className={`text-sm ${isMissing ? "text-neutral-400 italic" : "text-neutral-800 font-medium"}`}>
                    {value}
                </span>
            </div>
        </div>
    );
}