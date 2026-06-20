import { useState, useEffect } from "react";
import { PackageSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
import ProductStatsCards from "../../../components/Dealer/Product/ProductStatsCards";
import ProductTable from "../../../components/Dealer/Product/ProductTable";

import ProductPreviewModal from "../../../components/Dealer/Product/ProductPreviewModal";
import { dealerProductService } from "../../../services/api/dealerProductService";

export default function DealerProductManagementPage() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [previewProduct, setPreviewProduct] = useState(null);

  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await dealerProductService.getAll();
      setProducts(data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách sản phẩm", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((item) => {
    const matchesSearch =
      (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier_product_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filterOptions = [
    { label: "Tất cả", value: "", colorClass: "text-neutral-700" },
    { label: "Đang hiển thị", value: "active", colorClass: "text-emerald-700" },
    { label: "Đã ẩn", value: "inactive", colorClass: "text-neutral-500" },
  ];

  const handleRowClick = (row) => {
    navigate(`/dai-ly/san-pham/${row.id}`);
  };



  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-emerald-600" /> Quản Lý Sản Phẩm Shop
          </h1>
          <p className="text-sm text-emerald-800/70 mt-1">
            Chỉnh sửa thông tin, hình ảnh và trạng thái hiển thị của các sản phẩm trên cửa hàng đại lý.
          </p>
        </div>
        {/* Nút thêm mới thủ công (nếu có nghiệp vụ) hoặc sync */}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <>
          <ProductStatsCards products={products} />

          <SupplierFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            filterOptions={filterOptions}
            placeholder="Tìm theo tên sản phẩm..."
          />

          <ProductTable
            data={filteredProducts}
            onRowClick={handleRowClick}
          />
        </>
      )}

      {/* Modals */}

      {/* Nếu muốn mở Preview từ một action nào đó thì dùng modal này, tạm thời đang chuyển hướng sang chi tiết */}
      {previewProduct && (
        <ProductPreviewModal
          data={previewProduct}
          onClose={() => setPreviewProduct(null)}
        />
      )}
    </div>
  );
}
