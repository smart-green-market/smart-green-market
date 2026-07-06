import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Bell,
    Calendar,
    ChevronDown,
    ChevronRight,
    LogOut,
    Newspaper,
    Sparkles,
    User,
    UserCircle2,
} from "lucide-react";
import { useAuth } from "../../../contexts/authProvider";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import { useNotificationBellData } from "../../../hooks/useNotificationBellData";
import {
    formatNotificationRow,
    getMarkedReadState,
    isNotificationUnread,
    matchesNotificationRecord,
    resolveMarkReadId,
} from "../../Admin/Notification/notificationFormatters";
import {
    handleApiError,
    notificationService,
} from "../../../services/api/notificationService";

const MENU_WIDTH = 288;
const NOTIFICATION_WIDTH = 340;

const getBuyerNotificationRoute = (item, orderStatusPath) => {
    const referenceType = item.referenceType ?? item.reference_type;
    if (referenceType === "customer_order") {
        return orderStatusPath;
    }
    return orderStatusPath;
};

function getInitials(name) {
    if (!name) return "U";
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatShortDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
    });
}

function CountBadge({ count }) {
    if (!count || count <= 0) return null;
    return (
        <span className="inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {count > 9 ? "9+" : count}
        </span>
    );
}

function MenuItem({
    icon: Icon,
    label,
    description,
    onClick,
    badge,
    variant = "default",
    showArrow = false,
}) {
    const isDanger = variant === "danger";

    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            className={`group cursor-pointer flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all duration-200 ${
                isDanger
                    ? "hover:bg-red-50/90"
                    : "hover:bg-emerald-50/70 hover:shadow-sm"
            }`}
        >
            <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
                    isDanger
                        ? "bg-red-50 text-red-500 ring-1 ring-red-100"
                        : "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 ring-1 ring-emerald-100/80"
                }`}
            >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>

            <span className="min-w-0 flex-1">
                <span
                    className={`block text-[13px] font-semibold leading-tight ${
                        isDanger ? "text-red-600" : "text-neutral-800"
                    }`}
                >
                    {label}
                </span>
                {description ? (
                    <span className="mt-0.5 block truncate text-[11px] text-neutral-400">
                        {description}
                    </span>
                ) : null}
            </span>

            {badge ?? null}

            {showArrow && !isDanger ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
            ) : null}
        </button>
    );
}

function ProfileHeader({ displayName, email, avatarUrl }) {
    const initials = getInitials(displayName);

    return (
        <div className="relative overflow-hidden px-4 pb-4 pt-4">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800" />
            <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-teal-300/20 blur-2xl" />

            <div className="relative flex items-center gap-3">
                <div className="relative shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-2 ring-white/30 backdrop-blur-sm">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-sm font-bold tracking-wide text-white">
                                {initials}
                            </span>
                        )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
                        <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                    </span>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold tracking-tight text-white">
                        {displayName}
                    </p>
                    {email ? (
                        <p className="mt-0.5 truncate text-[11px] font-medium text-emerald-100/90">
                            {email}
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function NotificationPanel({ items, onItemClick, onSeeMore }) {
    return (
        <>
            <div className="max-h-[min(360px,calc(100vh-12rem))] overflow-y-auto px-2 py-2">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                            <Bell className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-neutral-700">
                            Chưa có thông báo
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                            Cập nhật mới sẽ hiển thị tại đây
                        </p>
                    </div>
                ) : (
                    items.map((item) => (
                        <button
                            key={item.id ?? item.receiptId ?? item.title}
                            type="button"
                            onClick={() => onItemClick(item)}
                            className={`mb-1.5 w-full rounded-xl border px-3.5 py-3 text-left transition-all duration-200 last:mb-0 ${
                                isNotificationUnread(item)
                                    ? "border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-white shadow-sm hover:shadow-md"
                                    : "border-transparent bg-neutral-50/60 hover:border-neutral-100 hover:bg-white"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <h4
                                    className={`line-clamp-1 text-xs font-['Geist',sans-serif] ${
                                        isNotificationUnread(item)
                                            ? "font-bold text-neutral-900"
                                            : "font-medium text-neutral-600"
                                    }`}
                                >
                                    {item.title}
                                </h4>
                                {isNotificationUnread(item) ? (
                                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
                                ) : null}
                            </div>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-neutral-500">
                                {item.content}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-neutral-400">
                                <Calendar className="h-3 w-3" />
                                <span>{formatShortDate(item.createdAt)}</span>
                            </div>
                        </button>
                    ))
                )}
            </div>

            <div className="border-t border-neutral-100/80 bg-neutral-50/50 p-2">
                <button
                    type="button"
                    onClick={onSeeMore}
                    className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 py-2.5 text-center text-xs font-bold text-white shadow-sm transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-md"
                >
                    Xem tất cả thông báo
                </button>
            </div>
        </>
    );
}

