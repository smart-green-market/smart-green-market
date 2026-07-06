import { useCallback, useState } from "react";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminListPagination from "../../components/Admin/UI/AdminListPagination";
import Toolbar from "../../components/Admin/UI/Toolbar";
import Filter from "../../components/Admin/ProductMaster/ProductMasterFilter";
import ProductMasterTable from "../../components/Admin/ProductMaster/ProductMasterTable";
import ProductMasterViewModal from "../../components/Admin/ProductMaster/ProductMasterViewModal";
import ProductMasterFormModal from "../../components/Admin/ProductMaster/ProductMasterFormModal";
import {
    buildProductMasterPayload,
    formatProductMasterDetail,
    formatProductMasterRow,
    PRODUCT_MASTER_STATUS,
} from "../../components/Admin/ProductMaster/productMasterHelpers";
import { appToast } from "../../components/common/toast";
import {
    productMasterService,
    handleApiError,
} from "../../services/api/Admin/productMasterService";
import { useAdminPaginatedList } from "../../hooks/useAdminPaginatedList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export default function ProductMasterPage() {
    const [actionLoading, setActionLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 350);
    const [statusFilter, setStatusFilter] = useState("");
    const [seasonFilter] = useState("");
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
        fetchList: (params) => productMasterService.getList(params),
        mapRows: (rows) => rows.map(formatProductMasterRow),
        buildQuery: () => ({
            search: debouncedSearch || undefined,
            status: statusFilter || undefined,
            season: seasonFilter || undefined,
        }),
        queryDeps: [debouncedSearch, statusFilter, seasonFilter],
        onFetchError: (err) =>
            handleApiError(err, "Không thể tải danh sách sản phẩm"),
    });

    const handleViewProduct = useCallback(async (row) => {
        try {
            setDetailLoading(true);
            setError("");
            const detail = await productMasterService.getById(row.id);
            setViewRow(formatProductMasterDetail(detail));
        } catch (err) {
            setError(handleApiError(err, "Không thể tải chi tiết sản phẩm"));
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const handleCreate = async (formData) => {
        try {
            setActionLoading(true);
            setError("");
            await productMasterService.create(
                buildProductMasterPayload(formData),
            );
            appToast.success("Đã tạo danh mục sản phẩm.");
            await refresh();
        } catch (err) {
            const message = handleApiError(err, "Không thể tạo danh mục sản phẩm");
            setError(message);
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const refreshViewRow = async (id) => {
        const detail = await productMasterService.getById(id);
        setViewRow(formatProductMasterDetail(detail));
    };

    const handleUpdate = async (product, formData) => {
        try {
            setActionLoading(true);
            setError("");
            await productMasterService.update(
                product.id,
                buildProductMasterPayload({
                    ...formData,
                    status: product.status,
                }),
            );
            await refreshViewRow(product.id);
            appToast.success("Đã cập nhật danh mục sản phẩm.");
            await refresh();
        } catch (err) {
            const message = handleApiError(
                err,
                "Không thể cập nhật danh mục sản phẩm",
            );
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (product) => {
        try {
            setActionLoading(true);
            setError("");
            await productMasterService.remove(product.id);
            setViewRow(null);
            appToast.success("Đã xóa danh mục sản phẩm.");
            await refresh();
        } catch (err) {
            const message = handleApiError(err, "Không thể xóa danh mục sản phẩm");
            setError(message);
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (product, status) => {
        try {
            setActionLoading(true);
            setError("");
            await productMasterService.update(product.id, {
                status,
            });
            await refreshViewRow(product.id);
            appToast.success(
                status === PRODUCT_MASTER_STATUS.ACTIVE
                    ? "Đã mở khóa danh mục sản phẩm."
                    : "Đã khóa danh mục sản phẩm.",
            );
            await refresh();
        } catch (err) {
            const message = handleApiError(
                err,
                "Không thể thay đổi trạng thái sản phẩm",
            );
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
            loadingMessage="Đang tải danh sách sản phẩm..."
        >
            <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
                <Toolbar
                    search={search}
                    onSearch={setSearch}
                    onAdd={() => setIsCreateOpen(true)}
                    addLabel="Thêm danh mục sản phẩm"
                    searchPlaceholder="Tìm kiếm danh mục sản phẩm..."
                    // filter={
                    //     <>
                    //         <Filter
                    //             value={statusFilter}
                    //             onChange={(value) => {
                    //                 setStatusFilter(value);
                    //                 setCurrentPage(1);
                    //             }}
                    //         />
                    //         {/* <SeasonFilter
                    //             value={seasonFilter}
                    //             onChange={setSeasonFilter}
                    //         /> */}
                    //     </>
                    // }
                />

                {error || listError ? (
                    <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                        {error || listError}
                    </div>
                ) : null}

                <div className="flex flex-col gap-4">
                    <ProductMasterTable
                        data={data}
                        loading={loading}
                        onView={handleViewProduct}
                    />
                    <AdminListPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        pageRange={pageRange}
                        onPageChange={handlePageChange}
                        noun="danh mục sản phẩm"
                    />
                </div>

                <ProductMasterFormModal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={handleCreate}
                />

                <ProductMasterViewModal
                    isOpen={viewRow !== null}
                    onClose={() => setViewRow(null)}
                    product={viewRow}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    loading={actionLoading || detailLoading}
                />
            </div>
        </AdminInitialLoadGate>
    );
}
