import { useCallback, useEffect, useState } from "react";
import SearchBar from "../../components/Admin/UI/SearchBar";
import Filter from "../../components/Admin/Dealer/DealerFilter";
import DealerTable from "../../components/Admin/Dealer/DealerTable";
import DealerViewModal from "../../components/Admin/Dealer/DealerViewModal";
import { dealerService, handleApiError} from "../../services/api/dealerService";

export default function DealerPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");
    const [viewRow, setViewRow] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const fetchDealer = useCallback(
        async () => {
            try {
                setLoading(true);

                const response =
                    await dealerService.getAll();
                const formattedData =
                    response.map(
                        (dealer) => ({
                            id: dealer.id,

                            name:
                                dealer.dealer_name,

                            address:
                                dealer.address,

                            phone:
                                dealer.phone,

                            verify:
                                dealer.verification_status,

                            created_at:
                                dealer.created_at,

                            updated_at:
                                dealer.updated_at,
                        })
                    );

                setData(formattedData);
            } catch (error) {
                const message =
                    handleApiError(
                        error,
                        "Không thể tải danh sách đại lý"
                    );

                setError(message);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const handleViewDealer =
        useCallback(async (row) => {
            try {
                setLoading(true);

                const detail =
                    await dealerService.getById(
                        row.id
                    );
                const formattedDetail = {
                    id: detail.id,

                            name:
                                detail.dealer_name,

                            address:
                                detail.address,

                            phone:
                                detail.phone,

                            verify:
                                detail.verification_status,

                            created_at:
                                detail.created_at,

                            updated_at:
                                detail.updated_at,
                };

                setViewRow(
                    formattedDetail
                );
            } catch (error) {
                handleApiError(
                    error,
                    "Không thể tải chi tiết đại lý"
                );
            } finally {
                setLoading(false);
            }
        }, []);
    useEffect(() => { fetchDealer(); }, [fetchDealer]);

    // ── APPROVE ──────────────────────────────────────────
    const handleApprove = async (dealer) => {
        try {
            setActionLoading(true);

            await dealerService.verify(
                dealer.id,
                {
                    status: "active",
                }
            );

            setViewRow(null);
            await fetchDealer();
        } catch (error) {
            console.error(
                handleApiError(
                    error,
                    "Không thể duyệt đại lý"
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ── REJECT ───────────────────────────────────────────
    const handleReject = async (dealer, rejectionReason) => {
        try {
            setActionLoading(true);

            await dealerService.verify(dealer.id, {
                status: "rejected",
                rejection_reason: rejectionReason,
            });

            setViewRow(null);
            await fetchDealer();
        } catch (error) {
            const msg = handleApiError(
                error,
                "Không thể từ chối đại lý"
            );
            console.error(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    // ── LOCK ─────────────────────────────────────────────
    const handleLock = async (dealer) => {
        try {
            setActionLoading(true);

            await dealerService.status(
                dealer.id,
                {
                    status: "inactive",
                    reason: "Tạm khóa bởi admin",
                }
            );
            setViewRow(null);
            await fetchDealer();
        } catch (error) {
            console.error(
                handleApiError(
                    error,
                    "Không thể khóa đại lý"
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ── ACTIVE ───────────────────────────────────────────
    const handleUnlock = async (dealer) => {
        try {
            setActionLoading(true);

            await dealerService.status(
                dealer.id,
                {
                    status: "active",
                    reason: "Mở khóa",
                }
            );
            setViewRow(null);
            await fetchDealer();
        } catch (error) {
            console.error(
                handleApiError(
                    error,
                    "Không thể mở khóa đại lý"
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ── BAN ──────────────────────────────────────────────
    const handleBan = async (dealer) => {
        try {
            setActionLoading(true);

            await dealerService.status(
                dealer.id,
                {
                    status: "banned",
                    reason: "Vi phạm chính sách",
                }
            );

            setViewRow(null);
            await fetchDealer();
        } catch (error) {
            console.error(
                handleApiError(
                    error,
                    "Không thể vô hiệu hóa đại lý"
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 px-8 pt-6 pb-10">

            {/* SEARCH */}
            <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Tìm kiếm đại lý..."
            />

            {/* FILTER */}
            <div className="flex items-center gap-3">

                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                    Lọc:
                </span>

                <Filter
                    value={statusFilter}
                    onChange={
                        setStatusFilter
                    }
                />
            </div>

            {/* ERROR */}
            {error && (
                <div className="px-4 py-3 rounded-xl bg-red-100 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* TABLE */}
            <DealerTable
                data={data}
                loading={loading}
                search={search}
                statusFilter={statusFilter}
                onView={handleViewDealer}
            />

            {/* VIEW MODAL */}
            <DealerViewModal
                isOpen={viewRow !== null}
                onClose={() =>setViewRow(null)}
                dealer={viewRow}
                onApprove={handleApprove}
                onReject={handleReject}
                onLock={handleLock}
                onUnlock={handleUnlock}
                onBan={handleBan}
                loading={actionLoading}
            />
        </div>
    );
}