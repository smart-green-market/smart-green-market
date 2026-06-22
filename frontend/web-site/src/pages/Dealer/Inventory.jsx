import { useState, useEffect } from "react";
import { dealerInventoryService } from "../../services/api/dealerInventoryService";
import { dealerProductService } from "../../services/api/dealerProductService";
import SupplierFilter from "../../components/Dealer/Supplier/SupplierFilter";
import InventoryTable from "../../components/Dealer/Inventory/InventoryTable";
import InventoryStatsCards from "../../components/Dealer/Inventory/InventoryStatsCards";
import InventoryHistoryTable from "../../components/Dealer/Inventory/InventoryHistoryTable";
import UpdateProductModal from "../../components/Dealer/Inventory/UpdateProductModal";


export default function DealerInventoryPage() {
  const [inventoryList, setInventoryList] = useState([]); // Danh sách lô hàng đã được map dữ liệu đầy đủ
  const [transactionList, setTransactionList] = useState([]); // Lịch sử giao dịch kho (Nhập, xuất, hao hụt...)
  const [searchQuery, setSearchQuery] = useState(""); // Từ khóa tìm kiếm lô hàng
  const [statusFilter, setStatusFilter] = useState(""); // Bộ lọc trạng thái lô hàng (Còn hàng, Hết hàng...)
  const [selectedRow, setSelectedRow] = useState(null); // Lô hàng đang được chọn để cập nhật (mở modal)
  const [loading, setLoading] = useState(true); // Trạng thái tải dữ liệu

  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryTotalPages, setInventoryTotalPages] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionTotalPages, setTransactionTotalPages] = useState(1);

  // Gọi API danh sách lô hàng
  useEffect(() => {
    fetchInventory();
  }, [inventoryPage, searchQuery, statusFilter]);

  // Gọi API lịch sử giao dịch
  useEffect(() => {
    fetchTransactions();
  }, [transactionPage]);

  /**
   * Tải danh sách lô hàng tồn kho từ backend và map thêm dữ liệu từ danh mục sản phẩm đại lý
   */
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [data, productsData] = await Promise.all([
        dealerInventoryService.getBatches({ page: inventoryPage, page_size: 10, search: searchQuery, status: statusFilter }),
        dealerProductService.getAll().catch(() => []) 
      ]);
      const batches = data.results || data || [];
      setInventoryTotalPages(Math.max(1, Math.ceil((data.count || batches.length) / 10)));

      // Ánh xạ dữ liệu lô hàng với sản phẩm đại lý tương ứng để hiển thị thông tin đầy đủ nhất
      const mappedInventory = batches.map(batch => {
        // Tìm sản phẩm đại lý khớp với dealer_product của lô hàng để lấy giá bán lẻ
        const matchedProduct = productsData.find(
          p => String(p.id) === String(batch.dealer_product)
        );

        // Lấy thông tin trực tiếp từ lô hàng của backend (như cấu trúc JSON trả về)
        const categoryName = batch.category ? batch.category.name : "---";
        const supplierName = batch.supplier_name || "---";
        const unitName = batch.supplier_product_unit || "kg";
        const retailPriceRaw = matchedProduct?.retail_price;

        const priceRetail = retailPriceRaw
          ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(retailPriceRaw)
          : "N/A";

        // Trả về đối tượng lô hàng đã được format thân thiện với UI table
        return {
          batchCode: batch.batch_number, // Mã lô hàng
          productName: batch.dealer_product_title, // Tên nông sản
          category: categoryName, // Tên danh mục nông sản
          supplier: supplierName, // Tên nhà cung cấp nông sản
          importDate: batch.import_date ? new Date(batch.import_date).toLocaleDateString("vi-VN") : "N/A", // Ngày nhập kho
          expiryDate: batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString("vi-VN") : "N/A", // Hạn sử dụng
          stock: batch.remaining_quantity, // Số lượng tồn kho hiện tại
          unit: unitName, // Đơn vị tính
          priceImport: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(batch.import_price), // Giá nhập kho
          priceRetail: priceRetail, // Giá bán lẻ đại lý tự cấu hình
          status: batch.remaining_quantity > 0 ? "Còn hàng" : "Hết hàng", // Trạng thái tồn kho
          freshness: "N/A",
          freshnessColor: "text-neutral-600 bg-neutral-50",
          originalData: batch // Lưu giữ toàn bộ data gốc của lô hàng để dùng cho các tác vụ cập nhật
        };
      });
      setInventoryList(mappedInventory);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tải danh sách lịch sử giao dịch nhập/xuất/hao hụt của kho hàng
   */
  const fetchTransactions = async () => {
    try {
      const data = await dealerInventoryService.getTransactions({ page: transactionPage, page_size: 10 });
      const transactions = data.results || data;
      setTransactionTotalPages(Math.max(1, Math.ceil((data.count || transactions.length) / 10)));

      // Định nghĩa tên loại giao dịch sang tiếng Việt hiển thị trên UI
      const typeMapping = {
        "import": "Nhập kho",
        "sale": "Bán hàng",
        "wastage": "Hao hụt",
        "adjustment": "Điều chỉnh"
      };

      // Định dạng danh sách giao dịch
      const mappedTransactions = transactions.map(tx => ({
        id: `TX-${tx.id}`, // Mã giao dịch hiển thị
        type: typeMapping[tx.type] || tx.type, // Loại giao dịch Việt hóa
        isImport: tx.quantity_change > 0, // Nhận biết nhập hay xuất kho
        batchCode: tx.batch_number, // Mã lô hàng liên quan
        productName: "Nông sản", // Tên sản phẩm tạm thời (API này không trả về tên sản phẩm trực tiếp)
        quantity: Math.abs(tx.quantity_change), // Số lượng thay đổi (dùng giá trị tuyệt đối)
        unit: "kg",
        date: tx.created_at ? new Date(tx.created_at).toLocaleString("vi-VN", {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }) : "N/A", // Thời gian giao dịch phát sinh
        performer: tx.created_by_username || "Hệ thống", // Người thực hiện giao dịch
        note: tx.reason || "Không có ghi chú", // Lý do giao dịch (ghi nhận hao hụt, điều chỉnh...)
        originalData: tx
      }));
      setTransactionList(mappedTransactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  // Logic lọc dữ liệu cục bộ (chỉ áp dụng trên kết quả của trang hiện tại nếu backend chưa hỗ trợ query param search/status)
  const filteredInventory = inventoryList.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Cấu hình các tùy chọn bộ lọc trạng thái tồn kho
  const filterOptions = [
    { label: "Tất cả", value: "", colorClass: "text-neutral-700" },
    { label: "Còn hàng", value: "Còn hàng", colorClass: "text-emerald-700" },
    { label: "Sắp hết hàng", value: "Sắp hết hàng", colorClass: "text-amber-700" },
    { label: "Hết hàng", value: "Hết hàng", colorClass: "text-red-700" },
    { label: "Hết hạn", value: "Hết hạn", colorClass: "text-red-900" },
  ];

  /**
   * Xử lý sau khi lưu cập nhật lô hàng trong Modal (hao hụt tồn kho, khuyến mãi, danh mục)
   */
  const handleSaveBatch = async (updatedBatch) => {
    // Nếu có dữ liệu ghi nhận hao hụt sản phẩm, gọi API lưu thông tin hao hụt
    if (updatedBatch.wastageData && updatedBatch.originalData?.id) {
      try {
        await dealerInventoryService.recordWastage(
          updatedBatch.originalData.id,
          updatedBatch.wastageData
        );
      } catch (error) {
        console.error("Lỗi khi ghi nhận hao hụt:", error);
      }
    }

    // Tải lại toàn bộ dữ liệu mới nhất từ server để đồng bộ và cập nhật UI chính xác
    await fetchInventory();
    await fetchTransactions();
  };

  // Trạng thái chờ tải dữ liệu ban đầu
  if (loading) {
    return (
      <div className="p-6 bg-emerald-50/15 min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // --- Render Giao diện ---
  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      {/* 1. Phần thống kê số liệu kho (Thẻ KPI: Tổng lô hàng, tồn kho, giá trị...) */}
      <InventoryStatsCards inventory={inventoryList} />

      {/* 2. Bộ lọc kết hợp tìm kiếm và chọn nhanh trạng thái hàng */}
      <SupplierFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        filterOptions={filterOptions}
        placeholder="Tìm kiếm lô hàng (Mã lô, tên nông sản, nhà cung cấp...)"
      />

      {/* 3. Bảng dữ liệu chi tiết danh sách lô hàng trong kho */}
      <div className="mb-8">
        <InventoryTable
          data={filteredInventory}
          onRowClick={(row) => setSelectedRow(row)}
          currentPage={inventoryPage}
          totalPages={inventoryTotalPages}
          onPageChange={setInventoryPage}
        />

        {/* Modal Cập nhật Lô hàng (chỉ mở khi có lô hàng được chọn) */}
        {selectedRow && (
          <UpdateProductModal
            data={selectedRow}
            onClose={() => setSelectedRow(null)}
            onSave={handleSaveBatch}
          />
        )}
      </div>

      {/* 4. Bảng danh sách ghi nhận lịch sử nhập xuất hao hụt kho */}
      <InventoryHistoryTable 
        data={transactionList} 
        currentPage={transactionPage}
        totalPages={transactionTotalPages}
        onPageChange={setTransactionPage}
      />

    </div>
  );
}
