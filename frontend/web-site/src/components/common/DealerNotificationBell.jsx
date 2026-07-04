import { useEffect, useState, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { notificationService, handleApiError } from "../../services/api/notificationService";
import DealerNotificationDropdown from "./DealerNotificationDropdown";
import { getNotificationSeeAllPath } from "./notificationRolePaths";
import {
    formatNotificationRow,
    isNotificationUnread,
    getMarkedReadState,
    resolveMarkReadId,
    matchesNotificationRecord,
} from "../Admin/Notification/notificationFormatters";
import { useAuth } from "../../contexts/authProvider";
import { useNotificationBellData } from "../../hooks/useNotificationBellData";

const getNotificationRoute = (item) => {
    const referenceType = item.referenceType ?? item.reference_type;
    const referenceId = item.referenceId ?? item.reference_id;

    switch (referenceType) {
        case "purchase_order": return `/dai-ly/nhap-hang/chi-tiet/${referenceId}`;
        case "customer_order": return `/dai-ly/ban-hang`;
        case "category": return `/dai-ly/danh-muc/${referenceId}`;
        case "account_document": return `/dai-ly/cau-hinh`;
        case "dealer": return `/dai-ly/cau-hinh`;
        default: return null;
    }
};

export default function DealerNotificationBell({ role: roleProp }) {
    const { user } = useAuth();
    const role = roleProp ?? user?.role ?? "dealer";
    const seeAllPath = getNotificationSeeAllPath(role);

    const {
        unreadCount,
        setUnreadCount,
        notifications,
        setNotifications,
    } = useNotificationBellData({ enabled: Boolean(user) });

    const [isOpenDropdown, setIsOpenDropdown] = useState(false);

    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

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

        const route = getNotificationRoute(formatted);
        if (route) {
            if (location.pathname === route) {
                navigate(route, { replace: true, state: { refresh: Date.now() } });
            } else {
                navigate(route);
            }
        }
    }, [handleMarkRead, navigate, location.pathname]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpenDropdown(!isOpenDropdown)}
                className="hover:scale-105 cursor-pointer relative p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600"
            >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full border border-stone-50 animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpenDropdown && (
                <DealerNotificationDropdown
                    items={notifications}
                    onItemClick={handleItemClick}
                    onSeeMore={() => {
                        setIsOpenDropdown(false);
                        navigate(seeAllPath);
                    }}
                    hasMore={false}
                />
            )}
        </div>
    );
}
