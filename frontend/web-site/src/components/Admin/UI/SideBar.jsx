import { NavLink } from "react-router-dom";
import { useAuth } from "../../../contexts/authProvider";
import {
    LayoutDashboard,
    Settings,
    Truck,
    Store,
    Tag,
    Package,
    Layers,
    LogOut,
    FileCheck,
    FileText,
    Ticket,
} from "lucide-react";

const NAV_ITEMS = [
    { label: "Trang chủ",            icon: LayoutDashboard, to: "/quan-tri",              end: true },
    { label: "Quản lý cấu hình",     icon: Settings,        to: "/quan-tri/cau-hinh" },
    { label: "Quản lý nhà cung cấp", icon: Truck,           to: "/quan-tri/nha-cung-cap" },
    { label: "Quản lý đại lý",       icon: Store,           to: "/quan-tri/dai-ly" },
    { label: "Quản lý danh mục",     icon: Tag,             to: "/quan-tri/danh-muc" },
    { label: "Catalog sản phẩm",   icon: Layers,          to: "/quan-tri/san-pham-chuan" },
    { label: "Quản lý sản phẩm",     icon: Package,         to: "/quan-tri/san-pham" },
    { label: "Quản lý chứng chỉ",    icon: FileCheck,       to: "/quan-tri/chung-chi" },
    { label: "Quản lý giấy tờ",    icon: FileText,       to: "/quan-tri/giay-to" },
    { label: "Quản lý Voucher",     icon: Ticket,         to: "/quan-tri/khuyen-mai" },
    //{ label: "Quản lý thông báo",    icon: Bell,       to: "/quan-tri/thong-bao" },
];

export default function SideBar({ isOpen = true }) {
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <aside
            className={`fixed left-0 top-16 bottom-0 z-40 flex w-64 flex-col border-r border-emerald-900/10 bg-[#e4ebe6] transition-all duration-300 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
            {/* Nav items */}
            <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
                {NAV_ITEMS.map(({ label, icon: Icon, to, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            `hover:scale-105 cursor-pointer relative flex items-center gap-3 rounded-lg px-4 py-3 text-xs font-semibold transition-colors duration-150
                            ${isActive
                                ? "border-l-4 border-emerald-800 bg-white pl-3 text-emerald-800 shadow-sm"
                                : "text-neutral-700 hover:bg-white/55 hover:text-emerald-950"
                            }`
                        }
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="tracking-wide">{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="border-t border-emerald-900/10 px-4 py-4">
                <button
                    onClick={handleLogout}
                    className="hover:scale-105 cursor-pointer group flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-xs font-semibold text-neutral-600 transition-colors duration-150 hover:bg-white/60 hover:text-red-600"
                >
                    <LogOut className="w-4 h-4 shrink-0 text-neutral-400 group-hover:text-red-500" />
                    <span className="tracking-wide">Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}