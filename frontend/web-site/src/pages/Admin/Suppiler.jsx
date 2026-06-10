import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import SearchBar from "../../components/Admin/UI/SearchBar";

import Filter from "../../components/Admin/Suppiler/SuppilerFilter";

import SupplierTable from "../../components/Admin/Suppiler/SuppilerTable";

import SupplierViewModal from "../../components/Admin/Suppiler/SupplierViewModal";

import {
    handleApiError,
    supplierService,
} from "../../services/api/suppilerService";

export default function SupplierPage() {
    // ─────────────────────────────────────────
    // STATES
    // ─────────────────────────────────────────
    const [data, setData] = useState([]);

    const [loading, setLoading] =
        useState(false);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] =
        useState("pending");

    const [viewRow, setViewRow] =
        useState(null);

    // ─────────────────────────────────────────
    // FETCH ALL
    // ─────────────────────────────────────────
    const fetchSuppliers =
        useCallback(async () => {
            try {
                setLoading(true);

                setError("");

                const response =
                    await supplierService.getAll();

                const formatted =
                    response.map((supplier) => ({
                        id: supplier.id,

                        company_name:
                            supplier.company_name,

                        address:
                            supplier.address,

                        phone:
                            supplier.phone,

                        tax_code:
                            supplier.tax_code,

                        description:
                            supplier.description,

                        verification_status:
                            supplier.verification_status,

                        created_at:
                            supplier.created_at,

                        updated_at:
                            supplier.updated_at,
                    }));

                setData(formatted);
            } catch (error) {
                setError(
                    handleApiError(
                        error,
                        "Không thể tải danh sách nhà cung cấp"
                    )
                );
            } finally {
                setLoading(false);
            }
        }, []);

    // ─────────────────────────────────────────
    // FETCH DETAIL
    // ─────────────────────────────────────────
    const handleViewSupplier =
        useCallback(async (row) => {
            try {
                setLoading(true);

                const detail =
                    await supplierService.getById(
                        row.id
                    );

                const formattedDetail = {
                    id: detail.id,

                    company_name:
                        detail.company_name,

                    address:
                        detail.address,

                    phone:
                        detail.phone,

                    tax_code:
                        detail.tax_code,

                    description:
                        detail.description,

                    verification_status:
                        detail.verification_status,

                    created_at:
                        detail.created_at,

                    updated_at:
                        detail.updated_at,

                    verified_at: detail.verified_at,

                    // ── ACCOUNT
                    full_name:
                        detail.account
                            ?.full_name,

                    email:
                        detail.account?.email,

                    avatar:
                        detail.account?.avatar_url,
                };

                setViewRow(
                    formattedDetail
                );
            } catch (error) {
                setError(
                    handleApiError(
                        error,
                        "Không thể tải chi tiết nhà cung cấp"
                    )
                );
            } finally {
                setLoading(false);
            }
        }, []);

    // ─────────────────────────────────────────
    // INITIAL FETCH
    // ─────────────────────────────────────────
    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleApprove = useCallback(async (supplier) => {
    try {
        setActionLoading(true);
        setError(""); // Clear lỗi cũ nếu có
        
        // Gọi API duyệt supplier
        await supplierService.verify(supplier.id, { verification_status: "approved" });
        
        // Thông báo thành công và tải lại danh sách
        fetchSuppliers(); 
    } catch (error) {
        // ─────────────────────────────────────────────────────────
        // NÂNG CẤP THÔNG BÁO LỖI TẠI ĐÂY
        // ─────────────────────────────────────────────────────────
        let customMessage = "Không thể duyệt nhà cung cấp";
        
        if (error.response && error.response.status === 400) {
            // Ép thông báo ngắn gọn như bạn yêu cầu
            customMessage = "Vui lòng duyệt đủ 3 loại giấy tờ";
        } else {
            customMessage = handleApiError(error, customMessage);
        }

        // Vẫn lưu vào hệ thống chung
        setError(customMessage);
        
        // Không gọi toast.error ở đây nữa.
        // ném lỗi ra ngoài để hàm handleConfirm của Modal có thể bắt được và không đóng modal
        throw new Error(customMessage);
        
    } finally {
        setActionLoading(false);
    }
}, [fetchSuppliers]);

// ─────────────────────────────────────────
// REJECT (TỪ CHỐI NHÀ CUNG CẤP)
// ─────────────────────────────────────────
const handleReject = async (supplier, rejectionReason) => {
    console.log("Từ chối supplier ID:", supplier?.id);
    try {
        setActionLoading(true);
        setError("");

        await supplierService.verify(supplier.id, {
            verification_status: "rejected",
            rejection_reason: rejectionReason,
        });

        setViewRow(null);
        await fetchSuppliers();
    } catch (error) {
        const msg = handleApiError(error, "Không thể từ chối nhà cung cấp");
        setError(msg);
        throw new Error(msg);
    } finally {
        setActionLoading(false);
    }
};
    // ─────────────────────────────────────────
    // FILTERED DATA
    // ─────────────────────────────────────────
    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const keyword =
                search.toLowerCase();

            const matchSearch =
                item.company_name
                    ?.toLowerCase()
                    .includes(keyword) ||
                item.phone
                    ?.toLowerCase()
                    .includes(keyword) ||
                item.address
                    ?.toLowerCase()
                    .includes(keyword);

            const matchStatus =
                !statusFilter ||
                item.verification_status === statusFilter;

            return (
                matchSearch &&
                matchStatus
            );
        });
    }, [data, search, statusFilter]);

    return (
        <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
            {/* SEARCH */}
            <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Tìm kiếm nhà cung cấp..."
            />

            {/* FILTER */}
            <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
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
            <SupplierTable
                data={filteredData}
                onView={
                    handleViewSupplier
                }
            />

            {/* MODAL */}
            <SupplierViewModal
                isOpen={viewRow !== null}
                onClose={() => setViewRow(null)}
                supplier={viewRow}
                onApprove={handleApprove}
                onReject={handleReject}
                loading={actionLoading}
            />
        </div>
    );
}