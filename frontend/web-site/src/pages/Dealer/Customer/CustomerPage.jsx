import { useState, useEffect } from "react";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
import CustomerHeader from "../../../components/Dealer/Customer/CustomerHeader";
import CustomerTable from "../../../components/Dealer/Customer/CustomerTable";
import { customerService } from "../../../services/api/customerService";

export default function DealerCustomerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: 20,
    hasMore: false,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getAll({ page, page_size: 20 });
      setCustomers(data.results || []);
      setPagination({
        count: data.count || 0,
        page: data.page || 1,
        pageSize: data.page_size || 20,
        hasMore: data.has_more || false,
      });
    } catch (err) {
      console.error("Lỗi khi tải danh sách khách hàng:", err);
      setError("Không thể tải danh sách khách hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    console.log("Xuất báo cáo khách hàng...");
  };

  const handleAddCustomer = () => {
    console.log("Thêm khách hàng mới...");
  };

  const filterOptions = [
    { label: "Tất cả trạng thái", value: "", colorClass: "text-neutral-700" },
    { label: "Hoạt động", value: "active", colorClass: "text-emerald-700" },
    { label: "Ngừng hoạt động", value: "inactive", colorClass: "text-neutral-600" },
    { label: "Bị khóa", value: "banned", colorClass: "text-red-700" },
  ];

  const filteredCustomers = customers.filter(customer => {
    const name = customer.full_name || "";
    const phone = customer.phone || "";
    const email = customer.email || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-neutral-50/50 min-h-screen font-['Geist',sans-serif]">
      
      {/* Header & Stats */}
      <CustomerHeader
        loading={loading}
        pagination={pagination}
        customers={customers}
        onExport={handleExport}
        onAdd={handleAddCustomer}
      />

      <SupplierFilter 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        filterOptions={filterOptions}
        placeholder="Tìm kiếm khách hàng (tên, email, số điện thoại)..."
      />

      {/* Table Section */}
      <CustomerTable
        loading={loading}
        error={error}
        customers={filteredCustomers}
        pagination={pagination}
        onPageChange={fetchCustomers}
        onRetry={() => fetchCustomers(pagination.page)}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
      />

    </div>
  );
}
