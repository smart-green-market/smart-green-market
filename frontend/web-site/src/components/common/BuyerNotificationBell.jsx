import { useEffect, useState, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationService, handleApiError } from "../../services/api/notificationService";
import NotificationDropdown from "./NotificationDropdown";
import {
    formatNotificationRow,
    isNotificationUnread,
    getMarkedReadState,
    resolveMarkReadId,
    matchesNotificationRecord,
} from "../Admin/Notification/notificationFormatters";
import { useAuth } from "../../contexts/authProvider";
import { useNotificationBellData } from "../../hooks/useNotificationBellData";
import { useStorefrontPaths } from "../../hooks/useStorefrontPaths";

const getBuyerNotificationRoute = (item, orderStatusPath) => {
    const referenceType = item.referenceType ?? item.reference_type;

    if (referenceType === "customer_order") {
        return orderStatusPath;
    }

    return orderStatusPath;
};

export default function BuyerNotificationBell() {
    const { user } = useAuth();
    const paths = useStorefrontPaths();
    const navigate = useNavigate();

    const {
        unreadCount,
        setUnreadCount,
        notifications,
        setNotifications,
    } = useNotificationBellData({ enabled: Boolean(user) });

    const [isOpenDropdown, setIsOpenDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpenDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkRead = useCallback(async (markReadId, receiptId) => {
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
    }, [setNotifications, setUnreadCount]);

    const handleItemClick = useCallback((item) => {
        setIsOpenDropdown(false);

        const formatted = formatNotificationRow(item);
        const notificationId = resolveMarkReadId(formatted);

        if (notificationId != null && isNotificationUnread(formatted)) {
            handleMarkRead(notificationId, formatted.receiptId);
        }

        const route = getBuyerNotificationRoute(formatted, paths.orderStatus);
        if (route) {
            navigate(route);
        }
    }, [handleMarkRead, navigate, paths.orderStatus]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpenDropdown(!isOpenDropdown)}
                className="cursor-pointer hover:scale-110 transition-transform duration-200 relative flex flex-col items-center gap-0.5 rounded-full p-2 text-white transition-colors hover:bg-white/10 md:rounded-lg md:px-3 md:py-1.5"
                title="Thông báo"
                aria-label="Thông báo"
            >
                <span className="relative inline-flex">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-emerald-700 animate-pulse">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </span>
                <span className="hidden text-xs font-medium leading-none md:block">
                    Thông báo
                </span>
            </button>

            {isOpenDropdown && (
                <NotificationDropdown
                    items={notifications}
                    onItemClick={handleItemClick}
                    onSeeMore={() => {
                        setIsOpenDropdown(false);
                        navigate(paths.orderStatus);
                    }}
                />
            )}
        </div>
    );
}
