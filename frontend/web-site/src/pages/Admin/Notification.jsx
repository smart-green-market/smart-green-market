import {
    useCallback,
    useEffect,
    useState,
} from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import Filter from "../../components/Admin/Notification/NotificationFilter";
import NotificationTable from "../../components/Admin/Notification/NotificationTable";
import NotificationViewModal from "../../components/Admin/Notification/NotificationViewModal";
import { canManageNotificationActions, canFetchNotificationDetail } from "../../components/common/notificationRolePaths";
import {
    formatNotificationRow,
    mergeNotificationDetail,
    isNotificationUnread,
    getMarkedReadState,
    resolveMarkReadId,
    matchesNotificationRecord,
} from "../../components/Admin/Notification/notificationFormatters";
import { useAuth } from "../../contexts/authProvider";

import {
    notificationService,
    handleApiError,
} from "../../services/api/notificationService";

export default function NotificationPage() {
    const { user } = useAuth();
    const userRole = user?.role ?? "admin";
    const canManageActions = canManageNotificationActions(userRole);

    // ── STATES ─────────────────────────────────────────
    const [data, setData] =
        useState([]);

    const [isFetching, setIsFetching] =
        useState(true);

    const [loadError, setLoadError] =
        useState("");

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
        useCallback(async ({ initial = false } = {}) => {
            try {
                if (initial) {
                    setIsFetching(true);
                    setLoadError("");
                } else {
                    setLoading(true);
                }

                setError("");

                const response =
                    await notificationService.getAll();

                // normalize data cho table
                const formattedData = response.map((item) => formatNotificationRow(item));

                setData(formattedData);

            } catch (error) {

                const message =
                    handleApiError(
                        error,
                        "Không thể tải danh sách thông báo"
                    );

                if (initial) {
                    setLoadError(message);
                } else {
                    setError(message);
                }

            } finally {
                if (initial) {
                    setIsFetching(false);
                } else {
                    setLoading(false);
                }
            }
        }, []);

    const handleMarkRead = useCallback(async (markReadId, receiptId) => {
        if (markReadId == null) return;

        try {
            setActionLoading(true);
            const response = await notificationService.mark_read(markReadId);
            const markedState = getMarkedReadState(response);

            setData((prev) =>
                prev.map((item) =>
                    matchesNotificationRecord(item, markReadId, receiptId)
                        ? { ...item, ...markedState }
                        : item,
                ),
            );

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

    // ── BẤM NÚT XEM CHI TIẾT ───────────────────────────
    const handleViewNotification = useCallback(async (row) => {
        const formattedDetail = formatNotificationRow(row);
        const notificationId = resolveMarkReadId(formattedDetail);

        setViewRow(formattedDetail);

        if (notificationId != null && isNotificationUnread(formattedDetail)) {
            await handleMarkRead(notificationId, formattedDetail.receiptId);
        }

        if (canFetchNotificationDetail(userRole) && notificationId != null) {
            try {
                setLoading(true);
                const detail = await notificationService.getById(notificationId);
                setViewRow((prev) => {
                    if (!prev) return null;
                    return mergeNotificationDetail(detail, prev);
                });
            } catch (error) {
                console.warn(
                    handleApiError(error, "Không thể tải chi tiết thông báo, dùng dữ liệu tóm tắt"),
                );
            } finally {
                setLoading(false);
            }
        }
    }, [handleMarkRead, userRole]);

    // ── INITIAL FETCH ─────────────────────────────────
    useEffect(() => {
        fetchNotifications({ initial: true });
    }, [fetchNotifications]);

    return (
        <AdminInitialLoadGate
            isFetching={isFetching}
            loadError={loadError}
            onRetry={() => fetchNotifications({ initial: true })}
            loadingMessage="Đang tải danh sách thông báo..."
        >
        <div className="flex flex-col gap-6 px-8 pt-6 pb-10">

            {/* TOOLBAR */}
            <Toolbar
                search={search}
                onSearch={setSearch}
                searchPlaceholder="Tìm kiếm thông báo..."
                filter={
                    <Filter
                        value={statusFilter}
                        onChange={setStatusFilter}
                    />
                }
            />

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
                loading={
                    actionLoading
                }
                canManageActions={canManageActions}
            />
        </div>
        </AdminInitialLoadGate>
    );
}