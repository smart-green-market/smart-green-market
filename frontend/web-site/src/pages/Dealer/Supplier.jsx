import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SupplierStatsCards from "../../components/Dealer/Supplier/SupplierStatsCards";
import SupplierFilter from "../../components/Dealer/Supplier/SupplierFilter";
import SupplierTable from "../../components/Dealer/Supplier/SupplierTable";


export default function DealerSupplierPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const suppliers = [
    {
      id: 1,
      name: "Hợp tác xã Rau sạch Đà Lạt",
      contact: "Nguyễn Văn Hùng",
      phone: "0912.345.678",
      address: "Đà Lạt, Lâm Đồng",
      rating: 5,
      items: "Cải thìa, Bông cải, Cà chua",
      status: "Đang hợp tác",
    },
    {
      id: 2,
      name: "Nông trại Xanh Lâm Đồng",
      contact: "Trần Thị Lan",
      phone: "0987.654.321",
      address: "Đức Trọng, Lâm Đồng",
      rating: 4.8,
      items: "Khoai tây, Cà rốt",
      status: "Đang hợp tác",
    },
    {
      id: 3,
      name: "Trại nấm Hữu cơ Minh Đức",
      contact: "Phạm Minh Đức",
      phone: "0903.111.222",
      address: "Củ Chi, TP. HCM",
      rating: 4.5,
      items: "Nấm đùi gà, Nấm rơm",
      status: "Đang hợp tác",
    },
    {
      id: 4,
      name: "Vườn cây ăn trái hữu cơ Miền Tây",
      contact: "Lê Hoàng Nam",
      phone: "0944.555.666",
      address: "Phong Điền, Cần Thơ",
      rating: 4.2,
      items: "Bưởi da xanh",
      status: "Chưa hợp tác",
    },
    {
      id: 5,
      name: "Hợp tác xã Rau sạch Đà Lạt",
      contact: "Nguyễn Văn Hùng",
      phone: "0912.345.678",
      address: "Đà Lạt, Lâm Đồng",
      rating: 5,
      items: "Cải thìa, Bông cải, Cà chua",
      status: "Đang hợp tác",
    },
    {
      id: 6,
      name: "Nông trại Xanh Lâm Đồng",
      contact: "Trần Thị Lan",
      phone: "0987.654.321",
      address: "Đức Trọng, Lâm Đồng",
      rating: 4.8,
      items: "Khoai tây, Cà rốt",
      status: "Đang hợp tác",
    },
    {
      id: 7,
      name: "Trại nấm Hữu cơ Minh Đức",
      contact: "Phạm Minh Đức",
      phone: "0903.111.222",
      address: "Củ Chi, TP. HCM",
      rating: 4.5,
      items: "Nấm đùi gà, Nấm rơm",
      status: "Đang hợp tác",
    },
    {
      id: 8,
      name: "Vườn cây ăn trái hữu cơ Miền Tây",
      contact: "Lê Hoàng Nam",
      phone: "0944.555.666",
      address: "Phong Điền, Cần Thơ",
      rating: 4.2,
      items: "Bưởi da xanh",
      status: "Chưa hợp tác",
    },
    {
      id: 9,
      name: "Hợp tác xã Rau sạch Đà Lạt",
      contact: "Nguyễn Văn Hùng",
      phone: "0912.345.678",
      address: "Đà Lạt, Lâm Đồng",
      rating: 5,
      items: "Cải thìa, Bông cải, Cà chua",
      status: "Đang hợp tác",
    },
    {
      id: 10,
      name: "Nông trại Xanh Lâm Đồng",
      contact: "Trần Thị Lan",
      phone: "0987.654.321",
      address: "Đức Trọng, Lâm Đồng",
      rating: 4.8,
      items: "Khoai tây, Cà rốt",
      status: "Đang hợp tác",
    },
    {
      id: 11,
      name: "Trại nấm Hữu cơ Minh Đức",
      contact: "Phạm Minh Đức",
      phone: "0903.111.222",
      address: "Củ Chi, TP. HCM",
      rating: 4.5,
      items: "Nấm đùi gà, Nấm rơm",
      status: "Đang hợp tác",
    },
    {
      id: 12,
      name: "Vườn cây ăn trái hữu cơ Miền Tây",
      contact: "Lê Hoàng Nam",
      phone: "0944.555.666",
      address: "Phong Điền, Cần Thơ",
      rating: 4.2,
      items: "Bưởi da xanh",
      status: "Chưa hợp tác",
    },
  ];

  const filteredInventory = suppliers.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const filterOptions = [
    { label: "Tất cả", value: "", colorClass: "text-neutral-700" },
    { label: "Đang hợp tác", value: "Đang hợp tác", colorClass: "text-emerald-700" },
    { label: "Ngừng hợp tác", value: "Ngừng hợp tác", colorClass: "text-amber-700" },
    { label: "Chưa hợp tác", value: "Chưa hợp tác", colorClass: "text-red-700" },
  ];
const navigate = useNavigate();


  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      {/* Header */}
      <SupplierStatsCards suppliers={suppliers} />

      {/* Bộ lọc và Tìm kiếm */}
      <SupplierFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        filterOptions = {filterOptions}
      />

      {/* Bảng Dữ liệu */}
      <SupplierTable
      filteredInventory={
        filteredInventory}
        onRowClick={(row) => {navigate(`/dai-ly/nha-cung-cap/${row.id}`)}}



      />
      
    </div>
  );
}
