import {
    useCallback,
    useEffect,
    useState,
} from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import Filter from "../../components/Admin/Certification/CertificationFilter";
import CerificationTable from "../../components/Admin/Certification/CertificationTable";
import CertificationViewModal from "../../components/Admin/Certification/CertificationViewModal";

import {
    certificationService,
    handleApiError,
} from "../../services/api/certificationService";

export default function CertificationPage() {

    // ── STATES ─────────────────────────────────────────
    const [data, setData] =
        useState([]);

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

    // ── FETCH CERTIFICATIONS ───────────────────────────
    const fetchCertifications =
        useCallback(async () => {
            try {
                setLoading(true);

                setError("");

                const response =
                    await certificationService.getAll();

                const formattedData =
                    response.map(
                        (item) => ({
                            id: item.id,

                            code:
                                item.certificate_code,

                            name:
                                item.name,

                            issuedBy:
                                item.issued_by,

                            issueDate:
                                item.issue_date,

                            expiryDate:
                                item.expiry_date,

                            description:
                                item.description,

                            fileUrl:
                                item.file_url,

                            supplier:
                                item.supplier,

                            status:
                                item.status,

                            verifiedAt:
                                item.verified_at,

                            rejectionReason:
                                item.rejection_reason,

                            createdAt:
                                item.created_at,

                            updatedAt:
                                item.updated_at,
                        })
                    );

                setData(formattedData);

            } catch (error) {

                const message =
                    handleApiError(
                        error,
                        "Không thể tải danh sách chứng chỉ"
                    );

                setError(message);

            } finally {
                setLoading(false);
            }
        }, []);

    // ── INITIAL FETCH ──────────────────────────────────
    useEffect(() => {
        fetchCertifications();
    }, [fetchCertifications]);

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

                await fetchCertifications();

            } catch (error) {

                console.error(
                    handleApiError(
                        error,
                        "Không thể duyệt chứng chỉ"
                    )
                );

            } finally {
                setActionLoading(false);
            }
        };

    // ── REJECT ─────────────────────────────────────────
    const handleReject =
        async (certification) => {

            try {
                setActionLoading(true);

                await certificationService.verify(
                    certification.id,
                    {
                        status: "rejected",
                        rejection_reason:
                            "Rejected by admin",
                    }
                );

                setViewRow(null);

                await fetchCertifications();

            } catch (error) {

                console.error(
                    handleApiError(
                        error,
                        "Không thể từ chối chứng chỉ"
                    )
                );

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
                searchPlaceholder="Tìm kiếm chứng chỉ..."
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
            <CerificationTable
                data={data}
                loading={loading}
                search={search}
                statusFilter={statusFilter}
                onView={(row) =>
                    setViewRow(row)
                }
            />
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
    );
}
