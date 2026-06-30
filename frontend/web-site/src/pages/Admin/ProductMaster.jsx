import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarRange } from "lucide-react";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import Toolbar from "../../components/Admin/UI/Toolbar";
import Filter from "../../components/Admin/ProductMaster/ProductMasterFilter";
import SeasonFilter from "../../components/Admin/ProductMaster/SeasonFilter";
import ProductMasterTable from "../../components/Admin/ProductMaster/ProductMasterTable";
import ProductMasterViewModal from "../../components/Admin/ProductMaster/ProductMasterViewModal";
import ProductMasterFormModal from "../../components/Admin/ProductMaster/ProductMasterFormModal";
import {
    buildProductMasterPayload,
    extractProductMasterList,
    formatProductMasterDetail,
    formatProductMasterRow,
    PRODUCT_MASTER_STATUS,
} from "../../components/Admin/ProductMaster/productMasterHelpers";
import { appToast } from "../../components/common/toast";
import {
    productMasterService,
    handleApiError,
} from "../../services/api/Admin/productMasterService";

export default function ProductMasterPage() {
    const [data, setData] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [seasonFilter, setSeasonFilter] = useState("");
    const [viewRow, setViewRow] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchProductMasters = useCallback(async ({ initial = false } = {}) => {
        try {
            if (initial) {
                setIsFetching(true);
                setLoadError("");
            } else {
                setLoading(true);
            }

            const response = await productMasterService.getAll();
            const list = extractProductMasterList(response);
            setData(list.map(formatProductMasterRow));
        } catch (err) {
            const message = handleApiError(
                err,
                "Không thể tải danh sách sản phẩm",
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
    }, []);

    const handleViewProduct = useCallback(async (row) => {
        try {
            setLoading(true);
            setError("");
            const detail = await productMasterService.getById(row.id);
            setViewRow(formatProductMasterDetail(detail));
        } catch (err) {
            setError(handleApiError(err, "Không thể tải chi tiết sản phẩm"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProductMasters({ initial: true });
    }, [fetchProductMasters]);

    const handleCreate = async (formData) => {
        try {
            setActionLoading(true);
            setError("");
            await productMasterService.create(
                buildProductMasterPayload(formData),
            );
            appToast.success("Đã tạo danh mục sản phẩm.");
            await fetchProductMasters();
        } catch (err) {
            const message = handleApiError(err, "Không thể tạo danh mục sản phẩm");
            setError(message);
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const refreshViewRow = async (id) => {
        const detail = await productMasterService.getById(id);
        setViewRow(formatProductMasterDetail(detail));
    };

    const handleUpdate = async (product, formData) => {
        try {
            setActionLoading(true);
            setError("");
            await productMasterService.update(
                product.id,
                buildProductMasterPayload({
                    ...formData,
                    status: product.status,
                }),
            );
            await refreshViewRow(product.id);
            appToast.success("Đã cập nhật danh mục sản phẩm.");
            await fetchProductMasters();
        } catch (err) {
            const message = handleApiError(
                err,
                "Không thể cập nhật danh mục sản phẩm",
            );
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (product) => {
        try {
            setActionLoading(true);
            setError("");
            await productMasterService.remove(product.id);
            setViewRow(null);
            appToast.success("Đã xóa danh mục sản phẩm.");
            await fetchProductMasters();
        } catch (err) {
            const message = handleApiError(err, "Không thể xóa danh mục sản phẩm");
            setError(message);
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (product, status) => {
        try {
            setActionLoading(true);
            setError("");
            await productMasterService.update(product.id, {
                status,
            });
            await refreshViewRow(product.id);
            appToast.success(
                status === PRODUCT_MASTER_STATUS.ACTIVE
                    ? "Đã mở khóa danh mục sản phẩm."
                    : "Đã khóa danh mục sản phẩm.",
            );
            await fetchProductMasters();
        } catch (err) {
            const message = handleApiError(
                err,
                "Không thể thay đổi trạng thái sản phẩm",
            );
            setError(message);
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminInitialLoadGate
            isFetching={isFetching}
            loadError={loadError}
            onRetry={() => fetchProductMasters({ initial: true })}
            loadingMessage="Đang tải danh sách sản phẩm..."
        >
            <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
                <Toolbar
                    search={search}
                    onSearch={setSearch}
                    onAdd={() => setIsCreateOpen(true)}
                    addLabel="Thêm danh mục sản phẩm"
                    searchPlaceholder="Tìm kiếm danh mục sản phẩm..."
                    secondaryAction={
                        <Link
                            to="/quan-tri/mua-he"
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 no-underline transition-colors hover:bg-emerald-100 font-['Geist',sans-serif]"
                        >
                            <CalendarRange className="h-4 w-4" />
                            Quản lý mùa
                        </Link>
                    }
                    filter={
                        <>
                            <Filter
                                value={statusFilter}
                                onChange={setStatusFilter}
                            />
                            <SeasonFilter
                                value={seasonFilter}
                                onChange={setSeasonFilter}
                            />
                        </>
                    }
                />

                {error ? (
                    <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                <ProductMasterTable
                    data={data}
                    loading={loading}
                    search={search}
                    statusFilter={statusFilter}
                    seasonFilter={seasonFilter}
                    onView={handleViewProduct}
                />

                <ProductMasterFormModal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={handleCreate}
                />

                <ProductMasterViewModal
                    isOpen={viewRow !== null}
                    onClose={() => setViewRow(null)}
                    product={viewRow}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    loading={actionLoading}
                />
            </div>
        </AdminInitialLoadGate>
    );
}
