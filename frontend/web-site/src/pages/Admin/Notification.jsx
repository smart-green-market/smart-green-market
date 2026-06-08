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
    ] = useState("");

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

                            // local state
                            isRead: false,
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

    // ── FETCH DETAIL NOTIFICATION ─────────────────────
    const handleViewNotification =
        useCallback(async (row) => {
            try {
                setLoading(true);

                const detail =
                    await notificationService.getById(
                        row.id
                    );

                const formattedDetail = {
                    id: detail.id,

                    type:
                        detail.type,

                    typeLabel:
                        detail.type_label,

                    title:
                        detail.title,

                    content:
                        detail.content,

                    referenceType:
                        detail.reference_type,

                    referenceTypeLabel:
                        detail.reference_type_label,

                    referenceId:
                        detail.reference_id,

                    createdAt:
                        detail.created_at,

                    createdBy:
                        detail.created_by,

                    isRead:
                        row.isRead,
                };

                setViewRow(
                    formattedDetail
                );

            } catch (error) {

                handleApiError(
                    error,
                    "Không thể tải chi tiết thông báo"
                );

            } finally {
                setLoading(false);
            }
        }, []);

    // ── MARK READ ─────────────────────────────────────
    const handleMarkRead =
        async (notification) => {

            try {
                setActionLoading(true);

                await notificationService.mark_read(
                    notification.id
                );

                // update local state
                setData((prev) =>
                    prev.map((item) =>
                        item.id ===
                        notification.id
                            ? {
                                ...item,
                                isRead: true,
                            }
                            : item
                    )
                );

                setViewRow((prev) =>
                    prev
                        ? {
                            ...prev,
                            isRead: true,
                        }
                        : null
                );

            } catch (error) {

                console.error(
                    handleApiError(
                        error,
                        "Không thể đánh dấu đã đọc"
                    )
                );

            } finally {
                setActionLoading(false);
            }
        };

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
                onChange={
                    handleMarkRead
                }
                loading={
                    actionLoading
                }
            />
        </div>
    );
}