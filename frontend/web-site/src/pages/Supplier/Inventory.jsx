import { useState } from "react";
// import Toolbar from "../../components/Admin/UI/Toolbar";
import Filter from "../../components/Admin/UI/Filter";
import InventoryTable from "../../components/Supplier/Inventory/InventoryTable";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import CreateInventoryModal from "../../components/Supplier/Inventory/CreateInventoryModal";
import InventoryDetailModal from "../../components/Supplier/Inventory/DetailInventoryModal";

// ── Mock data ─────────────────────────────────────────────────────────────────
const INITIAL_DATA = [
  { id: 1, code: "#GM-P-01", name: "Rau cải thìa", price: 15000, unit: "kg", inventory: 100, status: "active", image: "../public/images/rau.jpg" },
  { id: 2, code: "#GM-P-02", name: "Cà chua bi", price: 20000, unit: "kg", inventory: 50, status: "pending", image: "../public/images/rau.jpg" },
  { id: 3, code: "#GM-P-03", name: "Táo hữu cơ", price: 30000, unit: "kg", inventory: 75, status: "paused", image: "../public/images/rau.jpg" },
  { id: 4, code: "#GM-P-04", name: "Khoai tây Đà Lạt", price: 12000, unit: "kg", inventory: 120, status: "active", image: "../public/images/rau.jpg" },
  { id: 5, code: "#GM-P-05", name: "Dưa leo sạch", price: 18000, unit: "kg", inventory: 80, status: "active", image: "../public/images/rau.jpg" },
  { id: 6, code: "#GM-P-06", name: "Bí đỏ hữu cơ", price: 25000, unit: "kg", inventory: 60, status: "active", image: "../public/images/rau.jpg" },
  { id: 7, code: "#GM-P-07", name: "Ớt chuông đỏ", price: 22000, unit: "kg", inventory: 90, status: "pending", image: "../public/images/rau.jpg" },
];

export default function InventorySupplierPage() {
  const [data, setData] = useState(INITIAL_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [deleteRow, setDeleteRow] = useState(null); // row | null
  const [createRow, setCreateRow] = useState(null); // row | null
  const [detailRow, setDetailRow] = useState(null); // row | null

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    setData((prev) => prev.filter((row) => row.id !== deleteRow.id));
  };
  const handleCreate = () => {
    if (!createRow) return;
    const newItem = {
      id: Date.now(), // simple unique ID
      code: `#GM-P-${String(data.length + 1).padStart(2, "0")}`,
      name: createRow.name,
      price: createRow.price,
      unit: createRow.unit,
      inventory: createRow.inventory,
      status: "pending",
      image: createRow.image,
    };
    setData((prev) => [newItem, ...prev]);
  }
  return (
    <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
      <h1>Quản lý tồn kho</h1>
      {/* Toolbar: search + filter button + add CTA */}
      <div className="flex justify-between items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm lô hàng..."
          className="px-4 py-2 border border-neutral-200 rounded-lg text-sm w-72 outline-none focus:border-emerald-600"
        />
        <button
          onClick={() => setCreateRow({})}
          className="px-4 py-2 bg-emerald-800 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
        >
          + Thêm lô hàng
        </button>
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide font-['Geist',sans-serif]">
          Lọc:
        </span>
        <Filter value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Data table — pagination & sort built-in */}
      <InventoryTable
        data={data}
        search={search}
        statusFilter={statusFilter}
        onView={(row) => setDetailRow(row)}
        onDelete={(row) => setDeleteRow(row)}
      />

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <DeleteConfirmModal
        isOpen={deleteRow !== null}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDelete}
        itemName={deleteRow?.name ?? ""}
        itemType="lô hàng"
      />
      <CreateInventoryModal
        isOpen={createRow !== null}
        onClose={() => setCreateRow(null)}
        onConfirm={handleCreate}
        itemName={createRow?.name ?? ""}
        itemType="lô hàng"
      />
      <InventoryDetailModal
        isOpen={detailRow !== null}
        onClose={() => setDetailRow(null)}
        product={detailRow}      // object từ API
        onUpdate={(updated) => { }} // callback sau khi lưu
      />
    </div>
  );
}