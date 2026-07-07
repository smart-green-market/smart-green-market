import { useCallback, useState } from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminFilterStatsCards from "../../components/Admin/UI/AdminFilterStatsCards";
import AdminListPagination from "../../components/Admin/UI/AdminListPagination";
import { DEALER_STAT_CARDS } from "../../components/Admin/UI/adminFilterStatsPresets";
import DealerFilter from "../../components/Admin/Dealer/DealerFilter";
import DealerTable from "../../components/Admin/Dealer/DealerTable";
import DealerViewModal from "../../components/Admin/Dealer/DealerViewModal";
import { getDealerApprovalDocumentError } from "../../components/Admin/Dealer/dealerDocumentHelpers";
import { appToast } from "../../components/common/toast";
import { dealerService, handleApiError } from "../../services/api/dealerService";
import { useAdminPaginatedList } from "../../hooks/useAdminPaginatedList";
import {
    useAdminFilterStats,
    useAdminStatsLoading,
} from "../../hooks/useAdminFilterStats";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

function formatDealerListItem(dealer) {
    return {
        id: dealer.id,
        store_name: dealer.store_name,
        store_address: dealer.store_address,
        description: dealer.description,
        status: dealer.status,
        account_status: dealer.account?.status,
        owner_name: dealer.account?.full_name,
        phone: dealer.account?.phone,
        email: dealer.account?.email,
        created_at: dealer.created_at,
        updated_at: dealer.updated_at,
    };
}

function formatDealerDetail(detail) {
    return {
        id: detail.id,
        store_name: detail.store_name,
        store_address: detail.store_address,
        description: detail.description,
        status: detail.status,
        rejection_reason: detail.rejection_reason,
        verified_by: detail.verified_by_username || detail.verified_by,
        verified_at: detail.verified_at,
        created_at: detail.created_at,
        updated_at: detail.updated_at,
        account: detail.account || {},
        documents: detail.documents || [],
        products: detail.products || [],
    };
}

export default function DealerPage() {
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
        fetchList: (params) => dealerService.getList(params),
        mapRows: (rows) => rows.map(formatDealerListItem),
        buildQuery: () => ({
            search: debouncedSearch || undefined,
            status: statusFilter || undefined,
        }),
        queryDeps: [debouncedSearch, statusFilter],
        onFetchError: (err) =>
            handleApiError(err, "Không thể tải danh sách đại lý"),
    });

    const handleViewDealer = useCallback(async (row) => {
        try {
            setActionLoading(true);
            setError("");

            const detail = await dealerService.getById(row.id);
            setViewRow(formatDealerDetail(detail));
        } catch (err) {
            setError(handleApiError(err, "Không thể tải chi tiết đại lý"));
        } finally {
            setActionLoading(false);
        }
    }, []);

    const dealerStats = useAdminFilterStats({
        countStatus,
        data,
        cards: DEALER_STAT_CARDS,
    });
    const statsLoading = useAdminStatsLoading(isFetching, countStatus);

    const handleApprove = async (dealer) => {
        try {
            setActionLoading(true);

            const detail = await dealerService.getById(dealer.id);
            const docError = getDealerApprovalDocumentError(detail.documents);

            if (docError) {
                throw new Error(docError);
            }

            await dealerService.verify(dealer.id, { status: "active" });
            setViewRow(null);
            await refresh();
        } catch (err) {
            const msg = handleApiError(err, "Không thể duyệt đại lý");
            if (msg.includes("giấy tờ")) {
                appToast.warning(msg);
            } else {
                appToast.danger(msg);
            }
            console.error(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (dealer, rejectionReason) => {
        try {
            setActionLoading(true);
            await dealerService.verify(dealer.id, {
                status: "rejected",
                rejection_reason: rejectionReason,
            });
            setViewRow(null);
            await refresh();
        } catch (err) {
            const msg = handleApiError(err, "Không thể từ chối đại lý");
            console.error(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLock = async (dealer) => {
        try {
            setActionLoading(true);
            await dealerService.statusUpdate(dealer.id, {
                status: "inactive",
                reason: "Tạm khóa bởi admin",
            });
            setViewRow(null);
            await refresh();
        } catch (err) {
            const msg = handleApiError(err, "Không thể khóa đại lý");
            console.error(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnlock = async (dealer) => {
        try {
            setActionLoading(true);
            await dealerService.statusUpdate(dealer.id, {
                status: "active",
                reason: "Mở khóa bởi admin",
            });
            setViewRow(null);
            await refresh();
        } catch (err) {
            const msg = handleApiError(err, "Không thể mở khóa đại lý");
            console.error(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleFilterChange = useCallback(
        (value) => {
            setStatusFilter(value);
            setCurrentPage(1);
        },
        [setCurrentPage],
    );

    return (
        <AdminInitialLoadGate
            isFetching={isFetching}
            loadError={loadError}
            onRetry={() => fetchData({ page: currentPage, initial: true })}
            loadingMessage="Đang tải danh sách đại lý..."
        >
            <div className="flex flex-col gap-6 px-8 pb-10 pt-6">
                <AdminFilterStatsCards
                    counts={dealerStats}
                    cards={DEALER_STAT_CARDS}
                    activeFilter={statusFilter}
                    onFilterChange={handleFilterChange}
                    loading={statsLoading}
                />

                <Toolbar
                    search={search}
                    onSearch={setSearch}
                    searchPlaceholder="Tìm kiếm đại lý..."
                    filter={
                        <DealerFilter
                            value={statusFilter}
                            onChange={handleFilterChange}
                        />
                    }
                />

                {error || listError ? (
                    <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                        {error || listError}
                    </div>
                ) : null}

                {loading && !isFetching ? (
                    <div className="flex justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
                    </div>
                ) : data.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        <DealerTable data={data} onView={handleViewDealer} />
                        <AdminListPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            pageRange={pageRange}
                            onPageChange={handlePageChange}
                            noun="đại lý"
                        />
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
                        <p className="text-sm font-medium text-neutral-700">
                            Không tìm thấy đại lý phù hợp
                        </p>
                    </div>
                )}

                <DealerViewModal
                    isOpen={viewRow !== null}
                    onClose={() => setViewRow(null)}
                    dealer={viewRow}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onLock={handleLock}
                    onUnlock={handleUnlock}
                    loading={actionLoading}
                />
            </div>
        </AdminInitialLoadGate>
    );
}
