import { useCallback, useState } from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminFilterStatsCards from "../../components/Admin/UI/AdminFilterStatsCards";
import AdminListPagination from "../../components/Admin/UI/AdminListPagination";
import { DOCUMENT_STAT_CARDS } from "../../components/Admin/UI/adminFilterStatsPresets";
import Filter from "../../components/Admin/Document/DocumentFilter";
import DocumentTable from "../../components/Admin/Document/DocumentTable";
import DocumentViewModal from "../../components/Admin/Document/DocumentViewModal";

import {
    accountDocumentService,
    handleApiError,
} from "../../services/api/accountDocumentService";
import { useAdminPaginatedList } from "../../hooks/useAdminPaginatedList";
import {
    useAdminFilterStats,
    useAdminStatsLoading,
} from "../../hooks/useAdminFilterStats";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const STATUS_FILTERS = ["pending", "approved", "rejected"];
const DOCUMENT_TYPE_FILTERS = [
    "business_license",
    "id_card",
    "tax_certificate",
];

const formatDocumentRow = (document) => ({
    id: document.id,
    image: document.file_url,
    file_url: document.file_url,
    document_type: document.document_type,
    status: document.status,
    verified_at: document.verified_at,
    createdAt: document.created_at,
    created_at: document.created_at,
    supplier: {
        id: document.account?.id,
        company_name:
            document.account?.profile_name
            || document.account?.full_name
            || document.account?.username,
        phone: document.account?.phone,
    },
    verified_by: document.verified_by,
});

export default function DocumentPage() {
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
        fetchList: (params) => accountDocumentService.getList(params),
        mapRows: (rows) => rows.map(formatDocumentRow),
        buildQuery: () => {
            const query = {
                search: debouncedSearch || undefined,
            };
            if (STATUS_FILTERS.includes(statusFilter)) {
                query.status = statusFilter;
            }
            if (DOCUMENT_TYPE_FILTERS.includes(statusFilter)) {
                query.document_type = statusFilter;
            }
            return query;
        },
        queryDeps: [debouncedSearch, statusFilter],
        onFetchError: (err) =>
            handleApiError(err, "Không thể tải danh sách giấy tờ"),
    });

    // ── FETCH DETAIL DOCUMENT ──────────────────────────
    const handleViewDocument =
        useCallback(async (row) => {
            try {
                const detail =
                    await accountDocumentService.getById(
                        row.id
                    );

                // normalize data cho modal
                setViewRow(formatDocumentRow(detail));
            } catch (error) {
                const message = handleApiError(
                    error,
                    "Không thể tải chi tiết giấy tờ"
                );
                setError(message);
            }
        }, []);

    const documentStats = useAdminFilterStats({
        countStatus,
        data,
        cards: DOCUMENT_STAT_CARDS,
    });
    const statsLoading = useAdminStatsLoading(isFetching, countStatus);

    // ── APPROVE ────────────────────────────────────────
    const handleApprove = async (
        document
    ) => {
        try {
            setActionLoading(true);

            await accountDocumentService.verify(
                document.id,
                "approved"
            );

            setViewRow(null);

            await refresh();
        } catch (error) {
            const msg = handleApiError(
                error,
                "Không thể duyệt giấy tờ",
            );
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    // ── REJECT ─────────────────────────────────────────
    const handleReject = async (document, rejectionReason) => {
        try {
            setActionLoading(true);

            await accountDocumentService.verify(document.id, {
                status: "rejected",
                rejection_reason: rejectionReason,
            });

            setViewRow(null);

            await refresh();
        } catch (error) {
            const msg = handleApiError(
                error,
                "Không thể từ chối giấy tờ"
            );
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
            loadingMessage="Đang tải danh sách giấy tờ..."
        >
        <div className="flex flex-col gap-6 px-8 pt-6 pb-10">

            <AdminFilterStatsCards
                counts={documentStats}
                cards={DOCUMENT_STAT_CARDS}
                activeFilter={statusFilter}
                onFilterChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                }}
                loading={statsLoading}
            />

            {/* TOOLBAR */}
            <Toolbar
                search={search}
                onSearch={setSearch}
                searchPlaceholder="Tìm kiếm giấy tờ..."
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
                    <DocumentTable
                        data={data}
                        onView={handleViewDocument}
                    />
                    <AdminListPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        pageRange={pageRange}
                        onPageChange={handlePageChange}
                        noun="giấy tờ"
                    />
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
                    <p className="text-sm font-medium text-neutral-700">
                        Không tìm thấy giấy tờ phù hợp
                    </p>
                </div>
            )}

            {/* VIEW MODAL */}
            <DocumentViewModal
                isOpen={
                    viewRow !== null
                }
                onClose={() =>
                    setViewRow(null)
                }
                document={viewRow}
                onApprove={
                    handleApprove
                }
                onReject={
                    handleReject
                }
                loading={
                    actionLoading
                }
            />
        </div>
        </AdminInitialLoadGate>
    );
}