import { NavLink } from "react-router-dom";
import { useAuth } from "../../../contexts/authProvider";
import {
    LayoutDashboard,
    Truck,
    Tag,
    Package,
    ShoppingCart,
    ClipboardList,
    LogOut,
    Settings,
} from "lucide-react";

const NAV_ITEMS = [
    { label: "Trang chủ",    icon: LayoutDashboard, to: "/dai-ly",              end: true },
    { label: "Nhà cung cấp", icon: Truck,            to: "/dai-ly/nha-cung-cap"           },
    { label: "Danh mục",     icon: Tag,       to: "/dai-ly/danh-muc"               },
    { label: "Kho hàng",     icon: Package,          to: "/dai-ly/kho-hang"               },
    { label: "Nhập hàng",    icon: ClipboardList,    to: "/dai-ly/nhap-hang"              },
    { label: "Bán hàng",     icon: ShoppingCart,     to: "/dai-ly/ban-hang"               },
    { label: "Cấu hình",     icon: Settings,         to: "/dai-ly/cau-hinh"               },
];

export default function SideBar({ isOpen }) {
    const { logout } = useAuth();

    return (
        <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-stone-50 border-r border-emerald-100 flex flex-col z-40 transition-all duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
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
                                ? "bg-emerald-100/60 border-l-4 border-emerald-700 text-emerald-800 pl-3 shadow-xs"
                                : "text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800"
                            }`
                        }
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="tracking-wide">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="px-4 py-4 border-t border-emerald-100/50">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group cursor-pointer"
                >
                    <LogOut className="w-4 h-4 shrink-0 text-neutral-400 group-hover:text-red-500" />
                    <span className="tracking-wide">Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}