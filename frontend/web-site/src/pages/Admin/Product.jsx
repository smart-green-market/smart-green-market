import { useState } from "react";
import Toolbar from "../../components/Admin/UI/Toolbar";
import Filter  from "../../components/Admin/UI/Filter";
import ProductTable from "../../components/Admin/Product/ProductTable";
import ConfirmModal from "../../components/common/ConfirmModal";

// ── Mock data ─────────────────────────────────────────────────────────────────
const INITIAL_DATA = [
  { id: 1, code: "#GM-P-01", name: "Rau cải thìa",    supplier: "Nông trại Xanh", status: "active",  image: "../public/images/rau.jpg" },
  { id: 2, code: "#GM-P-02", name: "Cà chua bi",       supplier: "Garden Fresh",   status: "pending", image: "../public/images/rau.jpg" },
  { id: 3, code: "#GM-P-03", name: "Táo hữu cơ",       supplier: "Nông trại Xanh", status: "paused",  image: "../public/images/rau.jpg" },
  { id: 4, code: "#GM-P-04", name: "Khoai tây Đà Lạt", supplier: "VietFarm",       status: "active",  image: "../public/images/rau.jpg" },
  { id: 5, code: "#GM-P-05", name: "Dưa leo sạch",     supplier: "VietFarm",       status: "active",  image: "../public/images/rau.jpg" },
  { id: 6, code: "#GM-P-06", name: "Bí đỏ hữu cơ",    supplier: "Nông trại Xanh", status: "active",  image: "../public/images/rau.jpg" },
  { id: 7, code: "#GM-P-07", name: "Ớt chuông đỏ",    supplier: "Garden Fresh",   status: "pending", image: "../public/images/rau.jpg" },
];

export default function ProductPage() {
  const [data,         setData]         = useState(INITIAL_DATA);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Modal states
  const [deleteRow, setDeleteRow] = useState(null); // row | null

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    setData((prev) => prev.filter((row) => row.id !== deleteRow.id));
  };

  return (
    <div className="flex flex-col gap-6 px-8 pt-6 pb-10">

      {/* Toolbar: search + filter button + add CTA */}
      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Tìm kiếm sản phẩm..."
      />

      {/* Status filter chips */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide font-['Geist',sans-serif]">
          Lọc:
        </span>
        <Filter value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Data table — pagination & sort built-in */}
      <ProductTable
        data={data}
        search={search}
        statusFilter={statusFilter}
        // onView={(row) => {/* mở ProductDetailModal nếu có */}}
        onDelete={(row) => setDeleteRow(row)}
      />

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteRow !== null}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDelete}
        title="Xóa sản phẩm"
        message={`Bạn có chắc chắn muốn xóa sản phẩm "${deleteRow?.name}" không?`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}