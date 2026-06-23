import { NavLink } from "react-router-dom";
import { useAuth } from "../../../contexts/authProvider";
import {
  LayoutDashboard,
  Truck,
  Tag,
  Package,
  PackageSearch,
  ShoppingCart,
  ClipboardList,
  LogOut,
  Settings,
  Users,
} from "lucide-react";

<<<<<<< HEAD
// Cấu trúc danh mục chia nhóm rõ ràng
const MENU_GROUPS = [
  {
    title: "Tổng quan",
    items: [
      { label: "Trang chủ", icon: LayoutDashboard, to: "/dai-ly", end: true },
    ],
  },
  {
    title: "Giao dịch & Kho",
    items: [
      { label: "Kho hàng", icon: Package, to: "/dai-ly/kho-hang" },
      { label: "Nhập hàng", icon: ClipboardList, to: "/dai-ly/nhap-hang" },
      { label: "Bán hàng", icon: ShoppingCart, to: "/dai-ly/ban-hang" },
    ],
  },
  {
    title: "Đối tác & Sản phẩm",
    items: [
      { label: "Sản phẩm", icon: PackageSearch, to: "/dai-ly/san-pham" },
      { label: "Danh mục", icon: Tag, to: "/dai-ly/danh-muc" },
      { label: "Nhà cung cấp", icon: Truck, to: "/dai-ly/nha-cung-cap" },
      { label: "Khách hàng", icon: Users, to: "/dai-ly/khach-hang" },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { label: "Cấu hình", icon: Settings, to: "/dai-ly/cau-hinh" },
    ],
  },
=======
const NAV_ITEMS = [
  { label: "Trang chủ", icon: LayoutDashboard, to: "/dai-ly", end: true },
  { label: "Nhà cung cấp", icon: Truck, to: "/dai-ly/nha-cung-cap" },
  { label: "Danh mục", icon: Tag, to: "/dai-ly/danh-muc" },
  { label: "Kho hàng", icon: Package, to: "/dai-ly/kho-hang" },
  { label: "Sản phẩm", icon: PackageSearch, to: "/dai-ly/san-pham" },
  { label: "Nhập hàng", icon: ClipboardList, to: "/dai-ly/nhap-hang" },
  { label: "Bán hàng", icon: ShoppingCart, to: "/dai-ly/ban-hang" },
  { label: "Khách hàng", icon: Users, to: "/dai-ly/khach-hang" },
  { label: "Cấu hình", icon: Settings, to: "/dai-ly/cau-hinh" },
>>>>>>> 2f5307e509c173f5476c9d53a52e0d76032f8e03
];

export default function SideBar({ isOpen }) {
  const { logout } = useAuth();

  return (
    <aside
<<<<<<< HEAD
      className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200/60 flex flex-col z-40 transition-all duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
    >
      {/* Menu Groups */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5 scrollbar-thin">
        {MENU_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] block">
              {group.title}
            </span>
            <div className="space-y-0.5">
              {group.items.map(({ label, icon: Icon, to, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer
                    ${isActive
                      ? "bg-green-600 text-white shadow-sm shadow-green-600/20 font-semibold"
                      : "text-[#333333] hover:bg-[#F8F9FA] hover:text-green-700"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors duration-150
                        ${isActive ? "text-white" : "text-[#6B7280] group-hover:text-green-600"}`}
                      />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer & Logout */}
      <div className="p-3 border-t border-gray-200/60">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[#6B7280] hover:bg-red-50 hover:text-red-600 transition-all duration-200 group cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0 text-[#6B7280] group-hover:text-red-500 transition-colors" />
          <span>Đăng xuất</span>
=======
      className={`fixed left-0 top-16 bottom-0 w-64 bg-stone-50 border-r border-emerald-100 flex flex-col z-40 transition-all duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"
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
>>>>>>> 2f5307e509c173f5476c9d53a52e0d76032f8e03
        </button>
      </div>
    </aside>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 2f5307e509c173f5476c9d53a52e0d76032f8e03
