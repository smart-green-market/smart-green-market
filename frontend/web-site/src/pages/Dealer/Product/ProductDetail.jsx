import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, PackageSearch } from "lucide-react";
import ProductDetailInfo from "../../../components/Dealer/Product/ProductDetailInfo";
import ProductGallery from "../../../components/Dealer/Product/ProductGallery";
import ProductInventoryBatches from "../../../components/Dealer/Product/ProductInventoryBatches";
import ProductSalesHistory from "../../../components/Dealer/Product/ProductSalesHistory";
import { dealerProductService } from "../../../services/api/dealerProductService";
import { dealerInventoryService } from "../../../services/api/dealerInventoryService";
import { toast } from "sonner";

export default function DealerProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [batches, setBatches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productData, batchesData, txData] = await Promise.all([
        dealerProductService.getById(id),
        dealerInventoryService.getBatches().catch(() => ({ results: [] })),
        dealerInventoryService.getTransactions().catch(() => ({ results: [] }))
      ]);

      setProduct(productData);

      // Lọc lô hàng theo sản phẩm
      const filteredBatches = (batchesData.results || batchesData || []).filter(
        b => String(b.dealer_product) === String(id) || String(b.dealer_product_id) === String(id)
      );
      setBatches(filteredBatches);

      // Lấy danh sách mã lô của sản phẩm này để lọc giao dịch
      const batchCodes = filteredBatches.map(b => b.batch_number);

      // Lọc giao dịch
      const filteredTx = (txData.results || txData || []).filter(
        tx => batchCodes.includes(tx.batch_number)
      );
      setTransactions(filteredTx);
      
    } catch (error) {
      console.error("Lỗi tải chi tiết sản phẩm:", error);
      toast.error("Không thể tải thông tin sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleUpdateProduct = (updatedProduct) => {
    setProduct(updatedProduct);
  };

  const handleUpdateGallery = () => {
    // Tải lại toàn bộ data hoặc chỉ gọi getById
    fetchData();
  };

  if (loading) {
    return (
      <div className="p-6 bg-emerald-50/15 min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 bg-emerald-50/15 min-h-screen flex flex-col justify-center items-center">
        <p className="text-neutral-500 mb-4">Không tìm thấy sản phẩm.</p>
        <button onClick={() => navigate(-1)} className="text-emerald-600 font-bold hover:underline">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/dai-ly/san-pham")}
          className="p-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-emerald-600" /> Chi tiết Sản phẩm trên Shop
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-neutral-800">{product.title}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              product.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"
            }`}>
              {product.status === "active" ? "Đang hiển thị" : "Đang ẩn"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6">
        {/* Hàng 1: Info (2/3) + Gallery (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProductDetailInfo product={product} onUpdate={handleUpdateProduct} />
          </div>
          <div className="lg:col-span-1">
            <ProductGallery product={product} onUpdate={handleUpdateGallery} />
          </div>
        </div>

        {/* Hàng 2: Lô hàng & Lịch sử
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProductInventoryBatches batches={batches} />
          <ProductSalesHistory transactions={transactions} />
        </div> */}
      </div>
    </div>
  );
}
