import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, KeyRound, LogOut, UserCircle2 } from "lucide-react";
import { useAuth } from "../../../contexts/authProvider";

const MENU_ITEMS = [
  {
    key: "profile",
    label: "Thông tin",
    icon: UserCircle2,
    to: "/nha-cung-cap/thong-tin-ca-nhan",
  },
  {
    key: "password",
    label: "Đổi mật khẩu",
    icon: KeyRound,
    action: "change-password",
  },
];

function getInitials(name) {
  if (!name) return "N";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function SupplierAvatarDropdown({ supplier }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const avatarUrl = supplier?.account?.avatar_url;
  const displayName =
    supplier?.account?.full_name ||
    supplier?.company_name ||
    "Nhà cung cấp";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (item) => {
    setIsOpen(false);

    if (item.action === "change-password") {
      navigate("/nha-cung-cap/thong-tin-ca-nhan", { state: { openChangePassword: true } });
      return;
    }

    if (item.to) {
      navigate(item.to);
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full hover:bg-neutral-100 transition-colors p-1 cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-white text-xs font-bold font-['Geist',sans-serif] overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            getInitials(displayName)
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-neutral-100 bg-stone-50">
            <p className="text-xs font-bold text-neutral-800 truncate">{displayName}</p>
            {supplier?.account?.email && (
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">{supplier.account.email}</p>
            )}
          </div>

          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => handleMenuClick(item)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                <Icon className="w-4 h-4 shrink-0 text-neutral-400" />
                {item.label}
              </button>
            );
          })}

          <div className="my-1 border-t border-neutral-100" />

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
