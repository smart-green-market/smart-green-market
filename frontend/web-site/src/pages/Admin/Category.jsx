import { useCallback, useEffect, useState } from "react";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import Toolbar from "../../components/Admin/UI/Toolbar";
import Filter from "../../components/Admin/Category/CategoryFilter";
import CategoryTable from "../../components/Admin/Category/CategoryTable";
import CategoryViewModal from "../../components/Admin/Category/CategoryViewModal";
import CategoryFormModal from "../../components/Admin/Category/CategoryFormModal";
import {
    buildSystemCategoryPayload,
    formatCategoryDetail,
    formatCategoryRow,
} from "../../components/Admin/Category/categoryHelpers";
import { appToast } from "../../components/common/toast";
import { categoryService, handleApiError} from "../../services/api/categoryService";

export default function CategoryPage() {
    const [data, setData] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");
    const [viewRow, setViewRow] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchCategories = useCallback(async ({ initial = false } = {}) => {
        try {
            if (initial) {
                setIsFetching(true);
                setLoadError("");
            } else {
                setLoading(true);
            }

            const response = await categoryService.getAll();
            setData(response.map(formatCategoryRow));
        } catch (error) {
            const message = handleApiError(
                error,
                "Không thể tải danh sách danh mục",
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

    const handleViewCategory = useCallback(async (row) => {
        try {
            setLoading(true);
            const detail = await categoryService.getById(row.id);
            setViewRow(formatCategoryDetail(detail));
        } catch (error) {
            const message = handleApiError(
                error,
                "Không thể tải chi tiết danh mục",
            );
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories({ initial: true });
    }, [fetchCategories]);

    const handleCreateSystem = async (formData) => {
        try {
            setActionLoading(true);
            setError("");
            await categoryService.createSystem(buildSystemCategoryPayload(formData));
            appToast.success("Đã tạo danh mục hệ thống.");
            await fetchCategories();
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
            await fetchCategories();
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
            appToast.success("Đã xóa danh mục hệ thống.");
            await fetchCategories();
        } catch (error) {
            const message = handleApiError(error, "Không thể xóa danh mục");
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
            await fetchCategories();
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
            await fetchCategories();
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
            await fetchCategories();
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
            await fetchCategories();
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
            onRetry={() => fetchCategories({ initial: true })}
            loadingMessage="Đang tải danh sách danh mục..."
        >
            <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
                <Toolbar
                    search={search}
                    onSearch={setSearch}
                    onAdd={() => setIsCreateOpen(true)}
                    addLabel="Thêm danh mục"
                    searchPlaceholder="Tìm kiếm danh mục..."
                    filter={<Filter value={statusFilter} onChange={setStatusFilter} />}
                />

                {error ? (
                    <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                <CategoryTable
                    data={data}
                    loading={loading}
                    search={search}
                    statusFilter={statusFilter}
                    onView={handleViewCategory}
                />

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
                    loading={actionLoading}
                />
            </div>
        </AdminInitialLoadGate>
    );
}
