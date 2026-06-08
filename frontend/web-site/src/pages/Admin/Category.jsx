import { useCallback, useEffect, useState } from "react";
import Toolbar from "../../components/Admin/UI/Toolbar";
import Filter from "../../components/Admin/Category/CategoryFilter";
import CategoryTable from "../../components/Admin/Category/CategoryTable";
import CategoryViewModal from "../../components/Admin/Category/CategoryViewModal";
import { categoryService, handleApiError} from "../../services/api/categoryService";

export default function CategoryPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");
    const [viewRow, setViewRow] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // FETCH
    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);

            const response =
                await categoryService.getAll();

            const formattedData = response.map(
                (category) => ({
                    id: category.id,

                    name: category.name,

                    status:
                        category.status,

                    created_at:
                        category.created_at,

                    updated_at:
                        category.updated_at,
                })
            );

            setData(formattedData);
        } catch (error) {
            const message = (
                handleApiError(
                    error,
                    "Không thể tải danh sách danh mục"
                )
            );

            setError(message);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const handleViewCategory =
            useCallback(async (row) => {
                try {
                    setLoading(true);
    
                    const detail =
                        await categoryService.getById(
                            row.id
                        );
                    const formattedDetail = {
                        id: detail.id,
                        
                        status: detail.status,

                        name: detail.name,
    
                        description: detail.description,
    
                        created_at: detail.created_at,
    
                        verified_at: detail.updated_at,
                    };
    
                    setViewRow(
                        formattedDetail
                    );
                } catch (error) {
                    handleApiError(
                        error,
                        "Không thể tải chi tiết danh mục"
                    );
                } finally {
                    setLoading(false);
                }
            }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    // APPROVE
    const handleApprove = async (category) => {
        try {
            setActionLoading(true);
            await categoryService.verify(
                category.id,
                {
                    status: "active",
                    rejection_reason: "",
                }
            );
            setViewRow(null);
            await fetchCategories();
        } catch (error) {
            console.error(
                handleApiError(error)
            );
        } finally {
            setActionLoading(false);
        }
    };

    // REJECT
    const handleReject = async (category) => {
        try {
            setActionLoading(true);
            await categoryService.verify(
                category.id,
                {
                    status: "rejected",
                    rejection_reason:
                        "Không hợp lệ",
                }
            );
            setViewRow(null);
            await fetchCategories();
        } catch (error) {
            console.error(
                handleApiError(error)
            );
        } finally {
            setActionLoading(false);
        }
    };

    // LOCK
    const handleLock = async (category) => {
        try {
            setActionLoading(true);
            await categoryService.lock(
                category.id,{
                    status: "inactive",
                    rejection_reason:
                        "Không hợp lệ",
                }
            );
            setViewRow(null);
            await fetchCategories();
        } catch (error) {
            console.error(
                handleApiError(error)
            );
        } finally {
            setActionLoading(false);
        }
    };

    // UNLOCK
    const handleUnlock = async (category) => {
        try {
            setActionLoading(true);
            await categoryService.unlock(
                category.id,{
                    status: "active",
                }
            );
            setViewRow(null);
            await fetchCategories();
        } catch (error) {
            console.error(
                handleApiError(error)
            );
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 px-8 pt-6 pb-10">

            <Toolbar
                search={search}
                onSearch={setSearch}
                searchPlaceholder="Tìm kiếm danh mục..."
            />

            <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                    Lọc:
                </span>

                <Filter
                    value={statusFilter}
                    onChange={setStatusFilter}
                />
            </div>

            {/* ERROR */}
            {error && (
                <div className="px-4 py-3 rounded-xl bg-red-100 text-red-700 text-sm">
                    {error}
                </div>
            )}

            <CategoryTable
                data={data}
                loading={loading}
                search={search}
                statusFilter={statusFilter}
                onView={handleViewCategory}
            />

            <CategoryViewModal
                isOpen={viewRow !== null}
                onClose={() => setViewRow(null)}
                category={viewRow}
                onApprove={handleApprove}
                onReject={handleReject}
                onLock={handleLock}
                onUnlock={handleUnlock}
                loading={actionLoading}
            />
        </div>
    );
}