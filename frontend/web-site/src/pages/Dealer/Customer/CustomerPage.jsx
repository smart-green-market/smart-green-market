import { useState, useEffect } from "react";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
import CustomerHeader from "../../../components/Dealer/Customer/CustomerHeader";
import CustomerTable from "../../../components/Dealer/Customer/CustomerTable";
import CustomerLoyaltyModal from "../../../components/Dealer/Customer/CustomerLoyaltyModal";
import { customerService } from "../../../services/api/customerService";
import { dealerOrderService } from "../../../services/api/dealerOrderService";
import { useAuth } from "../../../contexts/authProvider";
import { toast } from "sonner";

export default function DealerCustomerPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customers, setCustomers] = useState([]);
  const [countStatus, setCountStatus] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: 10,
    hasMore: false,
  });
  const [selectedLoyaltyCustomer, setSelectedLoyaltyCustomer] = useState(null);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearchQuery !== searchQuery) {
        setDebouncedSearchQuery(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearchQuery]);

  useEffect(() => {
    fetchCustomers(1);
  }, [debouncedSearchQuery, statusFilter]);

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const [data, ordersData] = await Promise.all([
        customerService.getAll({ page, page_size: 10, search: debouncedSearchQuery, status: statusFilter }),
        dealerOrderService.getAll({ page: 1, page_size: 1 }).catch(() => null)
      ]);
      setCustomers(data.results || []);
      setPagination({
        count: data.count || 0,
        page: data.page || 1,
        pageSize: data.page_size || 10,
        hasMore: data.has_more || false,
      });
      if (ordersData) {
        setTotalOrders(ordersData.count || 0);
      }

      if (data.count_status) {
        setCountStatus(data.count_status);
      } else {
        setCountStatus(null);
      }

      const count = data.count || 0;
      if (statusFilter === "") {
        setTotalCount(count);
      } else if (data.count_status) {
        setTotalCount(Object.values(data.count_status).reduce((sum, val) => sum + (val || 0), 0));
      }
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

  const handleUpdateDays = async (days) => {
    if (!days || Number(days) <= 0) {
      toast.warning("Vui lòng nhập số ngày hợp lệ (> 0) để phân khúc.");
      return;
    }

    const dealerId = user?.dealer_profile?.id;
    if (!dealerId) {
      toast.error("Không tìm thấy thông tin đại lý. Vui lòng đăng nhập lại.");
      return;
    }

    const toastId = toast.loading("Đang chạy pipeline AI phân khúc khách hàng...");
    try {
      const res = await customerService.runSegmentation(dealerId, days);
      if (res.success) {
        toast.success(res.message || "Phân khúc khách hàng thành công!", { id: toastId });
        // Tải lại danh sách khách hàng sau khi cập nhật phân khúc
        fetchCustomers(1);
      } else {
        toast.error(res.message || "Phân khúc khách hàng thất bại.", { id: toastId });
      }
    } catch (err) {
      console.error("Lỗi khi chạy phân khúc khách hàng:", err);
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Đã có lỗi xảy ra khi chạy phân khúc khách hàng.",
        { id: toastId }
      );
    }
  };

  const filterOptions = [
    { label: "Tất cả", value: "", colorClass: "text-neutral-700" },
    { label: "Hoạt động", value: "active", colorClass: "text-emerald-700" },
    { label: "Không hoạt động", value: "inactive", colorClass: "text-neutral-600" },
    { label: "Bị cấm", value: "banned", colorClass: "text-red-700" },
    { label: "Chờ duyệt", value: "pending", colorClass: "text-amber-700" },
  ];

  const filteredCustomers = customers;

  return (
    <div className="p-6 bg-neutral-50/50 min-h-screen font-['Geist',sans-serif]">

      {/* Header & Stats */}
      <CustomerHeader
        loading={loading}
        pagination={pagination}
        customers={customers}
        onExport={handleExport}
        onAdd={handleAddCustomer}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        countStatus={countStatus}
        totalCount={totalCount}
        totalOrders={totalOrders}
        onUpdateDays={handleUpdateDays}
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
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <CustomerTable
          loading={loading}
          error={error}
          customers={filteredCustomers}
          pagination={pagination}
          onPageChange={fetchCustomers}
          onRetry={() => fetchCustomers(pagination.page)}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onViewLoyalty={(customer) => {
            setSelectedLoyaltyCustomer(customer);
            setIsLoyaltyOpen(true);
          }}
        />
      )}

      <CustomerLoyaltyModal
        customer={selectedLoyaltyCustomer}
        isOpen={isLoyaltyOpen}
        onClose={() => {
          setIsLoyaltyOpen(false);
          setSelectedLoyaltyCustomer(null);
        }}
        onSuccess={() => fetchCustomers(pagination.page)}
      />

    </div>
  );
}
