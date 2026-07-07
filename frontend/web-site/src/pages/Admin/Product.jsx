import { useCallback, useState } from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminFilterStatsCards from "../../components/Admin/UI/AdminFilterStatsCards";
import AdminListPagination from "../../components/Admin/UI/AdminListPagination";
import { PRODUCT_STAT_CARDS } from "../../components/Admin/UI/adminFilterStatsPresets";
import Filter from "../../components/Admin/Product/ProductFilter";
import ProductTable from "../../components/Admin/Product/ProductTable";
import ProductViewModal from "../../components/Admin/Product/ProductViewModal";

import {
  productService,
  handleApiError,
} from "../../services/api/productService";
import { useAdminPaginatedList } from "../../hooks/useAdminPaginatedList";
import {
  useAdminFilterStats,
  useAdminStatsLoading,
} from "../../hooks/useAdminFilterStats";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { appToast } from "../../components/common/toast";

const formatProduct = (p) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  unit: p.unit,
  description: p.description,
  storage_duration_days: p.storage_duration_days,
  min_storage_temp: p.min_storage_temp,
  max_storage_temp: p.max_storage_temp,
  status: p.status,
  rejection_reason: p.rejection_reason,
  verified_by: p.verified_by,
  verified_by_username: p.verified_by_username,
  verified_at: p.verified_at,
  created_at: p.created_at,
  updated_at: p.updated_at,
  images: p.images ?? [],
  image:
    p.images?.find((i) => i.is_thumbnail)?.image_url ??
    p.images?.[0]?.image_url,
  supplier: p.supplier,
  supplier_name: p.supplier?.company_name,
  category_name: p.category?.name,
});

export default function ProductPage() {
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewRow, setViewRow] = useState(null);
  const [modalError, setModalError] = useState("");

  const {
    data,
    countStatus,
    isFetching,
    loadError,
    loading,
    error: listError,
    currentPage,
    totalPages,
    pageRange,
    totalCount,
    fetchData,
    refresh,
    handlePageChange,
    setCurrentPage,
  } = useAdminPaginatedList({
    fetchList: (params) => productService.getList(params),
    mapRows: (rows) => rows.map(formatProduct),
    buildQuery: () => ({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
    }),
    queryDeps: [debouncedSearch, statusFilter],
    onFetchError: (err) =>
      handleApiError(err, "Không thể tải danh sách sản phẩm"),
  });

  const handleViewProduct = useCallback(async (row) => {
    try {
      setModalError("");
      const detail = await productService.getById(row.id);
      setViewRow(formatProduct(detail));
    } catch (err) {
      setError(handleApiError(err, "Không thể tải chi tiết sản phẩm"));
    }
  }, []);

  const handleApprove = useCallback(async (product) => {
    try {
      setActionLoading(true);
      setModalError("");
      await productService.verify(product.id, { status: "active" });
      setViewRow(null);
      await refresh();
    } catch (err) {
      const msg = handleApiError(err, "Không thể duyệt sản phẩm");
      setModalError(msg);
      throw new Error(msg);
    } finally {
      setActionLoading(false);
    }
  }, [refresh]);

  const handleReject = useCallback(async (product, rejectionReason) => {
    try {
      setActionLoading(true);
      setModalError("");
      await productService.verify(product.id, {
        status: "rejected",
        rejection_reason: rejectionReason,
      });
      setViewRow(null);
      await refresh();
    } catch (err) {
      const msg = handleApiError(err, "Không thể từ chối sản phẩm");
      setModalError(msg);
      throw new Error(msg);
    } finally {
      setActionLoading(false);
    }
  }, [refresh]);

  const handlePause = useCallback(async (product) => {
    try {
      setActionLoading(true);
      setModalError("");
      await productService.verify(product.id, { status: "inactive" });
      setViewRow(null);
      await refresh();
    } catch (err) {
      const msg = handleApiError(err, "Không thể tạm ngưng sản phẩm");
      setModalError(msg);
    } finally {
      setActionLoading(false);
    }
  }, [refresh]);

  const handleDelete = useCallback(async (product) => {
    try {
      setActionLoading(true);
      setModalError("");
      await productService.delete(product.id);
      setViewRow(null);
      appToast.success("Đã xóa sản phẩm.");
      await refresh();
    } catch (err) {
      const message = handleApiError(err, "Không thể xóa sản phẩm");

      if (
        err?.response?.status === 409 ||
        message.toLowerCase().includes("phiếu nhập") ||
        message.toLowerCase().includes("đại lý") ||
        message.toLowerCase().includes("order") ||
        message.toLowerCase().includes("import")
      ) {
        appToast.warning(
          "Không thể xóa sản phẩm này vì còn phiếu nhập đang xử lý hoặc đại lý đang bán. Hãy hoàn tất hoặc hủy các giao dịch liên quan trước.",
        );
      } else {
        appToast.error(message);
      }

      setModalError(message);
      const handledError = new Error(message);
      handledError.toastHandled = true;
      throw handledError;
    } finally {
      setActionLoading(false);
    }
  }, [refresh]);

  const productStats = useAdminFilterStats({
    countStatus,
    data,
    cards: PRODUCT_STAT_CARDS,
  });
  const statsLoading = useAdminStatsLoading(isFetching, countStatus);

  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const displayError = error || listError;

  return (
    <AdminInitialLoadGate
      isFetching={isFetching}
      loadError={loadError}
      onRetry={() => fetchData({ page: currentPage, initial: true })}
      loadingMessage="Đang tải danh sách sản phẩm..."
    >
      <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
        <AdminFilterStatsCards
          counts={productStats}
          cards={PRODUCT_STAT_CARDS}
          activeFilter={statusFilter}
          onFilterChange={handleFilterChange}
          loading={statsLoading}
        />

        <Toolbar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Tìm kiếm sản phẩm..."
          filter={<Filter value={statusFilter} onChange={handleFilterChange} />}
        />

        {displayError ? (
          <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
            {displayError}
          </div>
        ) : null}

        {loading && !isFetching ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
          </div>
        ) : data.length > 0 ? (
          <div className="flex flex-col gap-4">
            <ProductTable data={data} onView={handleViewProduct} />
            <AdminListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageRange={pageRange}
              onPageChange={handlePageChange}
              noun="sản phẩm"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium text-neutral-700">
              Không tìm thấy sản phẩm phù hợp
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Thử đổi bộ lọc hoặc từ khóa tìm kiếm khác.
            </p>
          </div>
        )}

        <ProductViewModal
          isOpen={viewRow !== null}
          onClose={() => {
            setViewRow(null);
            setModalError("");
          }}
          product={viewRow}
          onApprove={handleApprove}
          onReject={handleReject}
          onActive={handleApprove}
          onPause={handlePause}
          onDelete={handleDelete}
          loading={actionLoading}
          error={modalError}
        />
      </div>
    </AdminInitialLoadGate>
  );
}
