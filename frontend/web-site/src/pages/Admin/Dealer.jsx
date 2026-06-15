import { useCallback, useEffect, useMemo, useState } from "react";

import SearchBar from "../../components/Admin/UI/SearchBar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import DealerFilter, {
    getDealerDisplayStatus,
} from "../../components/Admin/Dealer/DealerFilter";
import DealerTable from "../../components/Admin/Dealer/DealerTable";
import DealerViewModal from "../../components/Admin/Dealer/DealerViewModal";
import { getDealerApprovalDocumentError } from "../../components/Admin/Dealer/dealerDocumentHelpers";
import { appToast } from "../../components/common/toast";
import { dealerService, handleApiError } from "../../services/api/dealerService";

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
    const [data, setData] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");
    const [viewRow, setViewRow] = useState(null);

    const fetchDealers = useCallback(async ({ initial = false } = {}) => {
        try {
            if (initial) {
                setIsFetching(true);
                setLoadError("");
            } else {
                setLoading(true);
            }
            setError("");

            const response = await dealerService.getAll();
            setData(Array.isArray(response) ? response.map(formatDealerListItem) : []);
        } catch (err) {
            const message = handleApiError(err, "Không thể tải danh sách đại lý");
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

    useEffect(() => {
        fetchDealers({ initial: true });
    }, [fetchDealers]);

    const filteredData = useMemo(() => {
        const keyword = search.toLowerCase();

        return data.filter((row) => {
            const matchKeyword =
                (row.store_name ?? "").toLowerCase().includes(keyword) ||
                (row.store_address ?? "").toLowerCase().includes(keyword) ||
                (row.owner_name ?? "").toLowerCase().includes(keyword) ||
                (row.phone ?? "").toLowerCase().includes(keyword) ||
                (row.email ?? "").toLowerCase().includes(keyword);

            const matchStatus = statusFilter
                ? getDealerDisplayStatus(row) === statusFilter
                : true;

            return matchKeyword && matchStatus;
        });
    }, [data, search, statusFilter]);

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
            await fetchDealers();
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
            await fetchDealers();
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
            await fetchDealers();
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
            await fetchDealers();
        } catch (err) {
            const msg = handleApiError(err, "Không thể mở khóa đại lý");
            console.error(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminInitialLoadGate
            isFetching={isFetching}
            loadError={loadError}
            onRetry={() => fetchDealers({ initial: true })}
            loadingMessage="Đang tải danh sách đại lý..."
        >
        <div className="flex flex-col gap-6 px-8 pb-10 pt-6">
            <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Tìm kiếm đại lý..."
            />

            <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Lọc:
                </span>
                <DealerFilter value={statusFilter} onChange={setStatusFilter} />
            </div>

            {error ? (
                <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            <DealerTable
                data={filteredData}
                loading={loading}
                onView={handleViewDealer}
            />

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
