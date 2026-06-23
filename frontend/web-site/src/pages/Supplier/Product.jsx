import { useState, useEffect } from "react";
import { Package, ShoppingCart, Lock, Clock } from "lucide-react";
import ProductTable from "../../components/Supplier/Product/ProductTable";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import CreateProductModal from "../../components/Supplier/Product/CreateProductModal";
import DetailProductModal from "../../components/Supplier/Product/DetailProductModal";
import { productService } from "../../services/api/productService";
import SupplierPageHeader, { SUPPLIER_PAGE_CLASS } from "../../components/Supplier/UI/SupplierPageHeader";
import { extractApiError } from "../../utils/extractApiError";

const METRIC_TONE = {
  b: "bg-blue-50 text-blue-600",
  g: "bg-emerald-50 text-emerald-600",
  a: "bg-amber-50 text-amber-600",
  r: "bg-neutral-100 text-neutral-500",
};

function MetricCard({ icon: Icon, value, label, tone }) {
  return (
    <div className="flex-1 min-w-[150px] rounded-xl border border-neutral-200 bg-white p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${METRIC_TONE[tone]}`}>
        <Icon size={16} />
      </div>
      <p className="text-2xl font-bold text-emerald-950">{value}</p>
      <p className="text-xs text-neutral-400 mt-1">{label}</p>
    </div>
  );
}

export default function ProductSupplierPage() {
  const [data,           setData]           = useState([]);
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories,     setCategories]     = useState([]); // danh sách danh mục từ data

  // Modal states
  const [deleteRow,    setDeleteRow]    = useState(null);
  const [createRow,    setCreateRow]    = useState(null);
  const [detailRow,    setDetailRow]    = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [togglingId,   setTogglingId]   = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  /* ── Fetch ── */
  const fetchProducts = async () => {
    try {
      const response    = await productService.getAll();
      const productList = Array.isArray(response) ? response : (response?.results || []);
      setData(productList);

      // Trích danh mục unique từ data để dùng cho filter
      const catMap = {};
      productList.forEach((p) => {
        if (p.category?.id) catMap[p.category.id] = p.category.name;
      });
      setCategories(Object.entries(catMap).map(([id, name]) => ({ id, name })));
    } catch (error) {
      console.error("Lỗi khi tải danh sách sản phẩm:", error);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  /* ── Thống kê ── */
  const stats = {
    total:    data.length,
    active:   data.filter((r) => r.status === "active").length,
    inactive: data.filter((r) => r.status === "inactive").length,
    pending:  data.filter((r) => r.status === "pending").length,
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      setDeleting(true);
      await productService.deleteProduct(deleteRow.id);
      setData((prev) => prev.filter((row) => row.id !== deleteRow.id));
      setDeleteRow(null);
    } catch (error) {
      console.error("Lỗi khi xoá sản phẩm:", error);
      alert("Xoá sản phẩm thất bại. Vui lòng thử lại!");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Khóa / mở khóa ── */
  const applySellingStatus = (row, updated) => {
    setData((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...updated } : item)));
    setDetailRow((prev) => (prev?.id === row.id ? { ...prev, ...updated } : prev));
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

  /* ── Update từ DetailModal ── */
  const handleUpdate = async (updated) => {
    setData((prev) => prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)));
    setDetailRow((prev) => (prev ? { ...prev, ...updated } : prev));
    try {
      const response    = await productService.getAll();
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

      {/* ── Thống kê ── */}
      <div className="flex flex-wrap gap-4">
        <MetricCard icon={Package}     value={stats.total}    label="Tổng sản phẩm"  tone="b" />
        <MetricCard icon={ShoppingCart} value={stats.active}  label="Đang bán"        tone="g" />
        <MetricCard icon={Lock}        value={stats.inactive} label="Đã khóa"         tone="r" />
        <MetricCard icon={Clock}       value={stats.pending}  label="Chờ duyệt"       tone="a" />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex justify-between items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="px-4 py-2 border border-neutral-200 rounded-lg text-sm w-72 outline-none focus:border-emerald-600"
        />
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

      {/* ── Filters ── */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Filter danh mục */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide font-['Geist',sans-serif]">
            Danh mục:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[{ id: "", name: "Tất cả" }, ...categories].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  categoryFilter === cat.id
                    ? "bg-emerald-800 text-white"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filter nhanh: chờ duyệt */}
        <button
          onClick={() => setStatusFilter(statusFilter === "pending" ? "" : "pending")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
            statusFilter === "pending"
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-white text-amber-600 border-amber-300 hover:bg-amber-50"
          }`}
        >
          <Clock size={12} />
          Chờ duyệt {stats.pending > 0 && `(${stats.pending})`}
        </button>
      </div>

      {/* ── Table ── */}
      <ProductTable
        data={data}
        search={search}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        onView={(row) => setDetailRow(row)}
        onDelete={(row) => setDeleteRow(row)}
        onLockSelling={(row) => setToggleTarget({ row, action: "lock" })}
        onUnlockSelling={(row) => setToggleTarget({ row, action: "unlock" })}
        togglingId={togglingId}
      />

      {/* ── Modals ── */}
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
        onSuccess={() => { setCreateRow(null); fetchProducts(); }}
      />

      <DetailProductModal
        isOpen={detailRow !== null}
        onClose={() => setDetailRow(null)}
        product={detailRow}
        onUpdate={handleUpdate}
        onLockSelling={(row) => setToggleTarget({ row, action: "lock" })}
        onUnlockSelling={(row) => setToggleTarget({ row, action: "unlock" })}
        togglingSelling={Boolean(togglingId && detailRow?.id === togglingId)}
      />
    </div>
  );
}