import { useCallback, useEffect, useMemo, useState } from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminFilterStatsCards from "../../components/Admin/UI/AdminFilterStatsCards";
import { VOUCHER_STAT_CARDS } from "../../components/Admin/UI/adminFilterStatsPresets";
import Filter from "../../components/Admin/Voucher/VoucherFilter";
import VoucherTable from "../../components/Admin/Voucher/VoucherTable";
import VoucherViewModal from "../../components/Admin/Voucher/VoucherViewModal";

import {
    adminVoucherService,
    handleApiError,
} from "../../services/api/Admin/adminVoucherService";
import { buildCountsFromCards } from "../../utils/adminFilterStatsUtils";
import { appToast } from "../../components/common/toast";

export default function VoucherPage() {
    // ── STATES ─────────────────────────────────────────────
    const [data, setData] = useState([]);

    const [isFetching, setIsFetching] =
        useState(true);

    const [loadError, setLoadError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("");

    const [viewRow, setViewRow] =
        useState(null);

    const [modalError, setModalError] =
        useState("");

    // ── FETCH ALL VOUCHERS ─────────────────────────────
    const fetchVouchers = useCallback(
        async ({ initial = false } = {}) => {
            try {
                if (initial) {
                    setIsFetching(true);
                    setLoadError("");
                } else {
                    setLoading(true);
                }

                const response =
                    await adminVoucherService.getAll();

                setData(response);
            } catch (error) {
                const message =
                    handleApiError(
                        error,
                        "Không thể tải danh sách voucher"
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
        },
        []
    );

    // ── FETCH DETAIL VOUCHER ──────────────────────────
    const handleViewVoucher =
        useCallback(async (row) => {
            try {
                setLoading(true);
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
            } finally {
                setLoading(false);
            }
        }, []);

    // ── INITIAL FETCH ──────────────────────────────────
    useEffect(() => {
        fetchVouchers({ initial: true });
    }, [fetchVouchers]);

    const voucherStats = useMemo(
        () => buildCountsFromCards(data, VOUCHER_STAT_CARDS, { field: "status" }),
        [data],
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
            await fetchVouchers();
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
            await fetchVouchers();
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
            await fetchVouchers();
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
            onRetry={() => fetchVouchers({ initial: true })}
            loadingMessage="Đang tải danh sách voucher..."
        >
        <div className="flex flex-col gap-6 px-8 pt-6 pb-10">

            <AdminFilterStatsCards
                counts={voucherStats}
                cards={VOUCHER_STAT_CARDS}
                activeFilter={statusFilter}
                onFilterChange={setStatusFilter}
                loading={isFetching}
            />

            {/* TOOLBAR */}
            <Toolbar
                search={search}
                onSearch={setSearch}
                searchPlaceholder="Tìm kiếm voucher..."
                filter={
                    <Filter
                        value={statusFilter}
                        onChange={setStatusFilter}
                    />
                }
            />

            {/* ERROR */}
            {error && (
                <div className="px-4 py-3 rounded-xl bg-red-100 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* TABLE */}
            <VoucherTable
                data={data}
                loading={loading}
                search={search}
                statusFilter={statusFilter}
                onView={handleViewVoucher}
            />

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
