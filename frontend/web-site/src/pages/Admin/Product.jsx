import { useCallback, useEffect, useMemo, useState } from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminFilterStatsCards from "../../components/Admin/UI/AdminFilterStatsCards";
import { PRODUCT_STAT_CARDS } from "../../components/Admin/UI/adminFilterStatsPresets";
import Filter from "../../components/Admin/Product/ProductFilter";
import ProductTable from "../../components/Admin/Product/ProductTable";
import ProductViewModal from "../../components/Admin/Product/ProductViewModal";

import { productService, handleApiError } from "../../services/api/productService";
import { appToast } from "../../components/common/toast";
import { buildCountsFromCards } from "../../utils/adminFilterStatsUtils";

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
  image: p.images?.find((i) => i.is_thumbnail)?.image_url ?? p.images?.[0]?.image_url,
  supplier: p.supplier,
  supplier_name: p.supplier?.company_name,
  category_name: p.category?.name,
});

// ── Page ────────────────────────────────────────────────────────────────────────
export default function ProductPage() {
  // ─── State ────────────────────────────────────────────────────────────────
  const [data, setData] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [viewRow, setViewRow] = useState(null);

  // ─── Fetch all ────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async ({ initial = false } = {}) => {
    try {
      if (initial) {
        setIsFetching(true);
        setLoadError("");
      } else {
        setLoading(true);
      }
      setError("");
      const response = await productService.getAll();
      const list = Array.isArray(response) ? response : response.results ?? [];
      setData(list.map(formatProduct));
    } catch (err) {
      const message = handleApiError(err, "Không thể tải danh sách sản phẩm");
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

  useEffect(() => {
    fetchProducts({ initial: true });
  }, [fetchProducts]);

  // ─── Fetch detail (mở modal) ─────────────────────────────────────────────
  const handleViewProduct = useCallback(async (row) => {
    try {
      setLoading(true);
      setModalError("");
      const detail = await productService.getById(row.id);
      setViewRow(formatProduct(detail));
    } catch (err) {
      setError(handleApiError(err, "Không thể tải chi tiết sản phẩm"));
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Approve (pending → active) ──────────────────────────────────────────
  const handleApprove = useCallback(async (product) => {
    try {
      setActionLoading(true);
      setModalError("");
      await productService.verify(product.id, { status: "active" });
      setViewRow(null);
      await fetchProducts();
    } catch (err) {
      const msg = handleApiError(err, "Không thể duyệt sản phẩm");
      setModalError(msg);
      throw new Error(msg);
    } finally {
      setActionLoading(false);
    }
  }, [fetchProducts]);

  // ─── Reject (pending → rejected) ─────────────────────────────────────────
  const handleReject = useCallback(async (product, rejectionReason) => {
    try {
      setActionLoading(true);
      setModalError("");
      await productService.verify(product.id, {
        status: "rejected",
        rejection_reason: rejectionReason,
      });
      setViewRow(null);
      await fetchProducts();
    } catch (err) {
      const msg = handleApiError(err, "Không thể từ chối sản phẩm");
      setModalError(msg);
      throw new Error(msg);
    } finally {
      setActionLoading(false);
    }
  }, [fetchProducts]);

  // ─── Pause (active → inactive) ───────────────────────────────────────────
  const handlePause = useCallback(async (product) => {
    try {
      setActionLoading(true);
      setModalError("");
      await productService.verify(product.id, { status: "inactive" });
      setViewRow(null);
      await fetchProducts();
    } catch (err) {
      const msg = handleApiError(err, "Không thể tạm ngưng sản phẩm");
      setModalError(msg);
    } finally {
      setActionLoading(false);
    }
  }, [fetchProducts]);

  // ─── Delete (inactive | rejected only) ───────────────────────────────────
  const handleDelete = useCallback(async (product) => {
    try {
      setActionLoading(true);
      setModalError("");
      await productService.delete(product.id);
      setViewRow(null);
      appToast.success("Đã xóa sản phẩm.");
      await fetchProducts();
    } catch (err) {
      const message = handleApiError(err, "Không thể xóa sản phẩm");

      // HTTP 409: còn phiếu nhập đang xử lý hoặc đại lý đang bán
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
      throw new Error(message);
    } finally {
      setActionLoading(false);
    }
  }, [fetchProducts]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const keyword = search.toLowerCase();

      const matchSearch =
        item.name?.toLowerCase().includes(keyword) ||
        item.category_name?.toLowerCase().includes(keyword) ||
        item.supplier_name?.toLowerCase().includes(keyword);

      const matchStatus = !statusFilter || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const productStats = useMemo(
    () => buildCountsFromCards(data, PRODUCT_STAT_CARDS, { field: "status" }),
    [data],
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <AdminInitialLoadGate
      isFetching={isFetching}
      loadError={loadError}
      onRetry={() => fetchProducts({ initial: true })}
      loadingMessage="Đang tải danh sách sản phẩm..."
    >
      <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
        <AdminFilterStatsCards
          counts={productStats}
          cards={PRODUCT_STAT_CARDS}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          loading={isFetching}
        />

        {/* SEARCH */}
        <Toolbar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Tìm kiếm sản phẩm..."
          filter={<Filter value={statusFilter} onChange={setStatusFilter} />}
        />

        {/* ERROR */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* TABLE */}
        <ProductTable
          data={filteredData}
          onView={handleViewProduct}
        />

        {/* DETAIL MODAL */}
        <ProductViewModal
          isOpen={viewRow !== null}
          onClose={() => { setViewRow(null); setModalError(""); }}
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