import { useCallback, useEffect, useState } from "react";
import SearchBar from "../../components/Admin/UI/SearchBar";
import Filter from "../../components/Admin/User/UserFilter";
import UserTable from "../../components/Admin/User/UserTable";
import UserViewModal from "../../components/Admin/User/UserViewModal";
import { userService, handleApiError} from "../../services/api/userService";

export default function UserPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");
    const [viewRow, setViewRow] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const fetchUser = useCallback(
        async () => {
            try {
                setLoading(true);

                const response =
                    await userService.getAll();
                const formattedData =
                    response.map(
                        (user) => ({
                            id: user.id,

                            name:
                                user.username,

                            verify:
                                user.verification_status,

                            created_at:
                                user.created_at,

                            updated_at:
                                user.updated_at,
                        })
                    );

                setData(formattedData);
            } catch (error) {
                const message =
                    handleApiError(
                        error,
                        "Không thể tải danh sách người dùng"
                    );

                setError(message);
            } finally {
                setLoading(false);
            }
        },
        []
    );
    const handleViewUser =
        useCallback(async (row) => {
            try {
                setLoading(true);

                const detail =
                    await userService.getById(
                        row.id
                    );
                const formattedDetail = {
                    id: detail.id,

                    name:
                        detail.username,

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
                    "Không thể tải chi tiết người dùng"
                );
            } finally {
                setLoading(false);
            }
        }, []);
    useEffect(() => { fetchUser(); }, [fetchUser]);

    // ── APPROVE ──────────────────────────────────────────
    const handleApprove = async (user) => {
        try {
            setActionLoading(true);

            await userService.verify(
                user.id,
                {
                    status: "active",
                }
            );

            setViewRow(null);
            await fetchUser();
        } catch (error) {
            console.error(
                handleApiError(
                    error,
                    "Không thể duyệt người dùng"
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ── REJECT ───────────────────────────────────────────
    const handleReject = async (user, rejectionReason) => {
        try {
            setActionLoading(true);

            await userService.verify(user.id, {
                status: "rejected",
                rejection_reason: rejectionReason,
            });

            setViewRow(null);
            await fetchUser();
        } catch (error) {
            const msg = handleApiError(
                error,
                "Không thể từ chối người dùng"
            );
            console.error(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    // ── LOCK ─────────────────────────────────────────────
    const handleLock = async (user) => {
        try {
            setActionLoading(true);

            await userService.status(
                user.id,
                {
                    status: "inactive",
                    reason: "Tạm khóa bởi admin",
                }
            );
            setViewRow(null);
            await fetchUser();
        } catch (error) {
            console.error(
                handleApiError(
                    error,
                    "Không thể khóa người dùng"
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ── ACTIVE ───────────────────────────────────────────
    const handleUnlock = async (user) => {
        try {
            setActionLoading(true);

            await userService.status(
                user.id,
                {
                    status: "active",
                    reason: "Mở khóa",
                }
            );
            setViewRow(null);
            await fetchUser();
        } catch (error) {
            console.error(
                handleApiError(
                    error,
                    "Không thể mở khóa người dùng"
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ── BAN ──────────────────────────────────────────────
    const handleBan = async (user) => {
        try {
            setActionLoading(true);

            await userService.status(
                user.id,
                {
                    status: "banned",
                    reason: "Vi phạm chính sách",
                }
            );

            setViewRow(null);
            await fetchUser();
        } catch (error) {
            console.error(
                handleApiError(
                    error,
                    "Không thể vô hiệu hóa người dùng"
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
                placeholder="Tìm kiếm người dùng..."
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
            <UserTable
                data={data}
                loading={loading}
                search={search}
                statusFilter={statusFilter}
                onView={handleViewUser}
            />

            {/* VIEW MODAL */}
            <UserViewModal
                isOpen={viewRow !== null}
                onClose={() =>setViewRow(null)}
                user={viewRow}
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