export default function BuyerAccountDropdown() {
    const navigate = useNavigate();
    const paths = useStorefrontPaths();
    const { user, logout } = useAuth();
    const containerRef = useRef(null);
    const triggerRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const [panel, setPanel] = useState("menu");
    const [loggingOut, setLoggingOut] = useState(false);
    const [menuStyle, setMenuStyle] = useState(null);

    const {
        unreadCount,
        setUnreadCount,
        notifications,
        setNotifications,
    } = useNotificationBellData({ enabled: Boolean(user) });

    const panelWidth = panel === "notifications" ? NOTIFICATION_WIDTH : MENU_WIDTH;

    const updateMenuPosition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const viewportPadding = 12;
        const maxLeft = window.innerWidth - panelWidth - viewportPadding;
        const left = Math.max(viewportPadding, Math.min(rect.right - panelWidth, maxLeft));
        const top = rect.bottom + 10;
        const maxHeight = window.innerHeight - top - viewportPadding;

        setMenuStyle({
            top,
            left,
            width: panelWidth,
            maxHeight: Math.max(maxHeight, 180),
        });
    }, [panelWidth]);

    useLayoutEffect(() => {
        if (!isOpen) {
            setMenuStyle(null);
            return undefined;
        }

        updateMenuPosition();

        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);

        return () => {
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
        };
    }, [isOpen, panel, updateMenuPosition]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                containerRef.current?.contains(event.target) ||
                event.target.closest("[data-buyer-account-menu]")
            ) {
                return;
            }

            setIsOpen(false);
            setPanel("menu");
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setIsOpen(false);
                setPanel("menu");
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const closeDropdown = useCallback(() => {
        setIsOpen(false);
        setPanel("menu");
    }, []);

    const handleNavigate = useCallback(
        (to) => {
            closeDropdown();
            navigate(to);
        },
        [closeDropdown, navigate],
    );

    const handleMarkRead = useCallback(
        async (markReadId, receiptId) => {
            if (markReadId == null) return;

            try {
                const response = await notificationService.mark_read(markReadId);
                const markedState = getMarkedReadState(response);

                setNotifications((prev) =>
                    prev.map((item) =>
                        matchesNotificationRecord(item, markReadId, receiptId)
                            ? { ...item, ...markedState }
                            : item,
                    ),
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (error) {
                console.error(handleApiError(error, "Không thể đánh dấu đã đọc"));
            }
        },
        [setNotifications, setUnreadCount],
    );

    const handleNotificationClick = useCallback(
        (item) => {
            closeDropdown();

            const formatted = formatNotificationRow(item);
            const notificationId = resolveMarkReadId(formatted);

            if (notificationId != null && isNotificationUnread(formatted)) {
                handleMarkRead(notificationId, formatted.receiptId);
            }

            const route = getBuyerNotificationRoute(formatted, paths.orderStatus);
            if (route) {
                navigate(route);
            }
        },
        [closeDropdown, handleMarkRead, navigate, paths.orderStatus],
    );

    const handleLogout = async () => {
        if (loggingOut) return;

        setLoggingOut(true);
        try {
            closeDropdown();
            await logout();
        } finally {
            setLoggingOut(false);
        }
    };

    const displayName =
        user?.full_name || user?.name || user?.email || "Tài khoản";
    const avatarUrl = user?.avatar_url || user?.avatar || null;

    const dropdownMenu =
        isOpen && menuStyle
            ? createPortal(
                  <div
                      data-buyer-account-menu
                      role="menu"
                      style={{
                          position: "fixed",
                          top: menuStyle.top,
                          left: menuStyle.left,
                          width: menuStyle.width,
                          maxHeight: menuStyle.maxHeight,
                          zIndex: 120,
                      }}
                      className="flex origin-top-right animate-in fade-in zoom-in-95 flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-[0_20px_50px_-12px_rgba(6,78,59,0.25)] ring-1 ring-emerald-900/5 backdrop-blur-xl duration-200"
                  >
                      {panel === "menu" ? (
                          <>
                              <ProfileHeader
                                  displayName={displayName}
                                  email={user?.email}
                                  avatarUrl={avatarUrl}
                              />

                              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
                                  <MenuItem
                                      icon={UserCircle2}
                                      label="Thông tin cá nhân"
                                      description="Hồ sơ & cài đặt tài khoản"
                                      onClick={() => handleNavigate(paths.account)}
                                  />
                                  <MenuItem
                                      icon={Bell}
                                      label="Thông báo"
                                      description="Cập nhật đơn hàng & ưu đãi"
                                      onClick={() => setPanel("notifications")}
                                      badge={<CountBadge count={unreadCount} />}
                                      showArrow
                                  />
                                  <MenuItem
                                      icon={Newspaper}
                                      label="Đơn hàng"
                                      description="Theo dõi trạng thái giao hàng"
                                      onClick={() => handleNavigate(paths.orderStatus)}
                                  />
                              </div>

                              <div className="border-t border-neutral-100/80 bg-neutral-50/40 p-2">
                                  <MenuItem
                                      icon={LogOut}
                                      label={loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                                      onClick={handleLogout}
                                      variant="danger"
                                  />
                              </div>
                          </>
                      ) : (
                          <div className="flex min-h-0 flex-1 flex-col">
                              <div className="flex shrink-0 items-center gap-2 border-b border-neutral-100/80 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 px-3 py-3">
                                  <button
                                      type="button"
                                      onClick={() => setPanel("menu")}
                                      className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm ring-1 ring-neutral-100 transition-all hover:text-emerald-700 hover:ring-emerald-100"
                                  >
                                      <ArrowLeft className="h-3.5 w-3.5" />
                                      Quay lại
                                  </button>
                                  <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-neutral-800">
                                          Thông báo
                                      </p>
                                      <p className="text-[10px] text-neutral-400">
                                          Tin mới nhất dành cho bạn
                                      </p>
                                  </div>
                                  <CountBadge count={unreadCount} />
                              </div>

                              <div className="min-h-0 flex-1 overflow-hidden">
                                  <NotificationPanel
                                      items={notifications}
                                      onItemClick={handleNotificationClick}
                                      onSeeMore={() => handleNavigate(paths.notifications)}
                                  />
                              </div>
                          </div>
                      )}
                  </div>,
                  document.body,
              )
            : null;

    return (
        <div className="relative" ref={containerRef}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => {
                    setIsOpen((prev) => {
                        if (prev) setPanel("menu");
                        return !prev;
                    });
                }}
                className={`hover:scale-110 relative flex cursor-pointer flex-col items-center gap-0.5 rounded-full p-2 text-white transition-all duration-200 hover:bg-white/10 md:rounded-xl md:px-3 md:py-1.5 ${
                    isOpen
                        ? "bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]"
                        : ""
                }`}
                title="Tài khoản"
                aria-label="Tài khoản"
                aria-expanded={isOpen}
                aria-haspopup="menu"
            >
                <span className="relative inline-flex items-center gap-0.5">
                    <User className="h-5 w-5" strokeWidth={2} />
                    {unreadCount > 0 ? (
                        <span className="absolute -right-3 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-emerald-700 shadow-md ring-2 ring-emerald-600">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    ) : null}
                </span>
                <span className="hidden text-xs font-medium leading-none md:block">
                    Tài khoản
                </span>
            </button>

            {dropdownMenu}
        </div>
    );
}
