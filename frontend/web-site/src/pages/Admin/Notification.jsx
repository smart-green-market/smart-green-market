import {
    useCallback,
    useEffect,
    useState,
} from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import Filter from "../../components/Admin/Notification/NotificationFilter";
import NotificationTable from "../../components/Admin/Notification/NotificationTable";
import NotificationViewModal from "../../components/Admin/Notification/NotificationViewModal";

import {
    notificationService,
    handleApiError,
} from "../../services/api/notificationService";

export default function NotificationPage() {

    // ── STATES ─────────────────────────────────────────
    const [data, setData] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("unread");

    const [viewRow, setViewRow] =
        useState(null);

    // ── FETCH ALL NOTIFICATIONS ───────────────────────
    const fetchNotifications =
        useCallback(async () => {
            try {
                setLoading(true);

                setError("");

                const response =
                    await notificationService.getAll();

                // normalize data cho table
                const formattedData =
                    response.map(
                        (item) => ({
                            id: item.id,

                            type:
                                item.type,

                            typeLabel:
                                item.type_label,

                            title:
                                item.title,

                            content:
                                item.content,

                            referenceType:
                                item.reference_type,

                            referenceTypeLabel:
                                item.reference_type_label,

                            referenceId:
                                item.reference_id,

                            createdAt:
                                item.created_at,

                            createdBy:
                                item.created_by,

                            readAt:item.read_at,
                        })
                    );

                setData(formattedData);

            } catch (error) {

                const message =
                    handleApiError(
                        error,
                        "Không thể tải danh sách thông báo"
                    );

                setError(message);

            } finally {
                setLoading(false);
            }
        }, []);

    const handleMarkRead = useCallback(async (notificationId) => {
        try {
            setActionLoading(true);
            await notificationService.mark_read(notificationId);

            // Cập nhật giá trị trực tiếp trên UI (Client State) biến `readAt` thành mốc thời gian hiện tại
            const nowIsoString = new Date().toISOString();
            setData((prev) =>
                prev.map((item) =>
                    item.id === notificationId ? { ...item, readAt: nowIsoString } : item
                )
            );

            setViewRow((prev) =>
                prev && prev.id === notificationId ? { ...prev, readAt: nowIsoString } : prev
            );
        } catch (error) {
            console.error(handleApiError(error, "Không thể đánh dấu đã đọc"));
        } finally {
            setActionLoading(false);
        }
    }, []);

    // ── BẤM NÚT XEM CHI TIẾT ───────────────────────────
    const handleViewNotification = useCallback(async (row) => {
        try {
            setLoading(true);
            const detail = await notificationService.getById(row.id);

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
                createdBy: detail.created_by,
                readAt: detail.read_at || row.readAt, // Lấy mốc từ detail hoặc fallback row hiện tại
            };

            setViewRow(formattedDetail);

            // ĐÚNG YÊU CẦU: Nếu thông báo này CHƯA ĐỌC, tự động chạy hàm kích hoạt API mark_read luôn
            if (!formattedDetail.readAt) {
                await handleMarkRead(row.id);
            }
        } catch (error) {
            handleApiError(error, "Không thể tải chi tiết thông báo");
        } finally {
            setLoading(false);
        }
    }, [handleMarkRead]);

    // ── INITIAL FETCH ─────────────────────────────────
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return (
        <div className="flex flex-col gap-6 px-8 pt-6 pb-10">

            {/* TOOLBAR */}
            <Toolbar
                search={search}
                onSearch={setSearch}
                searchPlaceholder="Tìm kiếm thông báo..."
            />

            {/* FILTER */}
            <div className="flex items-center gap-3">

                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide font-['Geist',sans-serif]">
                    Lọc:
                </span>

                <Filter
                    value={statusFilter}
                    onChange={
                        setStatusFilter
                    }
                />
            </div>

            {/* ERROR */}
            {error && (
                <div className="px-4 py-3 rounded-xl bg-red-100 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* TABLE */}
            <NotificationTable
                data={data}
                loading={loading}
                search={search}
                statusFilter={statusFilter}
                onView={
                    handleViewNotification
                }
            />

            {/* VIEW MODAL */}
            <NotificationViewModal
                isOpen={
                    viewRow !== null
                }
                onClose={() =>
                    setViewRow(null)
                }
                notification={viewRow}
                onChange={() => viewRow && handleMarkRead(viewRow.id)}
                loading={
                    actionLoading
                }
            />
        </div>
    );
}