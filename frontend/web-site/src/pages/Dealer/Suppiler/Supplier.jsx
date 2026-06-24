import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SupplierStatsCards from "../../../components/Dealer/Supplier/SupplierStatsCards";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
import SupplierTable from "../../../components/Dealer/Supplier/SupplierTable";
import { supplierService } from "../../../services/api/suppilerService";

export default function DealerSupplierPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // Gọi API lấy danh sách nhà cung cấp
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getAll({ page: currentPage, page_size: 10, search: searchQuery, status: statusFilter });
      const results = data?.results || data || [];
      setSuppliers(results);
      setTotalPages(Math.max(1, Math.ceil((data?.count || results.length) / 10)));
    } catch (error) {
      console.error("Lỗi khi tải danh sách nhà cung cấp:", error);
    } finally {
      setLoading(false);
    }
  };
  const filterOptions = [
    { label: "Tất cả", value: "", colorClass: "text-neutral-700" },
    { label: "Chờ duyệt", value: "pending", colorClass: "text-amber-700" },
    { label: "Đang hoạt động", value: "active", colorClass: "text-emerald-700" },
    { label: "Ngừng hoạt động", value: "inactive", colorClass: "text-neutral-500" },
    { label: "Từ chối", value: "rejected", colorClass: "text-red-600" },
    { label: "Đã xóa", value: "deleted", colorClass: "text-red-900" },
  ];

  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, searchQuery, statusFilter]);

  // Tìm kiếm và lọc theo trạng thái
  const filteredInventory = suppliers; // Đã đẩy việc filter lên API, ở đây chỉ render data.





  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      {/* Thống kê */}
      <SupplierStatsCards suppliers={suppliers} />

      {/* Bộ lọc và Tìm kiếm */}
      <SupplierFilter
        searchQuery={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        statusFilter={statusFilter}
        onStatusChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
        filterOptions={filterOptions}
        placeholder="Tìm kiếm nhà cung cấp..."

      />

      {/* Bảng Dữ liệu */}
      <SupplierTable
        filteredInventory={filteredInventory}
        onRowClick={(row) => {
          navigate(`/dai-ly/nha-cung-cap/${row.id}`);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}