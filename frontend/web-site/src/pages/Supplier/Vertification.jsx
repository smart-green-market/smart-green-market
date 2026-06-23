import { useState, useEffect } from "react";
import { Award, CheckCircle2, AlertTriangle, Ban } from "lucide-react";
import CertificationTable from "../../components/Supplier/Certification/CertificationTable";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import CreateCertificationModal from "../../components/Supplier/Certification/CreateCertificationModal";
import { certificationService } from "../../services/api/CertificationService"; 
import DetailCertificationModal from "../../components/Supplier/Certification/DetailCertificationModal";
import SupplierPageHeader, { SUPPLIER_PAGE_CLASS } from "../../components/Supplier/UI/SupplierPageHeader";
import { getValidityBucket } from "../../components/Supplier/Certification/certificationStatus";

const METRIC_TONE = {
  b: "bg-blue-50 text-blue-600",
  g: "bg-emerald-50 text-emerald-600",
  a: "bg-amber-50 text-amber-600",
  r: "bg-red-50 text-red-600",
};

function MetricCard({ icon: Icon, value, label, tone }) {
  return (
    <div className="flex-1 min-w-[160px] rounded-xl border border-neutral-200 bg-white p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${METRIC_TONE[tone]}`}>
        <Icon size={16} />
      </div>
      <p className="text-2xl font-bold text-emerald-950">{value}</p>
      <p className="text-xs text-neutral-400 mt-1">{label}</p>
    </div>
  );
}

export default function CertificationSupplierPage() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [deleteRow, setDeleteRow] = useState(null);
  const [createRow, setCreateRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);

  // ── HÀM TẢI DỮ LIỆU TỪ API ──────────────────────────────
  const fetchCertifications = async () => {
    try {
      const response = await certificationService.getAll();
      setData(response);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chứng chỉ:", error);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, []);

  const handleCreate = (newCert) => {
    fetchCertifications(); 
  };

  // ── Thống kê: chỉ approved mới tính vào active/soon/expired ──
  const stats = data.reduce(
    (acc, row) => {
      const bucket = getValidityBucket(row);
      if (bucket) acc[bucket] += 1;
      return acc;
    },
    { active: 0, soon: 0, expired: 0 }
  );

  return (
    <div className={SUPPLIER_PAGE_CLASS}>
      {/* ── Thống kê ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        <MetricCard icon={Award} value={data.length} label="Tổng chứng nhận" tone="b" />
        <MetricCard icon={CheckCircle2} value={stats.active} label="Đang hiệu lực" tone="g" />
        <MetricCard icon={AlertTriangle} value={stats.soon} label="Sắp hết hạn" tone="a" />
        <MetricCard icon={Ban} value={stats.expired} label="Đã hết hạn" tone="r" />
      </div>

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
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide font-['Geist',sans-serif]">
          Lọc:
        </span>
        {[
          { value: "",         label: "Tất cả" },
          { value: "pending",  label: "Chờ duyệt" },
          { value: "approved", label: "Đã duyệt" },
          { value: "rejected", label: "Từ chối" },
          { value: "expired",  label: "Hết hạn" },
        ].map((chip) => (
          <button
            key={chip.value}
            onClick={() => setStatusFilter(chip.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === chip.value
                ? "bg-emerald-800 text-white"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Lưới chứng nhận */}
      <CertificationTable
        data={data}
        search={search}
        statusFilter={statusFilter}
        onView={(row) => setViewRow(row)}
      />

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <CreateCertificationModal
        isOpen={createRow !== null}
        onClose={() => setCreateRow(null)}
        onSuccess={handleCreate}
        itemName={createRow?.name ?? ""}
        itemType="chứng nhận"
      />

      <DetailCertificationModal
        isOpen={viewRow !== null}
        onClose={() => setViewRow(null)}
        certification={viewRow}
      />
    </div>
  );
}