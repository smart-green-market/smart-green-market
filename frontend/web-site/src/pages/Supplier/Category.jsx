import { useState, useEffect } from "react";
import Filter from "../../components/Admin/UI/Filter";
import CategoryTable from "../../components/Supplier/Category/CategoryTable";
import AddCategoryModal from "../../components/Supplier/Category/CreateCategoryModal";
import { categoryService } from "../../services/api/categoryService";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import SupplierPageHeader, { SUPPLIER_PAGE_CLASS } from "../../components/Supplier/UI/SupplierPageHeader";

export default function CategorySupplierPage() {
  const [data,         setData]         = useState([]);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [deleteRow,       setDeleteRow]       = useState(null); // row | null
  const [showAddCategory, setShowAddCategory] = useState(false);

  /* ── Fetch ── */
  const fetchProducts = async () => {
    try {
      const response    = await categoryService.getAll();
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
      await categoryService.delete(deleteRow.id);
      setData(prev => prev.filter(row => row.id !== deleteRow.id));
      setDeleteRow(null);
    } catch (error) {
      console.error("Lỗi khi xoá sản phẩm:", error);
      alert("Xoá sản phẩm thất bại. Vui lòng thử lại!");
    } finally {
      setDeleting(false);
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
        title="Quản lý danh mục"
        description="Theo dõi và quản lý các danh mục sản phẩm đã và đang niêm yết trên hệ thống"
      />

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm danh mục"
          className="px-4 py-2 border border-neutral-200 rounded-lg text-sm w-72 outline-none focus:border-emerald-600"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-emerald-700 text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
            </svg>
            Thêm danh mục
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
      <CategoryTable
        data={data}
        search={search}
        statusFilter={statusFilter}
        onView={row => setDetailRow(row)}
        onDelete={row => setDeleteRow(row)}
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
{/* 
      <DetailProductModal
        isOpen={detailRow !== null}
        onClose={() => setDetailRow(null)}
        product={detailRow}
        onUpdate={handleUpdate}
      /> */}

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