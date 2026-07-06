import { useCallback, useMemo, useState } from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminFilterStatsCards from "../../components/Admin/UI/AdminFilterStatsCards";
import AdminListPagination from "../../components/Admin/UI/AdminListPagination";
import { VOUCHER_STAT_CARDS } from "../../components/Admin/UI/adminFilterStatsPresets";
import Filter from "../../components/Admin/Voucher/VoucherFilter";
import VoucherTable from "../../components/Admin/Voucher/VoucherTable";
import VoucherViewModal from "../../components/Admin/Voucher/VoucherViewModal";

import {
    adminVoucherService,
    handleApiError,
} from "../../services/api/Admin/adminVoucherService";
import { useAdminPaginatedList } from "../../hooks/useAdminPaginatedList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
    buildCountsFromCards,
    buildCountsFromStatusMap,
} from "../../utils/adminFilterStatsUtils";
import { appToast } from "../../components/common/toast";

export default function VoucherPage() {
    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");
    const debouncedSearch =
        useDebouncedValue(search, 350);

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("");

    const [viewRow, setViewRow] =
        useState(null);

    const [modalError, setModalError] =
        useState("");

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
        fetchList: (params) => adminVoucherService.getList(params),
        buildQuery: () => ({
            search: debouncedSearch || undefined,
            status: statusFilter || undefined,
        }),
        queryDeps: [debouncedSearch, statusFilter],
        onFetchError: (err) =>
            handleApiError(err, "Không thể tải danh sách voucher"),
    });

    // ── FETCH DETAIL VOUCHER ──────────────────────────
    const handleViewVoucher =
        useCallback(async (row) => {
            try {
                setModalError("");

                const detail =
                    await adminVoucherService.getById(
                        row.id
                    );

                setViewRow(detail);
            } catch (error) {
                const message = handleApiError(
                    error,
                    "Không thể tải chi tiết voucher"
                );
                setError(message);
            }
        }, []);

    const voucherStats = useMemo(
        () => {
            if (countStatus && Object.keys(countStatus).length > 0) {
                return buildCountsFromStatusMap(
                    countStatus,
                    VOUCHER_STAT_CARDS,
                );
            }
            return buildCountsFromCards(data, VOUCHER_STAT_CARDS, {
                field: "status",
            });
        },
        [countStatus, data],
    );

    // ── APPROVE (KÍCH HOẠT) ────────────────────────────────────────
    const handleApprove = async (voucher) => {
        try {
            setActionLoading(true);
            setModalError("");

            await adminVoucherService.verify(voucher.id, {
                status: "active",
            });

            setViewRow(null);
            appToast.success(`Đã duyệt voucher "${voucher.code}".`);
            await refresh();
        } catch (error) {
            const msg = handleApiError(
                error,
                "Không thể duyệt voucher",
            );
            setModalError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    // ── REJECT (TỪ CHỐI / HỦY) ─────────────────────────────────────────
    const handleReject = async (voucher, rejectionReason) => {
        try {
            setActionLoading(true);
            setModalError("");

            await adminVoucherService.verify(voucher.id, {
                status: "rejected",
                rejection_reason: rejectionReason,
                reject_reason: rejectionReason,
            });

            setViewRow(null);
            appToast.success(`Đã từ chối voucher "${voucher.code}".`);
            await refresh();
        } catch (error) {
            const msg = handleApiError(
                error,
                "Không thể từ chối voucher"
            );
            setModalError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (voucher) => {
        try {
            setActionLoading(true);
            setModalError("");

            await adminVoucherService.delete(voucher.id);

            setViewRow(null);
            appToast.success(`Đã xóa voucher "${voucher.code}".`);
            await refresh();
        } catch (error) {
            const msg = handleApiError(
                error,
                "Không thể xóa voucher"
            );
            setModalError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminInitialLoadGate
            isFetching={isFetching}
            loadError={loadError}
            onRetry={() =>
                fetchData({
                    page: currentPage,
                    initial: true,
                })
            }
            loadingMessage="Đang tải danh sách voucher..."
        >
        <div className="flex flex-col gap-6 px-8 pt-6 pb-10">

            <AdminFilterStatsCards
                counts={voucherStats}
                cards={VOUCHER_STAT_CARDS}
                activeFilter={statusFilter}
                onFilterChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                }}
                loading={isFetching || loading}
            />

            {/* TOOLBAR */}
            <Toolbar
                search={search}
                onSearch={setSearch}
                searchPlaceholder="Tìm kiếm voucher..."
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
            {error && (
                <div className="px-4 py-3 rounded-xl bg-red-100 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {loading && !isFetching ? (
                <div className="flex justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
                </div>
            ) : data.length > 0 ? (
                <div className="flex flex-col gap-4">
                    <VoucherTable
                        data={data}
                        onView={handleViewVoucher}
                    />
                    <AdminListPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        pageRange={pageRange}
                        onPageChange={handlePageChange}
                        noun="voucher"
                    />
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
                    <p className="text-sm font-medium text-neutral-700">
                        Không tìm thấy voucher phù hợp
                    </p>
                </div>
            )}

            {/* VIEW MODAL */}
            <VoucherViewModal
                isOpen={viewRow !== null}
                onClose={() => {
                    setViewRow(null);
                    setModalError("");
                }}
                voucher={viewRow}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
                loading={actionLoading}
                error={modalError}
                closeOnAction={false}
            />
        </div>
        </AdminInitialLoadGate>
    );
}
