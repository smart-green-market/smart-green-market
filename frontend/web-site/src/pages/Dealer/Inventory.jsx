import { useState } from "react";
import SupplierFilter from "../../components/Dealer/Supplier/SupplierFilter";
import InventoryTable from "../../components/Dealer/Inventory/InventoryTable";
import InventoryStatsCards from "../../components/Dealer/Inventory/InventoryStatsCards";
import InventoryHistoryTable from "../../components/Dealer/Inventory/InventoryHistoryTable";
import UpdateProductModal from "../../components/Dealer/Inventory/UpdateProductModal";

const INITIAL_INVENTORY = [
  {
    batchCode: "LÔ-CT01",
    productName: "Cải thìa hữu cơ",
    category: "Rau lá xanh",
    supplier: "Hợp tác xã Rau sạch Đà Lạt",
    importDate: "08/06/2026",
    expiryDate: "15/06/2026",
    stock: 45,
    unit: "kg",
    priceImport: "15,000 đ",
    priceRetail: "30,000 đ",
    status: "Còn hàng",
    freshness: "Tươi ngon (95%)",
    freshnessColor: "text-emerald-600 bg-emerald-50",
  },
  {
    batchCode: "LÔ-CC02",
    productName: "Cà chua bi vườn hữu cơ",
    category: "Quả hữu cơ",
    supplier: "Nông trại Xanh Lâm Đồng",
    importDate: "07/06/2026",
    expiryDate: "14/06/2026",
    stock: 8,
    unit: "kg",
    priceImport: "25,000 đ",
    priceRetail: "50,000 đ",
    status: "Sắp hết hàng",
    freshness: "Hơi héo (70%)",
    freshnessColor: "text-amber-600 bg-amber-50",
  },
  {
    batchCode: "LÔ-BC03",
    productName: "Bông cải xanh sạch",
    category: "Rau lá xanh",
    supplier: "Hợp tác xã Rau sạch Đà Lạt",
    importDate: "01/06/2026",
    expiryDate: "08/06/2026",
    stock: 0,
    unit: "kg",
    priceImport: "22,000 đ",
    priceRetail: "45,000 đ",
    status: "Hết hàng",
    freshness: "Hỏng/Hết hàng",
    freshnessColor: "text-red-600 bg-red-50",
  },
  {
    batchCode: "LÔ-KT04",
    productName: "Khoai tây vàng Đà Lạt",
    category: "Củ & Thân",
    supplier: "Nông trại Xanh Lâm Đồng",
    importDate: "05/06/2026",
    expiryDate: "25/06/2026",
    stock: 120,
    unit: "kg",
    priceImport: "12,000 đ",
    priceRetail: "20,000 đ",
    status: "Còn hàng",
    freshness: "Tươi ngon (100%)",
    freshnessColor: "text-emerald-600 bg-emerald-50",
  },
  {
    batchCode: "LÔ-NDG05",
    productName: "Nấm đùi gà hữu cơ",
    category: "Nấm & Thảo mộc",
    supplier: "Trại nấm Hữu cơ Minh Đức",
    importDate: "09/06/2026",
    expiryDate: "16/06/2026",
    stock: 15,
    unit: "kg",
    priceImport: "30,000 đ",
    priceRetail: "60,000 đ",
    status: "Còn hàng",
    freshness: "Tươi ngon (90%)",
    freshnessColor: "text-emerald-600 bg-emerald-50",
  },
  {
    batchCode: "LÔ-DT06",
    productName: "Dâu tây Đà Lạt chuẩn VietGAP",
    category: "Trái cây sạch",
    supplier: "Hợp tác xã Rau sạch Đà Lạt",
    importDate: "09/06/2026",
    expiryDate: "13/06/2026",
    stock: 4,
    unit: "kg",
    priceImport: "90,000 đ",
    priceRetail: "150,000 đ",
    status: "Sắp hết hàng",
    freshness: "Tươi ngon (85%)",
    freshnessColor: "text-emerald-600 bg-emerald-50",
  },
  {
    batchCode: "LÔ-OC07",
    productName: "Ớt chuông đỏ organic",
    category: "Quả hữu cơ",
    supplier: "Trại nấm Hữu cơ Minh Đức",
    importDate: "06/06/2026",
    expiryDate: "13/06/2026",
    stock: 25,
    unit: "kg",
    priceImport: "35,000 đ",
    priceRetail: "70,000 đ",
    status: "Còn hàng",
    freshness: "Tươi ngon (95%)",
    freshnessColor: "text-emerald-600 bg-emerald-50",
  },
  {
    batchCode: "LÔ-RLX08",
    productName: "Xà lách thủy canh",
    category: "Rau lá xanh",
    supplier: "Hợp tác xã Rau sạch Đà Lạt",
    importDate: "28/05/2026",
    expiryDate: "04/06/2026",
    stock: 0,
    unit: "kg",
    priceImport: "18,000 đ",
    priceRetail: "35,000 đ",
    status: "Hết hạn",
    freshness: "Đã quá hạn (0%)",
    freshnessColor: "text-red-700 bg-red-100",
  },
];
const transactionHistory = [
    {
      id: "TX-1092",
      type: "Xuất kho",
      batchCode: "LÔ-CT01",
      productName: "Cải thìa hữu cơ",
      quantity: 15,
      unit: "kg",
      date: "09/06/2026 14:30",
      performer: "Nguyễn Văn An",
      note: "Xuất sỉ cho đơn hàng BH-1092",
    },
    {
      id: "TX-1091",
      type: "Nhập kho",
      batchCode: "LÔ-NDG05",
      productName: "Nấm đùi gà hữu cơ",
      quantity: 15,
      unit: "kg",
      date: "09/06/2026 09:15",
      performer: "Trần Thị Bình",
      note: "Nhập hàng bổ sung từ Trại nấm Minh Đức",
    },
    {
      id: "TX-1090",
      type: "Xuất kho",
      batchCode: "LÔ-NDG05",
      productName: "Nấm đùi gà hữu cơ",
      quantity: 10,
      unit: "kg",
      date: "08/06/2026 16:45",
      performer: "Nguyễn Văn An",
      note: "Xuất sỉ cho đơn hàng BH-1090",
    },
    {
      id: "TX-1089",
      type: "Nhập kho",
      batchCode: "LÔ-CT01",
      productName: "Cải thìa hữu cơ",
      quantity: 60,
      unit: "kg",
      date: "08/06/2026 08:00",
      performer: "Trần Thị Bình",
      note: "Nhập kho lô hàng mới từ HTX Đà Lạt",
    },
    {
      id: "TX-1088",
      type: "Xuất kho",
      batchCode: "LÔ-RLX08",
      productName: "Xà lách thủy canh",
      quantity: 20,
      unit: "kg",
      date: "04/06/2026 11:20",
      performer: "Lê Hoàng Nam",
      note: "Hủy bỏ hàng hết hạn sử dụng",
    },
  ];

