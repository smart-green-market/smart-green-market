import { useEffect, useState, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationService, handleApiError } from "../../services/api/notificationService";
import NotificationDropdown from "./NotificationDropdown";
import NotificationViewModal from "../Admin/Notification/NotificationViewModal";
import { getNotificationSeeAllPath, canManageNotificationActions, canFetchNotificationDetail } from "./notificationRolePaths";
import {
    formatNotificationRow,
    mergeNotificationDetail,
    isNotificationUnread,
    getMarkedReadState,
    resolveMarkReadId,
    matchesNotificationRecord,
} from "../Admin/Notification/notificationFormatters";
import { useAuth } from "../../contexts/authProvider";
import { useNotificationBellData } from "../../hooks/useNotificationBellData";

export default function NotificationBell({ role: roleProp }) {
    const { user } = useAuth();
    const role = roleProp ?? user?.role ?? "admin";
    const seeAllPath = getNotificationSeeAllPath(role);
    const canManageActions = canManageNotificationActions(role);
    const {
        unreadCount,
        setUnreadCount,
        notifications,
        setNotifications,
    } = useNotificationBellData({ enabled: Boolean(user) });
    const [isOpenDropdown, setIsOpenDropdown] = useState(false);
    const [viewRow, setViewRow] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const dropdownRef = useRef(null);
    const navigate = useNavigate();

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
            setActionLoading(true);
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
            setViewRow((prev) =>
                prev && matchesNotificationRecord(prev, markReadId, receiptId)
                    ? { ...prev, ...markedState }
                    : prev,
            );
        } catch (error) {
            console.error(handleApiError(error, "Không thể đánh dấu đã đọc"));
        } finally {
            setActionLoading(false);
        }
    }, [setNotifications, setUnreadCount]);

    const handleItemClick = useCallback(async (item) => {
        setIsOpenDropdown(false);
        const formattedDetail = formatNotificationRow(item);
        const notificationId = resolveMarkReadId(formattedDetail);

        setViewRow(formattedDetail);

        if (notificationId != null && isNotificationUnread(formattedDetail)) {
            await handleMarkRead(notificationId, formattedDetail.receiptId);
        }

        if (canFetchNotificationDetail(role) && notificationId != null) {
            try {
                const detail = await notificationService.getById(notificationId);
                setViewRow((prev) => {
                    if (!prev) return null;
                    return mergeNotificationDetail(detail, prev);
                });
            } catch (error) {
                console.warn(
                    handleApiError(error, "Không thể tải chi tiết thông báo, dùng dữ liệu tóm tắt"),
                );
            }
        }
    }, [handleMarkRead, role]);

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
            <NotificationViewModal
                isOpen={viewRow !== null}
                onClose={() => setViewRow(null)}
                notification={viewRow}
                loading={actionLoading}
                canManageActions={canManageActions}
            />
        </div>
    );
}
