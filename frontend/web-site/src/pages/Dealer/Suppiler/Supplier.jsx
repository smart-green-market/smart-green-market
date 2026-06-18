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
  const navigate = useNavigate();

  // Gọi API lấy danh sách nhà cung cấp
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getAll();
      console.log(data);
      setSuppliers(data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách nhà cung cấp:", error);
    } finally {
      setLoading(false);
    }
  };
  const filterOptions = [

  ];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Tìm kiếm và lọc theo trạng thái
  const filteredInventory = suppliers.filter((item) => {
    // API trả về company_name thay vì name, kiểm tra dữ liệu trả về từ API
    const supplierName = item.company_name || item.name || "";
    const supplierStatus = item.verification_status || item.status || "";

    const matchesSearch =
      supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplierStatus.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "" || supplierStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });



  if (loading) {
    return (
      <div className="p-6 bg-emerald-50/15 min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      {/* Thống kê */}
      <SupplierStatsCards suppliers={suppliers} />

      {/* Bộ lọc và Tìm kiếm */}
      <SupplierFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        filterOptions={filterOptions}
        placeholder="Tìm kiếm nhà cung cấp..."

      />

      {/* Bảng Dữ liệu */}
      <SupplierTable
        filteredInventory={filteredInventory}
        onRowClick={(row) => {
          navigate(`/dai-ly/nha-cung-cap/${row.id}`);
        }}
      />
    </div>
  );
}