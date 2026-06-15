import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/authProvider"
import {
    LayoutDashboard,
    Settings,
    Truck,
    Store,
    Users,
    Tag,
    Package,
    LogOut,
    FileCheck,
    FileText,
    Bell
} from "lucide-react";

const NAV_ITEMS = [
    { label: "Trang chủ",            icon: LayoutDashboard, to: "/quan-tri",              end: true },
    { label: "Quản lý cấu hình",     icon: Settings,        to: "/quan-tri/cau-hinh" },
    { label: "Quản lý nhà cung cấp", icon: Truck,           to: "/quan-tri/nha-cung-cap" },
    { label: "Quản lý đại lý",       icon: Store,           to: "/quan-tri/dai-ly" },
    { label: "Quản lý người dùng",   icon: Users,           to: "/quan-tri/nguoi-dung" },
    { label: "Quản lý danh mục",     icon: Tag,             to: "/quan-tri/danh-muc" },
    { label: "Quản lý sản phẩm",     icon: Package,         to: "/quan-tri/san-pham" },
    { label: "Quản lý chứng chỉ",    icon: FileCheck,       to: "/quan-tri/chung-chi" },
    { label: "Quản lý giấy tờ",    icon: FileText,       to: "/quan-tri/giay-to" },
    //{ label: "Quản lý thông báo",    icon: Bell,       to: "/quan-tri/thong-bao" },
];

export default function SideBar() {
    const { logout } = useAuth();
        const handleLogout = async () => {
            await logout();
        };

    return (
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-stone-50 border-r border-neutral-200 flex flex-col z-40">
            {/* Nav items */}
            <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
                {NAV_ITEMS.map(({ label, icon: Icon, to, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            `hover:scale-105 relative flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-150
                            ${isActive
                                ? "bg-green-200 border-l-4 border-emerald-800 text-emerald-700 pl-3"
                                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
                            }`
                        }
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="tracking-wide">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="px-4 py-4 border-t border-neutral-200">
                <button
                    onClick={handleLogout}
                    className="hover:scale-105 cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group cursor-pointer"
                >
                    <LogOut className="w-4 h-4 shrink-0 text-neutral-400 group-hover:text-red-500" />
                    <span className="tracking-wide">Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}