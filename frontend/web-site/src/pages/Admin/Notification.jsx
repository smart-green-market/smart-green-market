import {
    useCallback,
    useMemo,
    useState,
} from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminListPagination from "../../components/Admin/UI/AdminListPagination";
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
import { useNotificationWebSocket } from "../../hooks/useNotificationWebSocket";
import { useAdminPaginatedList } from "../../hooks/useAdminPaginatedList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

import {
    notificationService,
    handleApiError,
} from "../../services/api/notificationService";

const NOTIFICATION_TYPE_FILTERS = ["info", "warning", "success", "error"];
const NOTIFICATION_REFERENCE_FILTERS = ["supplier_document", "certification"];

export default function NotificationPage() {
    const { user } = useAuth();
    const userRole = user?.role ?? "admin";
    const canManageActions = canManageNotificationActions(userRole);

    const [actionLoading, setActionLoading] =
        useState(false);
    const [detailLoading, setDetailLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");
    const debouncedSearch = useDebouncedValue(search, 350);

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("unread");

    const [viewRow, setViewRow] =
        useState(null);

    const filterQuery = useMemo(() => {
        if (!statusFilter) return {};
        if (statusFilter === "read") return { is_read: true };
        if (statusFilter === "unread") return { is_read: false };
        if (NOTIFICATION_TYPE_FILTERS.includes(statusFilter)) {
            return { type: statusFilter };
        }
        if (NOTIFICATION_REFERENCE_FILTERS.includes(statusFilter)) {
            return { reference_type: statusFilter };
        }
        return {};
    }, [statusFilter]);

    const {
        data,
        isFetching,
        loadError,
        loading,
        error: listError,
        currentPage,
        totalPages,
        pageRange,
        totalCount,
        fetchData,
        refresh,
        handlePageChange,
        setCurrentPage,
    } = useAdminPaginatedList({
        fetchList: (params) => notificationService.getList(params),
        mapRows: (rows) => rows.map((item) => formatNotificationRow(item)),
        buildQuery: () => ({
            search: debouncedSearch || undefined,
            ...filterQuery,
        }),
        queryDeps: [debouncedSearch, statusFilter],
        onFetchError: (err) =>
            handleApiError(err, "Không thể tải danh sách thông báo"),
    });

    const handleMarkRead = useCallback(async (markReadId, receiptId) => {
        if (markReadId == null) return;

        try {
            setActionLoading(true);
            const response = await notificationService.mark_read(markReadId);
            const markedState = getMarkedReadState(response);

            setViewRow((prev) =>
                prev && matchesNotificationRecord(prev, markReadId, receiptId)
                    ? { ...prev, ...markedState }
                    : prev,
            );
            await refresh();
        } catch (error) {
            console.error(handleApiError(error, "Không thể đánh dấu đã đọc"));
        } finally {
            setActionLoading(false);
        }
    }, [refresh]);

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
                setDetailLoading(true);
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
                setDetailLoading(false);
            }
        }
    }, [handleMarkRead, userRole]);

    useNotificationWebSocket({
        enabled: Boolean(user),
        onMessage: () => refresh(),
        onConnect: () => refresh(),
    });

    return (
        <AdminInitialLoadGate
            isFetching={isFetching}
            loadError={loadError}
            onRetry={() => fetchData({ page: currentPage, initial: true })}
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
                            onChange={(value) => {
                                setStatusFilter(value);
                                setCurrentPage(1);
                            }}
                        />
                    }
                />

                {/* ERROR */}
                {(error || listError) && (
                    <div className="px-4 py-3 rounded-xl bg-red-100 text-red-700 text-sm">
                        {error || listError}
                    </div>
                )}

                {/* TABLE */}
                <div className="flex flex-col gap-4">
                    <NotificationTable
                        data={data}
                        loading={loading}
                        onView={
                            handleViewNotification
                        }
                    />
                    <AdminListPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        pageRange={pageRange}
                        onPageChange={handlePageChange}
                        noun="thông báo"
                    />
                </div>

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
                        actionLoading || detailLoading
                    }
                    canManageActions={canManageActions}
                />
            </div>
        </AdminInitialLoadGate>
    );
}