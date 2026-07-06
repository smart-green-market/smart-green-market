import {
    useCallback,
    useMemo,
    useState,
} from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminFilterStatsCards from "../../components/Admin/UI/AdminFilterStatsCards";
import AdminListPagination from "../../components/Admin/UI/AdminListPagination";
import { CERTIFICATION_STAT_CARDS } from "../../components/Admin/UI/adminFilterStatsPresets";
import Filter from "../../components/Admin/Certification/CertificationFilter";
import CerificationTable from "../../components/Admin/Certification/CertificationTable";
import CertificationViewModal from "../../components/Admin/Certification/CertificationViewModal";

import {
    certificationService,
    handleApiError,
} from "../../services/api/certificationService";
import { useAdminPaginatedList } from "../../hooks/useAdminPaginatedList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
    buildCountsFromCards,
    buildCountsFromStatusMap,
} from "../../utils/adminFilterStatsUtils";

const formatCertificationRow = (item) => ({
    id: item.id,
    code: item.certificate_code,
    name: item.name,
    issuedBy: item.issued_by,
    issueDate: item.issue_date,
    expiryDate: item.expiry_date,
    description: item.description,
    images: item.images || [],
    status: item.status,
    verifiedAt: item.verified_at,
    rejectionReason: item.rejection_reason,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    supplier: {
        id: item.supplier?.id,
        company_name: item.supplier?.company_name,
        tax_code: item.supplier?.tax_code,
        phone: item.supplier?.phone,
        address: item.supplier?.address,
        account_username: item.supplier?.account_username,
        account_full_name: item.supplier?.account_full_name,
    },
});

export default function CertificationPage() {

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
        fetchList: (params) => certificationService.getList(params),
        mapRows: (rows) => rows.map(formatCertificationRow),
        buildQuery: () => ({
            search: debouncedSearch || undefined,
            status: statusFilter || undefined,
        }),
        queryDeps: [debouncedSearch, statusFilter],
        onFetchError: (err) =>
            handleApiError(err, "Không thể tải danh sách chứng chỉ"),
    });

    const certificationStats = useMemo(
        () => {
            if (countStatus && Object.keys(countStatus).length > 0) {
                return buildCountsFromStatusMap(
                    countStatus,
                    CERTIFICATION_STAT_CARDS,
                );
            }
            return buildCountsFromCards(data, CERTIFICATION_STAT_CARDS, {
                field: "status",
            });
        },
        [countStatus, data],
    );

    // ── APPROVE ────────────────────────────────────────
    const handleApprove =
        async (certification) => {

            try {
                setActionLoading(true);

                await certificationService.verify(
                    certification.id,
                    {
                        status: "approved",
                        rejection_reason: "",
                    }
                );

                setViewRow(null);

                await refresh();

            } catch (error) {
                const msg = handleApiError(
                    error,
                    "Không thể duyệt chứng chỉ"
                );
                setError(msg);
                throw new Error(msg);

            } finally {
                setActionLoading(false);
            }
        };

    // ── REJECT ─────────────────────────────────────────
    const handleReject =
        async (certification, rejectionReason) => {

            try {
                setActionLoading(true);

                await certificationService.verify(
                    certification.id,
                    {
                        status: "rejected",
                        rejection_reason: rejectionReason,
                    }
                );

                setViewRow(null);
                await refresh();

            } catch (error) {
                const msg = handleApiError(
                    error,
                    "Không thể từ chối chứng chỉ"
                );
                setError(msg);
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
            loadingMessage="Đang tải danh sách chứng chỉ..."
        >
        <div className="flex flex-col gap-6 px-8 pt-6 pb-10">

            <AdminFilterStatsCards
                counts={certificationStats}
                cards={CERTIFICATION_STAT_CARDS}
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
                searchPlaceholder="Tìm kiếm chứng chỉ..."
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
                    <CerificationTable
                        data={data}
                        onView={(row) => setViewRow(row)}
                    />
                    <AdminListPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        pageRange={pageRange}
                        onPageChange={handlePageChange}
                        noun="chứng chỉ"
                    />
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
                    <p className="text-sm font-medium text-neutral-700">
                        Không tìm thấy chứng chỉ phù hợp
                    </p>
                </div>
            )}
            {/* VIEW MODAL */}
            <CertificationViewModal
                isOpen={
                    viewRow !== null
                }
                onClose={() =>
                    setViewRow(null)
                }
                certification={viewRow}
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