export default function DealerInventoryPage() {
  const [inventoryList, setInventoryList] = useState(INITIAL_INVENTORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  

  const filteredInventory = inventoryList.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filterOptions = [
    { label: "Tất cả", value: "", colorClass: "text-neutral-700" },
    { label: "Còn hàng", value: "Còn hàng", colorClass: "text-emerald-700" },
    {
      label: "Sắp hết hàng",
      value: "Sắp hết hàng",
      colorClass: "text-amber-700",
    },
    { label: "Hết hàng", value: "Hết hàng", colorClass: "text-red-700" },
    { label: "Hết hạn", value: "Hết hạn", colorClass: "text-red-900" },
  ];

  const handleSaveBatch = (updatedBatch) => {
    setInventoryList((prev) =>
      prev.map((item) =>
        item.batchCode === updatedBatch.batchCode ? updatedBatch : item
      )
    );
  };

  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      {/* Header & Stats Cards */}
      <InventoryStatsCards inventory={inventoryList} />

      {/* Bộ lọc và Tìm kiếm */}
      <SupplierFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        filterOptions={filterOptions}
        placeholder="Tìm kiếm lô hàng (Mã lô, tên nông sản, nhà cung cấp...)"
      />

      {/* Inventory Table Card */}
      <div className="mb-8">
        <InventoryTable
          data={filteredInventory}
          onRowClick={(row) => setSelectedRow(row)}
        />
        {selectedRow && (
          <UpdateProductModal
            data={selectedRow}
            onClose={() => setSelectedRow(null)}
            onSave={handleSaveBatch}
          />
        )}
      </div>

      {/* Lịch sử Nhập xuất kho */}
      <InventoryHistoryTable data={transactionHistory} />


      
    </div>
  );
}
