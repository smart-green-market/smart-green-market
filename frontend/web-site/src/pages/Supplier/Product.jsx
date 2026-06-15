import { useState, useEffect } from "react";
import Filter from "../../components/Admin/UI/Filter";
import ProductTable from "../../components/Supplier/Product/ProductTable";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import CreateProductModal from "../../components/Supplier/Product/CreateProductModal";
import DetailProductModal from "../../components/Supplier/Product/DetailProductModal";
import { productService } from "../../services/api/productService";
import SupplierPageHeader, { SUPPLIER_PAGE_CLASS } from "../../components/Supplier/UI/SupplierPageHeader";
import { extractApiError } from "../../utils/extractApiError";

export default function ProductSupplierPage() {
  const [data,         setData]         = useState([]);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [deleteRow,       setDeleteRow]       = useState(null); // row | null
  const [createRow,       setCreateRow]       = useState(null); // row | null
  const [detailRow,       setDetailRow]       = useState(null); // row | null
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [toggleTarget,    setToggleTarget]    = useState(null); // { row, action: 'lock' | 'unlock' }
  const [togglingId,      setTogglingId]      = useState(null);

  /* ── Fetch ── */
  const fetchProducts = async () => {
    try {
      const response    = await productService.getAll();
      const productList = Array.isArray(response) ? response : (response?.results || []);
      setData(productList);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sản phẩm:", error);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  /* ── Delete ── */
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      setDeleting(true);
      await productService.deleteProduct(deleteRow.id);
      setData(prev => prev.filter(row => row.id !== deleteRow.id));
      setDeleteRow(null);
    } catch (error) {
      console.error("Lỗi khi xoá sản phẩm:", error);
      alert("Xoá sản phẩm thất bại. Vui lòng thử lại!");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Khóa / mở khóa bán hàng ── */
  const applySellingStatus = (row, updated) => {
    setData((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, ...updated } : item))
    );
    setDetailRow((prev) =>
      prev?.id === row.id ? { ...prev, ...updated } : prev
    );
  };

  const handleToggleSelling = async () => {
    if (!toggleTarget) return;

    const { row, action } = toggleTarget;

    try {
      setTogglingId(row.id);
      const updated =
        action === "lock"
          ? await productService.lockSelling(row.id)
          : await productService.unlockSelling(row.id);

      applySellingStatus(row, updated);
      setToggleTarget(null);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái bán hàng:", error);
      alert(extractApiError(error, "Cập nhật trạng thái bán hàng thất bại. Vui lòng thử lại!"));
      throw error;
    } finally {
      setTogglingId(null);
    }
  };

  /* ── Update (từ DetailModal) ── */
  const handleUpdate = async (updated) => {
    setData(prev =>
      prev.map(row => (row.id === updated.id ? { ...row, ...updated } : row))
    );
    setDetailRow(prev => (prev ? { ...prev, ...updated } : prev));

    try {
      const response = await productService.getAll();
      const productList = Array.isArray(response) ? response : (response?.results || []);
      setData(productList);
      const fresh = productList.find((p) => p.id === updated.id);
      if (fresh) setDetailRow((prev) => (prev ? { ...prev, ...fresh } : prev));
    } catch (error) {
      console.error("Lỗi khi đồng bộ danh sách sau cập nhật:", error);
    }
  };

  return (
    <div className={SUPPLIER_PAGE_CLASS}>
      <SupplierPageHeader
        title="Quản lý sản phẩm"
        description="Theo dõi và quản lý các sản phẩm đã và đang niêm yết trên hệ thống"
      />

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="px-4 py-2 border border-neutral-200 rounded-lg text-sm w-72 outline-none focus:border-emerald-600"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateRow({})}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide font-['Geist',sans-serif]">
          Lọc:
        </span>
        <Filter value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Data table */}
      <ProductTable
        data={data}
        search={search}
        statusFilter={statusFilter}
        onView={row => setDetailRow(row)}
        onDelete={row => setDeleteRow(row)}
        onLockSelling={row => setToggleTarget({ row, action: "lock" })}
        onUnlockSelling={row => setToggleTarget({ row, action: "unlock" })}
        togglingId={togglingId}
      />

      <ConfirmModal
        isOpen={toggleTarget !== null}
        onClose={() => !togglingId && setToggleTarget(null)}
        onConfirm={handleToggleSelling}
        title={toggleTarget?.action === "lock" ? "Khóa bán hàng" : "Mở khóa bán hàng"}
        message={
          toggleTarget?.action === "lock"
            ? `Bạn có chắc muốn tạm ngừng bán "${toggleTarget?.row?.name}"? Đại lý sẽ không thể đặt sản phẩm này.`
            : `Bạn có chắc muốn mở lại bán "${toggleTarget?.row?.name}"?`
        }
        confirmText={toggleTarget?.action === "lock" ? "Khóa bán" : "Mở khóa"}
        variant={toggleTarget?.action === "lock" ? "warning" : "success"}
        loading={Boolean(togglingId)}
        showToast={false}
      />

      {/* ── Modals ── */}
      <DeleteConfirmModal
        isOpen={deleteRow !== null}
        onClose={() => !deleting && setDeleteRow(null)}
        onConfirm={handleDelete}
        itemName={deleteRow?.name ?? ""}
        itemType="sản phẩm"
        loading={deleting}
      />

      <CreateProductModal
        isOpen={createRow !== null}
        onClose={() => setCreateRow(null)}
        onSuccess={() => {
          setCreateRow(null);
          fetchProducts();
        }}
      />

      <DetailProductModal
        isOpen={detailRow !== null}
        onClose={() => setDetailRow(null)}
        product={detailRow}
        onUpdate={handleUpdate}
        onLockSelling={row => setToggleTarget({ row, action: "lock" })}
        onUnlockSelling={row => setToggleTarget({ row, action: "unlock" })}
        togglingSelling={Boolean(togglingId && detailRow?.id === togglingId)}
      />

      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onSuccess={(newCat) => {
            console.log("Danh mục mới:", newCat);
            // TODO: nếu có state danh mục thì append vào đây
          }}
        />
      )}
    </div>
  );
}