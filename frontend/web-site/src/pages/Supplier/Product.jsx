import { useState, useEffect } from "react";
import Filter from "../../components/Admin/UI/Filter";
import ProductTable from "../../components/Supplier/Product/ProductTable";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import CreateProductModal from "../../components/Supplier/Product/CreateProductModal";
import DetailProductModal from "../../components/Supplier/Product/DetailProductModal";
import { productService } from "../../services/api/productService";

export default function ProductSupplierPage() {
  const [data,         setData]         = useState([]);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [deleteRow, setDeleteRow] = useState(null); // row | null
  const [createRow, setCreateRow] = useState(null); // row | null
  const [detailRow, setDetailRow] = useState(null); // row | null

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
    <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
      <h1>Quản lý sản phẩm</h1>

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="px-4 py-2 border border-neutral-200 rounded-lg text-sm w-72 outline-none focus:border-emerald-600"
        />
        <button
          onClick={() => setCreateRow({})}
          className="px-4 py-2 bg-emerald-800 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
        >
          + Thêm sản phẩm
        </button>
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
      />
    </div>
  );
}