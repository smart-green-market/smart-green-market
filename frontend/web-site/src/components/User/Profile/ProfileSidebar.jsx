import { KeyRound, LogOut, ScrollText, UserCircle2 } from "lucide-react";
import { NavLink } from "react-router-dom";

const menuItems = [
  {
    key: "profile",
    label: "Thông tin cá nhân",
    to: "/tai-khoan/",
    icon: UserCircle2,
  },
  {
    key: "password",
    label: "Đổi mật khẩu",
    to: "/tai-khoan/doi-mat-khau",
    icon: KeyRound,
  },
  {
    key: "orders",
    label: "Lịch sử đơn hàng",
    to: "/tai-khoan/lich-su-don-hang",
    icon: ScrollText,
  },
];

export default function ProfileSidebar() {
  return (
    <aside className="rounded-xl bg-white p-6 shadow-sm">
      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-wide">{item.label}</span>
            </>
          );

          if (item.to === "#") {
            return (
              <button
                key={item.key}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-neutral-700"
              >
                {content}
              </button>
            );
          }

          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 ${
                  isActive
                    ? "bg-emerald-200 text-green-950"
                    : "text-neutral-700 hover:bg-zinc-100"
                }`
              }
            >
              {content}
            </NavLink>
          );
        })}

        <div className="py-2">
          <div className="h-px border-t border-stone-300" />
        </div>

        <button
          type="button"
          className="cursor-pointer flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-semibold tracking-wide">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
