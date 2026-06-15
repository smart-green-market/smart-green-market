import { useState, useEffect } from "react";
import CultivationTable from "../../components/Supplier/Cultivation/CultivationTable";
import CreateCultivationModal from "../../components/Supplier/Cultivation/CreateCultivationModal";
import DetailCultivationModal from "../../components/Supplier/Cultivation/DetailCultivationModal";
import EditCultivationModal from "../../components/Supplier/Cultivation/EditCultivationModal";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import SupplierPageHeader, { SUPPLIER_PAGE_CLASS } from "../../components/Supplier/UI/SupplierPageHeader";
import { farmingProcessService } from "../../services/api/cultivationService";
import { parseCultivationList } from "../../components/Supplier/Cultivation/cultivationUtils";

export default function CultivationSupplierPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const [createRow, setCreateRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await farmingProcessService.getAll();
      setData(parseCultivationList(res));
    } catch (err) {
      console.error("Lỗi khi tải quy trình canh tác:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      setDeleting(true);
      await farmingProcessService.delete(deleteRow.id);
      setData((prev) => prev.filter((r) => r.id !== deleteRow.id));
      setDeleteRow(null);
    } catch (err) {
      console.error("Lỗi khi xóa quy trình:", err);
      alert("Xóa quy trình thất bại. Vui lòng thử lại!");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={SUPPLIER_PAGE_CLASS}>
      <SupplierPageHeader
        title="Quy trình canh tác"
        description="Quản lý các bước quy trình canh tác theo từng sản phẩm của nhà cung cấp"
      />

      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Tìm kiếm tên quy trình..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-neutral-200 rounded-lg text-sm w-72 outline-none focus:border-emerald-600"
        />
        <button
          onClick={() => setCreateRow({})}
          className="px-4 py-2 bg-emerald-800 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
        >
          + Thêm quy trình mới
        </button>
      </div>

      <ProductFilterChips value={productFilter} onChange={setProductFilter} data={data} />

      {loading ? (
        <div className="text-center text-neutral-400 py-16 text-sm">Đang tải dữ liệu...</div>
      ) : (
        <CultivationTable
          data={data}
          search={search}
          productFilter={productFilter}
          onView={(row) => setViewRow(row)}
          onEdit={(row) => setEditRow(row)}
          onDelete={(row) => setDeleteRow(row)}
        />
      )}

      <CreateCultivationModal
        isOpen={createRow !== null}
        onClose={() => setCreateRow(null)}
        onSuccess={fetchData}
      />

      <DetailCultivationModal
        isOpen={viewRow !== null}
        onClose={() => setViewRow(null)}
        process={viewRow}
      />

      <EditCultivationModal
        isOpen={editRow !== null}
        onClose={() => setEditRow(null)}
        process={editRow}
        onSuccess={fetchData}
      />

      <DeleteConfirmModal
        isOpen={deleteRow !== null}
        onClose={() => !deleting && setDeleteRow(null)}
        onConfirm={handleDelete}
        itemName={deleteRow?.process_name ?? ""}
        itemType="quy trình"
        loading={deleting}
      />
    </div>
  );
}

function ProductFilterChips({ value, onChange, data }) {
  const products = [
    ...new Map(
      data.map((r) => [r.supplier_product, r.product_name])
    ).entries(),
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
        Sản phẩm:
      </span>
      <button
        onClick={() => onChange("")}
        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
          value === ""
            ? "bg-emerald-800 text-white border-emerald-800"
            : "bg-white text-neutral-600 border-neutral-200 hover:border-emerald-600"
        }`}
      >
        Tất cả
      </button>
      {products.map(([id, name]) => (
        <button
          key={id}
          onClick={() => onChange(String(id))}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
            value === String(id)
              ? "bg-emerald-800 text-white border-emerald-800"
              : "bg-white text-neutral-600 border-neutral-200 hover:border-emerald-600"
          }`}
        >
          {name ?? `SP #${id}`}
        </button>
      ))}
    </div>
  );
}
