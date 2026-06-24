import { useEffect, useState, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationService, handleApiError } from "../../services/api/notificationService";
import NotificationDropdown from "./NotificationDropdown";
import { getNotificationSeeAllPath } from "./notificationRolePaths";
import {
    formatNotificationRow,
    isNotificationUnread,
    getMarkedReadState,
    resolveMarkReadId,
    matchesNotificationRecord,
} from "../Admin/Notification/notificationFormatters";
import { useAuth } from "../../contexts/authProvider";

const getNotificationRoute = (item) => {
    const referenceType = item.referenceType ?? item.reference_type;
    const referenceId = item.referenceId ?? item.reference_id;
    
    switch (referenceType) {
        case "purchase_order":   return `/dai-ly/nhap-hang/chi-tiet/${referenceId}`;
        case "customer_order":   return `/dai-ly/ban-hang`;
        case "category":         return `/dai-ly/danh-muc`;
        case "account_document": return `/dai-ly/cau-hinh`;
        case "dealer":           return `/dai-ly/cau-hinh`;
        default:                 return null;
    }
};

export default function DealerNotificationBell({ role: roleProp }) {
    const { user } = useAuth();
    const role = roleProp ?? user?.role ?? "admin";
    const seeAllPath = getNotificationSeeAllPath(role);

    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpenDropdown, setIsOpenDropdown] = useState(false);

    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchBellData = useCallback(async () => {
        try {
            const res = await notificationService.getAll();
            const unreadList = res.filter((item) => isNotificationUnread(item));
            setUnreadCount(unreadList.length);
            const formatted = res.slice(0, 5).map((item) => formatNotificationRow(item));
            setNotifications(formatted);
        } catch (error) {
            console.error(handleApiError(error, "Không thể tải thông báo chuông"));
        }
    }, []);

    useEffect(() => {
        fetchBellData();
        // Polling mỗi 30s nếu cần:
        // const timer = setInterval(fetchBellData, 30000);
        // return () => clearInterval(timer);
    }, [fetchBellData]);

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
    }, []);

    const handleItemClick = useCallback((item) => {
        setIsOpenDropdown(false);

        const notificationId = resolveMarkReadId(item);
        if (notificationId != null && isNotificationUnread(item)) {
            handleMarkRead(notificationId, item.receiptId ?? item.receipt_id);
        }

        const route = getNotificationRoute(item);
        if (route) {
            navigate(route);
        }
    }, [handleMarkRead, navigate]);

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
                <NotificationDropdown
                    items={notifications}
                    onItemClick={handleItemClick}
                    onSeeMore={() => {
                        setIsOpenDropdown(false);
                        navigate(seeAllPath);
                    }}
                />
            )}
        </div>
    );
}