import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CategoryInfoCard from "../../components/Dealer/Category/CategoryInfoCard";
import CategoryProductList from "../../components/Dealer/Category/CategoryProductList";

const MOCK_CATEGORIES = [
  {
    name: "Rau lá xanh",
    code: "CAT-RLX",
    description: "Các loại rau ăn lá như cải thìa, cải ngọt, xà lách, rau muống hữu cơ.",
    count: "18 sản phẩm",
    status: "Đang kinh doanh"
  },
  {
    name: "Quả hữu cơ",
    code: "CAT-QHC",
    description: "Cà chua bi, ớt chuông, dưa leo Baby, bí ngòi được trồng tự nhiên.",
    count: "12 sản phẩm",
    status: "Đang kinh doanh"
  },
  {
    name: "Củ & Thân",
    code: "CAT-CT",
    description: "Khoai tây, cà rốt Đà Lạt, củ cải đường, khoai lang mật sạch.",
    count: "15 sản phẩm",
    status: "Đang kinh doanh"
  },
  {
    name: "Nấm & Thảo mộc",
    code: "CAT-NTM",
    description: "Nấm đùi gà, nấm rơm, nấm kim châm, hành lá, ngò rí tươi.",
    count: "8 sản phẩm",
    status: "Đang kinh doanh"
  },
  {
    name: "Trái cây sạch",
    code: "CAT-TCS",
    description: "Dâu tây Đà Lạt, táo mật sạch nhập vườn, bơ sáp Đắk Lắk.",
    count: "10 sản phẩm",
    status: "Tạm ngưng"
  }
];

