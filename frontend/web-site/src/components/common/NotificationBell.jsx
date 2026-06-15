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

export default function NotificationBell({ role: roleProp }) {
    const { user } = useAuth();
    const role = roleProp ?? user?.role ?? "admin";
    const seeAllPath = getNotificationSeeAllPath(role);
    const canManageActions = canManageNotificationActions(role);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpenDropdown, setIsOpenDropdown] = useState(false);
    const [viewRow, setViewRow] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Lấy danh sách và số lượng chưa đọc từ API
    const fetchBellData = useCallback(async () => {
        try {
            const res = await notificationService.getAll(); // Giả định trả về mảng kết quả gốc
            // Tính toán số lượng chưa đọc dựa vào trường read_at === null
            const unreadList = res.filter((item) => isNotificationUnread(item));
            setUnreadCount(unreadList.length);
            
            // Map dữ liệu chuẩn hóa giống NotificationPage và giới hạn tối đa 5 phần tử
            const formatted = res.slice(0, 5).map((item) => formatNotificationRow(item));
            setNotifications(formatted);
        } catch (error) {
            console.error(handleApiError(error, "Không thể tải thông báo chuông"));
        }
    }, []);

    useEffect(() => {
        fetchBellData();
        // Có thể setup Polling cứ 30s reload data 1 lần nếu cần thiết tại đây
    }, [fetchBellData]);

    // Đóng dropdown khi click ra ngoài vùng hiển thị
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpenDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Xử lý đánh dấu đã đọc khi xem
    // Xử lý đánh dấu đã đọc khi xem
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
    }, []);

    // Xử lý khi nhấn vào từng item thông báo trong chuông
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
            {/* Nút Chuông */}
            <button 
                onClick={() => setIsOpenDropdown(!isOpenDropdown)}
                className="hover:scale-105 cursor-pointer relative p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600"
            >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full border border-stone-50 animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown 5 thông báo */}
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
                onClose={() => {
                    setViewRow(null);      
                    fetchBellData();     
                }}
                notification={viewRow}
                loading={actionLoading}
                canManageActions={canManageActions}
            />
        </div>
    );
}