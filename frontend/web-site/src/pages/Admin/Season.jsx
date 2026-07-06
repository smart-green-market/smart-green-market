import { useCallback, useState } from "react";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminListPagination from "../../components/Admin/UI/AdminListPagination";
import Toolbar from "../../components/Admin/UI/Toolbar";
import SeasonFilter from "../../components/Admin/Season/SeasonFilter";
import SeasonTable from "../../components/Admin/Season/SeasonTable";
import SeasonViewModal from "../../components/Admin/Season/SeasonViewModal";
import SeasonFormModal from "../../components/Admin/Season/SeasonFormModal";
import {
    buildSeasonPayload,
    formatSeasonDetail,
    formatSeasonRow,
    SEASON_STATUS,
} from "../../components/Admin/Season/seasonHelpers";
import { appToast } from "../../components/common/toast";
import {
    seasonService,
    handleApiError,
} from "../../services/api/Admin/seasonService";
import { useAdminPaginatedList } from "../../hooks/useAdminPaginatedList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export default function SeasonPage() {
    const [actionLoading, setActionLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 350);
    const [statusFilter, setStatusFilter] = useState("");
    const [viewRow, setViewRow] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

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
        fetchList: (params) => seasonService.getList(params),
        mapRows: (rows) => rows.map(formatSeasonRow),
        buildQuery: () => ({
            search: debouncedSearch || undefined,
            status: statusFilter || undefined,
        }),
        queryDeps: [debouncedSearch, statusFilter],
        onFetchError: (err) =>
            handleApiError(err, "Không thể tải danh sách mùa"),
    });

    const handleViewSeason = useCallback(async (row) => {
        try {
            setDetailLoading(true);
            setError("");
            const detail = await seasonService.getById(row.id);
            setViewRow(formatSeasonDetail(detail));
        } catch (err) {
            setError(handleApiError(err, "Không thể tải chi tiết mùa"));
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const handleCreate = async (formData) => {
        try {
            setActionLoading(true);
            setError("");
            await seasonService.create(buildSeasonPayload(formData));
            appToast.success("Đã tạo mùa.");
            await refresh();
        } catch (err) {
            const message = handleApiError(err, "Không thể tạo mùa");
            setError(message);
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const refreshViewRow = async (id) => {
        const detail = await seasonService.getById(id);
        setViewRow(formatSeasonDetail(detail));
    };

    const handleUpdate = async (season, formData) => {
        try {
            setActionLoading(true);
            setError("");
            await seasonService.update(
                season.id,
                buildSeasonPayload({
                    ...formData,
                    status: season.status,
                }),
            );
            await refreshViewRow(season.id);
            appToast.success("Đã cập nhật mùa.");
            await refresh();
        } catch (err) {
            const message = handleApiError(err, "Không thể cập nhật mùa");
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (season) => {
        try {
            setActionLoading(true);
            setError("");
            await seasonService.remove(season.id);
            setViewRow(null);
            appToast.success("Đã xóa mùa.");
            await refresh();
        } catch (err) {
            const message = handleApiError(err, "Không thể xóa mùa");
            setError(message);
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (season, status) => {
        try {
            setActionLoading(true);
            setError("");
            await seasonService.update(season.id, { status });
            await refreshViewRow(season.id);
            appToast.success(
                status === SEASON_STATUS.ACTIVE
                    ? "Đã mở khóa mùa."
                    : "Đã khóa mùa.",
            );
            await refresh();
        } catch (err) {
            const message = handleApiError(err, "Không thể thay đổi trạng thái mùa");
            setError(message);
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminInitialLoadGate
            isFetching={isFetching}
            loadError={loadError}
            onRetry={() => fetchData({ page: currentPage, initial: true })}
            loadingMessage="Đang tải danh sách mùa..."
        >
            <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                            <CalendarRange size={22} />
                        </span>
                        <div>
                            <h1 className="text-xl font-semibold text-emerald-950">
                                Quản lý mùa
                            </h1>
                            <p className="text-sm text-neutral-500">
                                Cấu hình mùa vụ cho catalog sản phẩm
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/quan-tri/san-pham-chuan"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 no-underline transition-colors hover:bg-neutral-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại Catalog Product
                    </Link>
                </div>

                <Toolbar
                    search={search}
                    onSearch={setSearch}
                    onAdd={() => setIsCreateOpen(true)}
                    addLabel="Thêm mùa"
                    searchPlaceholder="Tìm kiếm mùa..."
                    filter={
                        <SeasonFilter
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value);
                                setCurrentPage(1);
                            }}
                        />
                    }
                />

                {error || listError ? (
                    <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                        {error || listError}
                    </div>
                ) : null}

                <div className="flex flex-col gap-4">
                    <SeasonTable
                        data={data}
                        loading={loading}
                        onView={handleViewSeason}
                    />
                    <AdminListPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        pageRange={pageRange}
                        onPageChange={handlePageChange}
                        noun="mùa"
                    />
                </div>

                <SeasonFormModal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={handleCreate}
                    existingSeasons={data}
                />

                <SeasonViewModal
                    isOpen={viewRow !== null}
                    onClose={() => setViewRow(null)}
                    season={viewRow}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    loading={actionLoading || detailLoading}
                />
            </div>
        </AdminInitialLoadGate>
    );
}
