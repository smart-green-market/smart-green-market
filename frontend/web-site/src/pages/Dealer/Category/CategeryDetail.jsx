import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CategoryInfoCard from "../../../components/Dealer/Category/CategoryInfoCard";
import CategoryProductList from "../../../components/Dealer/Category/CategoryProductList";
import { categoryService, handleApiError } from "../../../services/api/categoryService";


export default function DealerCategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryDetail = async () => {
      setIsLoading(true);
      try {
        const data = await categoryService.getById(id);
        setCategory({
          ...data,
          code: data.code || `CAT-${data.id}`,
          status: data.status === "active" ? "Đang kinh doanh" : "Tạm ngưng"
        });
      } catch (err) {
        setError(handleApiError(err, "Không thể tải chi tiết danh mục"));
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) fetchCategoryDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif] flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
        <div className="mb-6">
          <button
            onClick={() => navigate("/dai-ly/danh-muc")}
            className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-all w-fit cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh mục
          </button>
        </div>
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          {error || "Danh mục không tồn tại"}
        </div>
      </div>
    );
  }

  // Lọc sản phẩm thuộc danh mục này
  const categoryProducts = category.products || [];

  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      {/* Điều hướng Breadcrumb */}
      <div className="mb-6 flex flex-col gap-2">
        <button
          onClick={() => navigate("/dai-ly/danh-muc")}
          className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-all w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh mục
        </button>
        <div className="text-xs text-neutral-400 flex items-center gap-1.5 mt-1">
          <span>Đại lý</span>
          <span>/</span>
          <span>Danh mục</span>
          <span>/</span>
          <span className="text-emerald-950 font-medium">{category.name}</span>
        </div>
      </div>

      {/* Thông tin Danh mục Component */}
      <CategoryInfoCard category={category} />

      {/* Danh sách sản phẩm của danh mục Component */}
      <CategoryProductList products={categoryProducts} />
    </div>
  );
}
