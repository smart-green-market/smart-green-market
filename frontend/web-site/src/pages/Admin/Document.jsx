import { useCallback, useEffect, useState } from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import Filter from "../../components/Admin/Document/DocumentFilter";
import DocumentTable from "../../components/Admin/Document/DocumentTable";
import DocumentViewModal from "../../components/Admin/Document/DocumentViewModal";

import {
    accountDocumentService,
    handleApiError,
} from "../../services/api/accountDocumentService";

export default function DocumentPage() {
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
    ] = useState("pending");

    const [viewRow, setViewRow] =
        useState(null);

    // ── FETCH ALL DOCUMENTS ─────────────────────────────
    const fetchDocuments = useCallback(
        async ({ initial = false } = {}) => {
            try {
                if (initial) {
                    setIsFetching(true);
                    setLoadError("");
                } else {
                    setLoading(true);
                }

                const response =
                    await accountDocumentService.getAll();

                // normalize data cho table
                const formattedData =
                    response.map(
                        (document) => ({
                            id: document.id,
                            
                            image:
                                document.file_url,

                            document_type:
                                document.document_type,

                            status:
                                document.status,

                            verified_at:
                                document.verified_at,

                            createdAt:
                                document.created_at,

                            supplier: {
                                id: document.account?.id,
                                company_name:
                                    document.account?.profile_name
                                    || document.account?.full_name
                                    || document.account?.username,
                                phone:
                                    document.account?.phone,
                            },

                            verified_by:
                                document.verified_by,
                        })
                    );

                setData(formattedData);
            } catch (error) {
                const message =
                    handleApiError(
                        error,
                        "Không thể tải danh sách giấy tờ"
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

    // ── FETCH DETAIL DOCUMENT ──────────────────────────
    const handleViewDocument =
        useCallback(async (row) => {
            try {
                setLoading(true);

                const detail =
                    await accountDocumentService.getById(
                        row.id
                    );

                // normalize data cho modal
                const formattedDetail = {
                    id: detail.id,

                    file_url:
                        detail.file_url,

                    image:
                        detail.file_url,

                    document_type:
                        detail.document_type,

                    status:
                        detail.status,

                    verified_at:
                        detail.verified_at,

                    created_at:
                        detail.created_at,

                    supplier: {
                        id: detail.account?.id,
                        company_name:
                            detail.account?.profile_name
                            || detail.account?.full_name
                            || detail.account?.username,
                        phone: detail.account?.phone,
                    },

                    verified_by:
                        detail.verified_by,
                };

                setViewRow(
                    formattedDetail
                );
            } catch (error) {
                handleApiError(
                    error,
                    "Không thể tải chi tiết giấy tờ"
                );
            } finally {
                setLoading(false);
            }
        }, []);

    // ── INITIAL FETCH ──────────────────────────────────
    useEffect(() => {
        fetchDocuments({ initial: true });
    }, [fetchDocuments]);

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

            await fetchDocuments();
        } catch (error) {
            const msg = handleApiError(
                error,
                "Không thể duyệt giấy tờ",
            );
            console.error(msg);
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

            await fetchDocuments();
        } catch (error) {
            const msg = handleApiError(
                error,
                "Không thể từ chối giấy tờ"
            );
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
            onRetry={() => fetchDocuments({ initial: true })}
            loadingMessage="Đang tải danh sách giấy tờ..."
        >
        <div className="flex flex-col gap-6 px-8 pt-6 pb-10">

            {/* TOOLBAR */}
            <Toolbar
                search={search}
                onSearch={setSearch}
                searchPlaceholder="Tìm kiếm giấy tờ..."
            />

            {/* FILTER */}
            <div className="flex items-center gap-3">

                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide font-['Geist',sans-serif]">
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
            <DocumentTable
                data={data}
                loading={loading}
                search={search}
                statusFilter={
                    statusFilter
                }
                onView={
                    handleViewDocument
                }
            />

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