const ALL_PRODUCTS = [
  {
    code: "SP-001",
    name: "Cải thìa hữu cơ",
    image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=120&auto=format&fit=crop&q=60",
    category: "Rau lá xanh",
    unit: "kg",
    price: "30,000 đ",
    status: "Đang kinh doanh",
    supplier: "Hợp tác xã Rau sạch Đà Lạt"
  },
  {
    code: "SP-002",
    name: "Bông cải xanh sạch",
    image: "https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=120&auto=format&fit=crop&q=60",
    category: "Rau lá xanh",
    unit: "kg",
    price: "45,000 đ",
    status: "Đang kinh doanh",
    supplier: "Hợp tác xã Rau sạch Đà Lạt"
  },
  {
    code: "SP-005",
    name: "Xà lách thủy canh",
    image: "https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=120&auto=format&fit=crop&q=60",
    category: "Rau lá xanh",
    unit: "kg",
    price: "35,000 đ",
    status: "Tạm ngưng",
    supplier: "Hợp tác xã Rau sạch Đà Lạt"
  },
  {
    code: "SP-014",
    name: "Cải ngọt chuẩn VietGAP",
    image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=120&auto=format&fit=crop&q=60",
    category: "Rau lá xanh",
    unit: "kg",
    price: "24,000 đ",
    status: "Đang kinh doanh",
    supplier: "Hợp tác xã Rau sạch Đà Lạt"
  },
  {
    code: "SP-015",
    name: "Rau muống hạt hữu cơ",
    image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=120&auto=format&fit=crop&q=60",
    category: "Rau lá xanh",
    unit: "kg",
    price: "20,005 đ",
    status: "Đang kinh doanh",
    supplier: "Hợp tác xã Rau sạch Đà Lạt"
  },
  {
    code: "SP-003",
    name: "Cà chua bi hữu cơ",
    image: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=120&auto=format&fit=crop&q=60",
    category: "Quả hữu cơ",
    unit: "kg",
    price: "50,000 đ",
    status: "Đang kinh doanh",
    supplier: "Hợp tác xã Rau sạch Đà Lạt"
  },
  {
    code: "SP-006",
    name: "Cà chua bi vườn hữu cơ",
    image: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=120&auto=format&fit=crop&q=60",
    category: "Quả hữu cơ",
    unit: "kg",
    price: "50,000 đ",
    status: "Đang kinh doanh",
    supplier: "Nông trại Xanh Lâm Đồng"
  },
  {
    code: "SP-010",
    name: "Ớt chuông đỏ organic",
    image: "https://images.unsplash.com/photo-1563565312876-4fd457d4f108?w=120&auto=format&fit=crop&q=60",
    category: "Quả hữu cơ",
    unit: "kg",
    price: "70,000 đ",
    status: "Đang kinh doanh",
    supplier: "Trại nấm Hữu cơ Minh Đức"
  },
  {
    code: "SP-016",
    name: "Dưa leo Baby hữu cơ",
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=120&auto=format&fit=crop&q=60",
    category: "Quả hữu cơ",
    unit: "kg",
    price: "28,000 đ",
    status: "Đang kinh doanh",
    supplier: "Nông trại Xanh Lâm Đồng"
  },
  {
    code: "SP-007",
    name: "Khoai tây vàng Đà Lạt",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=120&auto=format&fit=crop&q=60",
    category: "Củ & Thân",
    unit: "kg",
    price: "20,000 đ",
    status: "Đang kinh doanh",
    supplier: "Nông trại Xanh Lâm Đồng"
  },
  {
    code: "SP-008",
    name: "Cà rốt hữu cơ",
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=120&auto=format&fit=crop&q=60",
    category: "Củ & Thân",
    unit: "kg",
    price: "25,000 đ",
    status: "Đang kinh doanh",
    supplier: "Nông trại Xanh Lâm Đồng"
  },
  {
    code: "SP-009",
    name: "Nấm đùi gà hữu cơ",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=120&auto=format&fit=crop&q=60",
    category: "Nấm & Thảo mộc",
    unit: "kg",
    price: "60,000 đ",
    status: "Đang kinh doanh",
    supplier: "Trại nấm Hữu cơ Minh Đức"
  },
  {
    code: "SP-011",
    name: "Nấm rơm tươi",
    image: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=120&auto=format&fit=crop&q=60",
    category: "Nấm & Thảo mộc",
    unit: "kg",
    price: "80,000 đ",
    status: "Tạm ngưng",
    supplier: "Trại nấm Hữu cơ Minh Đức"
  },
  {
    code: "SP-004",
    name: "Dâu tây Đà Lạt chuẩn VietGAP",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=120&auto=format&fit=crop&q=60",
    category: "Trái cây sạch",
    unit: "kg",
    price: "150,000 đ",
    status: "Đang kinh doanh",
    supplier: "Hợp tác xã Rau sạch Đà Lạt"
  },
  {
    code: "SP-012",
    name: "Bưởi da xanh ruột hồng",
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=120&auto=format&fit=crop&q=60",
    category: "Trái cây sạch",
    unit: "quả",
    price: "75,000 đ",
    status: "Đang kinh doanh",
    supplier: "Vườn cây ăn trái hữu cơ Miền Tây"
  },
  {
    code: "SP-013",
    name: "Cam sành Miền Tây",
    image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=120&auto=format&fit=crop&q=60",
    category: "Trái cây sạch",
    unit: "kg",
    price: "35,000 đ",
    status: "Đang kinh doanh",
    supplier: "Vườn cây ăn trái hữu cơ Miền Tây"
  }
];

export default function DealerCategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Tìm danh mục phù hợp theo code (string) hoặc vị trí index (number)
  const categoryIndex = (parseInt(id) - 1) % MOCK_CATEGORIES.length;
  const category = isNaN(categoryIndex) || categoryIndex < 0 
    ? MOCK_CATEGORIES.find(c => c.code === id) || MOCK_CATEGORIES[0]
    : MOCK_CATEGORIES[categoryIndex];

  // Lọc sản phẩm thuộc danh mục này
  const categoryProducts = ALL_PRODUCTS.filter(
    (product) => product.category.toLowerCase() === category.name.toLowerCase()
  );

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
