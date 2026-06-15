import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Settings,
    ShieldCheck,
    Store,
    ShoppingCart,
    Tag,
    Package,
    LogOut,
    Tractor
} from "lucide-react";

const NAV_ITEMS = [
    { label: "Trang chủ",            icon: LayoutDashboard, to: "/nha-cung-cap",              end: true },
    { label: "Quản lý thông tin cá nhân",     icon: Settings,        to: "/nha-cung-cap/thong-tin-ca-nhan" },
    { label: "Quản lý danh mục",   icon: Tag, to: "/nha-cung-cap/danh-muc" },
    { label: "Quản lý sản phẩm", icon: Store,           to: "/nha-cung-cap/san-pham" },
    { label: "Quy trình canh tác",   icon: Tractor, to: "/nha-cung-cap/canh-tac" },
    { label: "Quản lý chứng nhận", icon: ShieldCheck,     to: "/nha-cung-cap/chung-nhan" },
    { label: "Quản lý đơn hàng",    icon: Package,         to: "/nha-cung-cap/don-hang" },
    
];

export default function SideBar() {
    const navigate = useNavigate();

    // Thay bằng useAuth() nếu có AuthProvider
    const handleLogout = () => {
        navigate("/");
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
                            `relative flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-150
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
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group"
                >
                    <LogOut className="w-4 h-4 shrink-0 text-neutral-400 group-hover:text-red-500" />
                    <span className="tracking-wide">Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}