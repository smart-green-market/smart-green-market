import { useCallback, useMemo, useState } from "react";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminFilterStatsCards from "../../components/Admin/UI/AdminFilterStatsCards";
import AdminListPagination from "../../components/Admin/UI/AdminListPagination";
import { CATEGORY_STAT_CARDS } from "../../components/Admin/UI/adminFilterStatsPresets";
import Toolbar from "../../components/Admin/UI/Toolbar";
import Filter from "../../components/Admin/Category/CategoryFilter";
import CategoryTable from "../../components/Admin/Category/CategoryTable";
import CategoryViewModal from "../../components/Admin/Category/CategoryViewModal";
import CategoryFormModal from "../../components/Admin/Category/CategoryFormModal";
import {
    buildCategoryListParams,
    buildSystemCategoryPayload,
    formatCategoryDetail,
    formatCategoryRow,
} from "../../components/Admin/Category/categoryHelpers";
import { appToast } from "../../components/common/toast";
import {
    buildCountsFromCards,
    buildCountsFromStatusMap,
} from "../../utils/adminFilterStatsUtils";
import { categoryService, handleApiError } from "../../services/api/categoryService";
import { useAdminPaginatedList } from "../../hooks/useAdminPaginatedList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export default function CategoryPage() {
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 350);
    const [statusFilter, setStatusFilter] = useState("");
    const [viewRow, setViewRow] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const {
        data,
        countStatus,
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
        fetchList: (params) => categoryService.getList(params),
        mapRows: (rows) => rows.map(formatCategoryRow),
        buildQuery: () => ({
            ...buildCategoryListParams(statusFilter),
            search: debouncedSearch || undefined,
        }),
        queryDeps: [statusFilter, debouncedSearch],
        onFetchError: (err) =>
            handleApiError(err, "Không thể tải danh sách danh mục"),
    });

    const handleViewCategory = useCallback(async (row) => {
        try {
            setDetailLoading(true);
            const detail = await categoryService.getById(row.id);
            setViewRow(formatCategoryDetail(detail));
        } catch (error) {
            const message = handleApiError(
                error,
                "Không thể tải chi tiết danh mục",
            );
            setError(message);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const categoryStats = useMemo(() => {
        if (countStatus && Object.keys(countStatus).length > 0) {
            return buildCountsFromStatusMap(countStatus, CATEGORY_STAT_CARDS);
        }
        return buildCountsFromCards(data, CATEGORY_STAT_CARDS, { field: "status" });
    }, [countStatus, data]);

    const refreshCategoryData = useCallback(async () => {
        await refresh();
    }, [refresh]);

    const handleCreateSystem = async (formData) => {
        try {
            setActionLoading(true);
            setError("");
            await categoryService.createSystem(buildSystemCategoryPayload(formData));
            appToast.success("Đã tạo danh mục hệ thống.");
            await refreshCategoryData();
        } catch (error) {
            const message = handleApiError(error, "Không thể tạo danh mục hệ thống");
            setError(message);
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateSystem = async (category, formData) => {
        try {
            setActionLoading(true);
            setError("");
            const updated = await categoryService.update(
                category.id,
                buildSystemCategoryPayload(formData),
            );
            setViewRow(formatCategoryDetail(updated));
            appToast.success("Đã cập nhật danh mục hệ thống.");
            await refreshCategoryData();
        } catch (error) {
            const message = handleApiError(error, "Không thể cập nhật danh mục");
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSystem = async (category) => {
        try {
            setActionLoading(true);
            setError("");
            await categoryService.delete(category.id);
            setViewRow(null);
            appToast.success("Đã xóa danh mục.");
            await refreshCategoryData();
        } catch (error) {
            const message = handleApiError(error, "Không thể xóa danh mục");

            // Hiển thị toast cảnh báo riêng khi danh mục còn sản phẩm
            if (
                error?.response?.status === 409 ||
                message.toLowerCase().includes("sản phẩm") ||
                message.toLowerCase().includes("product")
            ) {
                appToast.warning(
                    "Không thể xóa danh mục này vì vẫn còn sản phẩm liên kết. Hãy xóa hoặc chuyển sản phẩm trước.",
                );
            } else {
                appToast.error(message);
            }

            setError(message);
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async (category) => {
        try {
            setActionLoading(true);
            await categoryService.verify(category.id, {
                status: "active",
                rejection_reason: "",
            });
            setViewRow(null);
            appToast.success("Đã duyệt danh mục.");
            await refreshCategoryData();
        } catch (error) {
            const message = handleApiError(error, "Không thể duyệt danh mục");
            setError(message);
            console.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (category, rejectionReason) => {
        try {
            setActionLoading(true);
            await categoryService.verify(category.id, {
                status: "rejected",
                rejection_reason: rejectionReason,
            });
            setViewRow(null);
            appToast.success("Đã từ chối danh mục.");
            await refreshCategoryData();
        } catch (error) {
            const msg = handleApiError(error, "Không thể từ chối danh mục");
            console.error(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLock = async (category) => {
        try {
            setActionLoading(true);
            await categoryService.lock(category.id);
            setViewRow(null);
            appToast.success("Đã khóa danh mục.");
            await refreshCategoryData();
        } catch (error) {
            const message = handleApiError(error, "Không thể khóa danh mục");
            setError(message);
            console.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnlock = async (category) => {
        try {
            setActionLoading(true);
            await categoryService.unlock(category.id);
            setViewRow(null);
            appToast.success("Đã mở khóa danh mục.");
            await refreshCategoryData();
        } catch (error) {
            const message = handleApiError(error, "Không thể mở khóa danh mục");
            setError(message);
            console.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminInitialLoadGate
            isFetching={isFetching}
            loadError={loadError}
            onRetry={() => fetchData({ page: currentPage, initial: true })}
            loadingMessage="Đang tải danh sách danh mục..."
        >
            <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
                <AdminFilterStatsCards
                    counts={categoryStats}
                    activeFilter={statusFilter}
                    onFilterChange={(value) => {
                        setStatusFilter(value);
                        setCurrentPage(1);
                    }}
                    loading={isFetching || loading}
                />

                <Toolbar
                    search={search}
                    onSearch={setSearch}
                    onAdd={() => setIsCreateOpen(true)}
                    addLabel="Thêm danh mục"
                    searchPlaceholder="Tìm kiếm danh mục..."
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

                {error || listError ? (
                    <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                        {error || listError}
                    </div>
                ) : null}

                <div className="flex flex-col gap-4">
                    <CategoryTable
                        data={data}
                        loading={loading}
                        onView={handleViewCategory}
                    />
                    <AdminListPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        pageRange={pageRange}
                        onPageChange={handlePageChange}
                        noun="danh mục"
                    />
                </div>

                <CategoryFormModal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={handleCreateSystem}
                />

                <CategoryViewModal
                    isOpen={viewRow !== null}
                    onClose={() => setViewRow(null)}
                    category={viewRow}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onLock={handleLock}
                    onUnlock={handleUnlock}
                    onUpdate={handleUpdateSystem}
                    onDelete={handleDeleteSystem}
                    loading={actionLoading || detailLoading}
                />
            </div>
        </AdminInitialLoadGate>
    );
}