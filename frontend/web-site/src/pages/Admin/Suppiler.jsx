import { useCallback, useState } from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminFilterStatsCards from "../../components/Admin/UI/AdminFilterStatsCards";
import AdminListPagination from "../../components/Admin/UI/AdminListPagination";
import { SUPPLIER_STAT_CARDS } from "../../components/Admin/UI/adminFilterStatsPresets";
import Filter from "../../components/Admin/Suppiler/SuppilerFilter";
import SupplierTable from "../../components/Admin/Suppiler/SuppilerTable";
import SupplierViewModal from "../../components/Admin/Suppiler/SupplierViewModal";
import {
    handleApiError,
    supplierService,
} from "../../services/api/suppilerService";
import { useAdminPaginatedList } from "../../hooks/useAdminPaginatedList";
import {
    useAdminFilterStats,
    useAdminStatsLoading,
} from "../../hooks/useAdminFilterStats";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const formatSupplierRow = (supplier) => ({
    id: supplier.id,
    company_name: supplier.company_name,
    address: supplier.address,
    phone: supplier.phone,
    tax_code: supplier.tax_code,
    description: supplier.description,
    verification_status: supplier.verification_status,
    created_at: supplier.created_at,
    updated_at: supplier.updated_at,
});

export default function SupplierPage() {
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 350);
    const [statusFilter, setStatusFilter] = useState("");
    const [viewRow, setViewRow] = useState(null);

    const {
        data,
        countStatus,
        isFetching,
        loadError,
        loading,
        currentPage,
        totalPages,
        pageRange,
        totalCount,
        fetchData,
        refresh,
        handlePageChange,
        setCurrentPage,
    } = useAdminPaginatedList({
        fetchList: (params) => supplierService.getList(params),
        mapRows: (rows) => rows.map(formatSupplierRow),
        buildQuery: () => ({
            search: debouncedSearch || undefined,
            status: statusFilter || undefined,
        }),
        queryDeps: [debouncedSearch, statusFilter],
        onFetchError: (err) =>
            handleApiError(err, "Không thể tải danh sách nhà cung cấp"),
    });

    const handleViewSupplier = useCallback(async (row) => {
        try {
            const detail = await supplierService.getById(row.id);
            setViewRow({
                id: detail.id,
                company_name: detail.company_name,
                address: detail.address,
                phone: detail.phone,
                tax_code: detail.tax_code,
                description: detail.description,
                verification_status: detail.verification_status,
                created_at: detail.created_at,
                updated_at: detail.updated_at,
                verified_at: detail.verified_at,
                full_name: detail.account?.full_name,
                email: detail.account?.email,
                avatar: detail.account?.avatar_url,
            });
        } catch (err) {
            setError(
                handleApiError(err, "Không thể tải chi tiết nhà cung cấp"),
            );
        }
    }, []);

    const handleApprove = useCallback(async (supplier) => {
        try {
            setActionLoading(true);
            setError("");
            await supplierService.verify(supplier.id, {
                verification_status: "approved",
            });
            await refresh();
        } catch (err) {
            let customMessage = "Không thể duyệt nhà cung cấp";
            if (err.response?.status === 400) {
                customMessage = "Vui lòng duyệt đủ 3 loại giấy tờ";
            } else {
                customMessage = handleApiError(err, customMessage);
            }
            setError(customMessage);
            throw new Error(customMessage);
        } finally {
            setActionLoading(false);
        }
    }, [refresh]);

    const handleReject = async (supplier, rejectionReason) => {
        try {
            setActionLoading(true);
            setError("");
            await supplierService.verify(supplier.id, {
                verification_status: "rejected",
                rejection_reason: rejectionReason,
            });
            setViewRow(null);
            await refresh();
        } catch (err) {
            const msg = handleApiError(err, "Không thể từ chối nhà cung cấp");
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const supplierStats = useAdminFilterStats({
        countStatus,
        data,
        cards: SUPPLIER_STAT_CARDS,
        field: "verification_status",
    });
    const statsLoading = useAdminStatsLoading(isFetching, countStatus);

    const handleFilterChange = (value) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    return (
        <AdminInitialLoadGate
            isFetching={isFetching}
            loadError={loadError}
            onRetry={() => fetchData({ page: currentPage, initial: true })}
            loadingMessage="Đang tải danh sách nhà cung cấp..."
        >
            <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
                <AdminFilterStatsCards
                    counts={supplierStats}
                    cards={SUPPLIER_STAT_CARDS}
                    activeFilter={statusFilter}
                    onFilterChange={handleFilterChange}
                    loading={statsLoading}
                />

                <Toolbar
                    search={search}
                    onSearch={setSearch}
                    searchPlaceholder="Tìm kiếm nhà cung cấp..."
                    filter={
                        <Filter
                            value={statusFilter}
                            onChange={handleFilterChange}
                        />
                    }
                />

                {error ? (
                    <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {loading && !isFetching ? (
                    <div className="flex justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
                    </div>
                ) : data.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        <SupplierTable data={data} onView={handleViewSupplier} />
                        <AdminListPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            pageRange={pageRange}
                            onPageChange={handlePageChange}
                            noun="nhà cung cấp"
                        />
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
                        <p className="text-sm font-medium text-neutral-700">
                            Không tìm thấy nhà cung cấp phù hợp
                        </p>
                    </div>
                )}

                <SupplierViewModal
                    isOpen={viewRow !== null}
                    onClose={() => setViewRow(null)}
                    supplier={viewRow}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    loading={actionLoading}
                />
            </div>
        </AdminInitialLoadGate>
    );
}
