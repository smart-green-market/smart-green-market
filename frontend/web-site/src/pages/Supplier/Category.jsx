import { useState, useEffect } from "react";
import Filter from "../../components/Admin/UI/Filter";
import CategoryTable from "../../components/Supplier/Category/CategoryTable";
import AddCategoryModal from "../../components/Supplier/Category/CreateCategoryModal";
import { categoryService } from "../../services/api/categoryService";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import SupplierPageHeader, { SUPPLIER_PAGE_CLASS } from "../../components/Supplier/UI/SupplierPageHeader";
import DetailCategoryModal from "../../components/Supplier/Category/DetailCategoryModal"
import EditCategoryModal from "../../components/Supplier/Category/EditCategoryModal";
export default function CategorySupplierPage() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [deleteRow, setDeleteRow] = useState(null); // row | null
  const [showAddCategory, setShowAddCategory] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editRow, setEditRow] = useState(null);

  /* ── Fetch ── */
  const fetchCategories = async () => {
    try {
      const [activeList, pendingList, rejectedList, inactiveList] = await Promise.all([
        categoryService.getAll({ status: "active" }),
        categoryService.getAll({ status: "pending" }),
        categoryService.getAll({ status: "rejected" }),
        categoryService.getAll({ status: "inactive" }),
      ]);
      const merged = [
        ...activeList,
        ...pendingList,
        ...rejectedList,
        ...inactiveList,
      ];
      setData(merged);
    } catch (error) {
      console.error("Lỗi khi tải danh sách danh mục:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* ── Delete ── */
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      setDeleting(true);
      await categoryService.delete(deleteRow.id);
      setData((prev) => prev.filter((row) => row.id !== deleteRow.id));
      setDeleteRow(null);
    } catch (error) {
      console.error("Lỗi khi xoá danh mục:", error);
      alert("Xoá danh mục thất bại. Vui lòng thử lại!");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={SUPPLIER_PAGE_CLASS}>
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

      {/* Data table */}
      <CategoryTable
        data={data}
        search={search}
        statusFilter={statusFilter}
        onView={(row) => setSelectedCategory(row)}
        onDelete={row => setDeleteRow(row)}
      />

      {/* ── Modals ── */}
      <DeleteConfirmModal
        isOpen={deleteRow !== null}
        onClose={() => !deleting && setDeleteRow(null)}
        onConfirm={handleDelete}
        itemName={deleteRow?.name ?? ""}
        itemType="danh mục"
        loading={deleting}
      />
      {/* 
      <DetailProductModal
        isOpen={detailRow !== null}
        onClose={() => setDetailRow(null)}
        product={detailRow}
        onUpdate={handleUpdate}
      /> */}
      {selectedCategory && (
        <DetailCategoryModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          onEdit={(cat) => {
            setSelectedCategory(null);
            setEditRow(cat);
          }}
          onDelete={(cat) => {
            setSelectedCategory(null);
            setDeleteRow(cat);
          }}
        />
      )}
      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onSuccess={(newCat) => {
            console.log("Danh mục mới:", newCat);
            fetchCategories();
          }}
        />
      )}
      {editRow && (
        <EditCategoryModal
          category={editRow}
          onClose={() => setEditRow(null)}
          onSuccess={(updatedCat) => {
            console.log("Danh mục được cập nhật:", updatedCat);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
}