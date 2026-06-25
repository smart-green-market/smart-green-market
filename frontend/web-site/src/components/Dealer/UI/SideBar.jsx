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
];

export default function SideBar({ isOpen }) {
  const { logout } = useAuth();

  return (
    <aside
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
        </button>
      </div>
    </aside>
  );
}
