import { useEffect, useState, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationService, handleApiError } from "../../services/api/notificationService";
import NotificationDropdown from "./NotificationDropdown";
import NotificationViewModal from "../Admin/Notification/NotificationViewModal";

export default function NotificationBell() {
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
            const unreadList = res.filter(item => !item.read_at);
            setUnreadCount(unreadList.length);
            
            // Map dữ liệu chuẩn hóa giống NotificationPage và giới hạn tối đa 5 phần tử
            const formatted = res.slice(0, 5).map(item => ({
                id: item.id,
                type: item.type,
                typeLabel: item.type_label,
                title: item.title,
                content: item.content,
                referenceType: item.reference_type,
                referenceTypeLabel: item.reference_type_label,
                referenceId: item.reference_id,
                createdAt: item.created_at,
                readAt: item.read_at,
            }));
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
    const handleMarkRead = useCallback(async (id) => {
        try {
            setActionLoading(true);
            // Gọi API cập nhật trạng thái đã đọc trên server
            await notificationService.mark_read(id); 
            
            const nowIso = new Date().toISOString();
            
            // Cập nhật nhanh trạng thái tại local để giao diện phản hồi lập tức (Không đợi đóng modal)
            setNotifications(prev => prev.map(item => item.id === id ? { ...item, readAt: nowIso } : item));
            setUnreadCount(prev => Math.max(0, prev - 1));
            setViewRow(prev => prev && prev.id === id ? { ...prev, readAt: nowIso } : prev);
        } catch (error) {
            console.error(handleApiError(error, "Không thể đánh dấu đã đọc"));
        } finally {
            setActionLoading(false);
        }
    }, []);

    // Xử lý khi nhấn vào từng item thông báo trong chuông
    const handleItemClick = useCallback(async (item) => {
        setIsOpenDropdown(false);
        try {
            const detail = await notificationService.getById(item.id);
            const formattedDetail = {
                id: detail.id,
                type: detail.type,
                typeLabel: detail.type_label,
                title: detail.title,
                content: detail.content,
                referenceType: detail.reference_type,
                referenceTypeLabel: detail.reference_type_label,
                referenceId: detail.reference_id,
                createdAt: detail.created_at,
                readAt: detail.read_at || item.readAt,
            };
            setViewRow(formattedDetail);

            if (!formattedDetail.readAt) {
                await handleMarkRead(item.id);
            }
        } catch (error) {
            console.error(handleApiError(error));
        }
    }, [handleMarkRead]);

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
                        navigate("/quan-tri/tat-ca-thong-bao");
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
                onChange={() => viewRow && handleMarkRead(viewRow.id)}
                loading={actionLoading}
            />
        </div>
    );
}