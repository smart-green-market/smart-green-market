import { useCallback, useEffect, useState } from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import Filter from "../../components/Admin/Document/DocumentFilter";
import DocumentTable from "../../components/Admin/Document/DocumentTable";
import DocumentViewModal from "../../components/Admin/Document/DocumentViewModal";

import {
    supplierDocumentService,
    handleApiError,
} from "../../services/api/supplierDocumentService";

export default function DocumentPage() {
    // ── STATES ─────────────────────────────────────────────
    const [data, setData] = useState([]);

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
        async () => {
            try {
                setLoading(true);

                const response =
                    await supplierDocumentService.getAll();

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
                                id: document.supplier?.id,
                                company_name:
                                    document.supplier?.company_name,
                                tax_code:
                                    document.supplier?.tax_code,
                                phone:
                                    document.supplier?.phone,
                                address:
                                    document.supplier?.address,
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

                setError(message);
            } finally {
                setLoading(false);
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
                    await supplierDocumentService.getById(
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

                    supplier:
                        detail.supplier,

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
        fetchDocuments();
    }, [fetchDocuments]);

    // ── APPROVE ────────────────────────────────────────
    const handleApprove = async (
        document
    ) => {
        try {
            setActionLoading(true);

            await supplierDocumentService.verify(
                document.id,
                "approved"
            );

            setViewRow(null);

            await fetchDocuments();
        } catch (error) {
            console.error(
                handleApiError(
                    error,
                    "Không thể duyệt giấy tờ"
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ── REJECT ─────────────────────────────────────────
    const handleReject = async (document, rejectionReason) => {
        try {
            setActionLoading(true);

            await supplierDocumentService.verify(document.id, {
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
    );
}