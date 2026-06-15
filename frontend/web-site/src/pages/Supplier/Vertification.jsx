import { useState, useEffect } from "react";
// import Toolbar from "../../components/Admin/UI/Toolbar";
import Filter  from "../../components/Admin/UI/Filter"; 
import CertificationTable from "../../components/Supplier/Certification/CertificationTable";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import CreateCertificationModal from "../../components/Supplier/Certification/CreateCertificationModal";
import { certificationService } from "../../services/api/CertificationService"; 
import DetailCertificationModal from "../../components/Supplier/Certification/DetailCertificationModal";
import SupplierPageHeader, { SUPPLIER_PAGE_CLASS } from "../../components/Supplier/UI/SupplierPageHeader";

export default function CertificationSupplierPage() {
  const [data, setData] = useState([]); // Khởi tạo mảng rỗng để chứa dữ liệu từ API
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [deleteRow, setDeleteRow] = useState(null); // row | null
  const [createRow, setCreateRow] = useState(null); // row | null
  
  // ĐỔI TỪ detailRow THÀNH viewRow TẠI ĐÂY ĐỂ ĐỒNG BỘ VỚI BÊN DƯỚI
  const [viewRow, setViewRow] = useState(null); // row | null

  // ── HÀM TẢI DỮ LIỆU TỪ API ──────────────────────────────
  const fetchCertifications = async () => {
    try {
      const response = await certificationService.getAll();
      setData(response); // Lưu dữ liệu vào state bảng
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chứng chỉ:", error);
    }
  };

  // ── GỌI API KHI MỞ TRANG LẦN ĐẦU ───────────────────────
  useEffect(() => {
    fetchCertifications();
  }, []);

  // // ── CRUD ───────────────────────────────────────────────
  // const handleDelete = () => {
  //   // API xóa ở đây (bạn tự gọi thêm hàm API xóa nhé)
  //   setData((prev) => prev.filter((row) => row.id !== deleteRow.id));
  //   setDeleteRow(null);
  // };

  const handleCreate = (newCert) => {
    // Tải lại dữ liệu bảng sau khi tạo mới thành công
    fetchCertifications(); 
  };

  return (
    <div className={SUPPLIER_PAGE_CLASS}>
      <SupplierPageHeader
        title="Quản lý chứng nhận"
        description="Theo dõi và quản lý các chứng nhận sản phẩm đang gửi trên hệ thống"
      />

      {/* ── Actions bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Tìm kiếm mã hoặc tên chứng nhận..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-neutral-200 rounded-lg text-sm w-72 outline-none focus:border-emerald-600"
        />
        <button
          onClick={() => setCreateRow({})}
          className="px-4 py-2 bg-emerald-800 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
        >
          + Thêm chứng nhận mới
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
      <CertificationTable
        data={data}
        search={search}
        statusFilter={statusFilter}
        onView={(row) => setViewRow(row)}
        // onDelete={(row) => setDeleteRow(row)}
      />

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {/* <DeleteConfirmModal
        isOpen={deleteRow !== null}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDelete}
        itemName={deleteRow?.name ?? ""}
        itemType="chứng nhận"
      /> */}
      
      <CreateCertificationModal
        isOpen={createRow !== null}
        onClose={() => setCreateRow(null)}
        onSuccess={handleCreate}
        itemName={createRow?.name ?? ""}
        itemType="chứng nhận"
      />

      {/* ── Detail Modal ── */}
      <DetailCertificationModal
        isOpen={viewRow !== null}
        onClose={() => setViewRow(null)}
        certification={viewRow}
      />
    </div>
  );
}