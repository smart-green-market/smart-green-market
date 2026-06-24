import { useState } from "react";
import { KeyRound, Loader2, LogOut, ScrollText, Star, UserCircle2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../../contexts/authProvider";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";

export default function ProfileSidebar() {
  const paths = useStorefrontPaths();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const menuItems = [
    {
      key: "profile",
      label: "Thông tin cá nhân",
      to: paths.account,
      icon: UserCircle2,
    },
    {
      key: "password",
      label: "Đổi mật khẩu",
      to: `${paths.account}/doi-mat-khau`,
      icon: KeyRound,
    },
    {
      key: "orders",
      label: "Lịch sử đơn hàng",
      to: `${paths.account}/lich-su-don-hang`,
      icon: ScrollText,
    },
    {
      key: "reviews",
      label: "Đánh giá sản phẩm",
      to: `${paths.account}/danh-gia-san-pham`,
      icon: Star,
    },
  ];

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="rounded-xl bg-white p-6 shadow-sm">
      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.key === "profile"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 no-underline ${
                  isActive
                    ? "bg-emerald-200 text-green-950"
                    : "text-neutral-700 hover:bg-zinc-100"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}

        <div className="py-2">
          <div className="h-px border-t border-stone-300" />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span className="text-sm font-semibold tracking-wide">
            {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </span>
        </button>
      </div>
    </aside>
  );
}
