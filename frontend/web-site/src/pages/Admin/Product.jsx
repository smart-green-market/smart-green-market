import { useCallback, useEffect, useMemo, useState } from "react";

import SearchBar from "../../components/Admin/UI/SearchBar";
import Filter from "../../components/Admin/Product/ProductFilter";
import ProductTable from "../../components/Admin/Product/ProductTable";
import ProductViewModal from "../../components/Admin/Product/ProductViewModal";

import { productService, handleApiError } from "../../services/api/productService";
const formatProduct = (p) => ({
  id:                    p.id,
  name:                  p.name,
  slug:                  p.slug,
  unit:                  p.unit,
  description:           p.description,
  storage_duration_days: p.storage_duration_days,
  min_storage_temp:      p.min_storage_temp,
  max_storage_temp:      p.max_storage_temp,
  status:                p.status,
  rejection_reason:      p.rejection_reason,
  verified_by:           p.verified_by,
  verified_by_username:  p.verified_by_username,
  verified_at:           p.verified_at,
  created_at:            p.created_at,
  updated_at:            p.updated_at,
  images:                p.images ?? [],
  image:                 p.images?.find((i) => i.is_thumbnail)?.image_url ?? p.images?.[0]?.image_url,
  supplier:              p.supplier,
  supplier_name:         p.supplier?.company_name,
  category_name:         p.category?.name,
});

// ── Page ────────────────────────────────────────────────────────────────────────
export default function ProductPage() {
  // ─── State ────────────────────────────────────────────────────────────────
  const [data,          setData]          = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [modalError,    setModalError]    = useState("");

  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("pending");

  const [viewRow,       setViewRow]       = useState(null);

  // ─── Fetch all ────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await productService.getAll();
      // API có thể trả về { results: [...] } hoặc []
      const list = Array.isArray(response) ? response : response.results ?? [];
      setData(list.map(formatProduct));
    } catch (err) {
      setError(handleApiError(err, "Không thể tải danh sách sản phẩm"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
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
      throw new Error(msg); // giữ modal mở nếu cần
    } finally {
      setActionLoading(false);
    }
  }, [fetchProducts]);

  // ─── Reject (pending → paused/rejected) ──────────────────────────────────
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

  // ─── Pause (active → paused) ──────────────────────────────────────────────
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

  const filteredData = useMemo(() => {
        return data.filter((item) => {
            const keyword =
                search.toLowerCase();

            const matchSearch =
                item.name
                    ?.toLowerCase()
                    .includes(keyword) ||
                item.category_name
                    ?.toLowerCase()
                    .includes(keyword) ||
                item.supplier_name
                    ?.toLowerCase()
                    .includes(keyword);

            const matchStatus =
                !statusFilter ||
                item.status === statusFilter;

            return (
                matchSearch &&
                matchStatus
            );
        });
    }, [data, search, statusFilter]);
  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
      {/* SEARCH */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm kiếm sản phẩm..."
      />
      
      {/* FILTER */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Lọc:
        </span>
        <Filter value={statusFilter} onChange={setStatusFilter} />
      </div>

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
        loading={actionLoading}
        error={modalError}
      />
    </div>
  );
}