import { useState, useEffect } from "react";
import { dealerInventoryService } from "../../services/api/dealerInventoryService";
import SupplierFilter from "../../components/Dealer/Supplier/SupplierFilter";
import InventoryTable from "../../components/Dealer/Inventory/InventoryTable";
import InventoryStatsCards from "../../components/Dealer/Inventory/InventoryStatsCards";
// import InventoryHistoryTable from "../../components/Dealer/Inventory/InventoryHistoryTable";
import UpdateProductModal from "../../components/Dealer/Inventory/UpdateProductModal";



export default function DealerInventoryPage() {
  const [inventoryList, setInventoryList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const data = await dealerInventoryService.getBatches();
      const batches = data.results || data;
      const mappedInventory = batches.map(batch => ({
        batchCode: batch.batch_number,
        productName: batch.dealer_product_title,
        category: "---", // Cập nhật sau nếu có thông tin từ API
        supplier: "---", // Cập nhật sau nếu có thông tin từ API
        importDate: batch.import_date ? new Date(batch.import_date).toLocaleDateString("vi-VN") : "N/A",
        expiryDate: batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString("vi-VN") : "N/A",
        stock: batch.remaining_quantity,
        unit: "kg", // Có thể cần cập nhật từ API nếu có
        priceImport: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(batch.import_price),
        priceRetail: "---", // Cập nhật sau nếu có
        status: batch.remaining_quantity > 0 ? "Còn hàng" : "Hết hàng",
        freshness: "N/A",
        freshnessColor: "text-neutral-600 bg-neutral-50",
        originalData: batch // Lưu lại data gốc nếu cần
      }));
      setInventoryList(mappedInventory);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
  };

  

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
      {/* <InventoryHistoryTable data={transactionHistory} /> */}


      
    </div>
  );
}
