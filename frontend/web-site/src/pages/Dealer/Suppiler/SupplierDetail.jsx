import  { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SupplierInfoCard from "../../../components/Dealer/Supplier/SupplierInfoCard";
import SupplierProductList from "../../../components/Dealer/Supplier/SupplierProductList";
import { supplierService } from "../../../services/api/suppilerService";



const AVATAR_COLORS = [
  "bg-emerald-500",
  "bg-teal-500",
  "bg-lime-600",
  "bg-green-600",
  "bg-emerald-600",
];
const mapSupplierInfo = (data) => {
  if (!data || typeof data !== "object") return null;
  const contact = data.contact ?? {};

  const formatScale = () => {
    const cap = parseFloat(data.total_daily_production_capacity);
    if (!isNaN(cap) && cap > 0) {
      return `${cap.toLocaleString("vi-VN")} kg/tháng`;
    }
    return `${data.active_product_count ?? 0} sản phẩm đang kinh doanh`;
  };

  return {
    company_name: data.company_name ?? "—",
    avatarColor: AVATAR_COLORS[(data.id ?? 0) % AVATAR_COLORS.length],
    avatarUrl: contact.avatar_url ?? null,
    contactName: contact.full_name ?? "—",
    phone: data.phone ?? "—",
    email: contact.email ?? "—",
    description: data.description ?? "",
    address: data.address ?? "—",
    certifications: Array.isArray(data.certifications)
      ? data.certifications.map((c) => (typeof c === "string" ? c : c?.name)).filter(Boolean)
      : [],
    scale: formatScale(),
    taxCode: data.tax_code ?? "",
  };
};

const mapProductsList = (apiData) => {
  if (!apiData) return [];
  const results = Array.isArray(apiData) ? apiData : (apiData.results ?? []);

  return results.map((product) => {
    if (!product) return null;
    const thumbnail = product.images?.find((img) => img.is_thumbnail) ?? product.images?.[0];
    const price = parseFloat(product.wholesale_price);

    return {
      name: product.name ?? "—",
      category: product.category?.name ?? "—",
      status: product.status === "active" ? "Đang kinh doanh" : "Tạm ngưng",
      image: thumbnail?.image_url ?? "",
      unit: product.unit ?? "—",
      price: !isNaN(price) && price > 0
        ? `${price.toLocaleString("vi-VN")} đ`
        : "Liên hệ",
    };
  }).filter(Boolean);
};

export default function DealerSupplierDetailPage() {
  const { id } = useParams(); // Lấy ID của nhà cung cấp từ URL (ví dụ: /dai-ly/nha-cung-cap/3)
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy thông tin chi tiết và danh sách sản phẩm của nhà cung cấp
  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      const [supplierInfo, productsResponse] = await Promise.all([
        supplierService.getById(id).catch((err) => {
          console.error("Lỗi khi tải thông tin nhà cung cấp:", err);
          return null;
        }),
        supplierService.getProductById(id).catch((err) => {
          console.error("Lỗi khi tải sản phẩm nhà cung cấp:", err);
          return null;
        }),
      ]);

      setSupplier(mapSupplierInfo(supplierInfo));
      setProducts(mapProductsList(productsResponse));
    } catch (error) {
      console.error("Lỗi khi tải chi tiết nhà cung cấp:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 bg-emerald-50/15 min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Trường hợp không tìm thấy nhà cung cấp (hoặc lỗi gọi API)
  if (!supplier) {
    return (
      <div className="p-6 text-center text-red-500 font-bold">
        Không tìm thấy thông tin nhà cung cấp hoặc có lỗi xảy ra.
      </div>
    );
  }

  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
        {/* Nút quay lại và Breadcrumb */}
        <div className="mb-6 flex flex-col gap-2">
          <button
            onClick={() => navigate("/dai-ly/nha-cung-cap")}
            className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-all w-fit cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
          <div className="text-xs text-neutral-400 flex items-center gap-1.5 mt-1">
            <span>Đại lý</span>
            <span>/</span>
            <span>Nhà cung cấp</span>
            <span>/</span>
            <span className="text-emerald-950 font-medium">{supplier.name}</span>
          </div>
        </div>

        {/* Hiển thị Component thông tin chi tiết nhà cung cấp */}
        <SupplierInfoCard supplier={supplier} />

        {/* Hiển thị danh sách sản phẩm của nhà cung cấp đó */}
        <SupplierProductList products={products} />
      </div>
  );
}