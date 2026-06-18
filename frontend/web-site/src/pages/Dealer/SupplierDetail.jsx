import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SupplierInfoCard from "../../components/Dealer/Supplier/SupplierInfoCard";
import SupplierProductList from "../../components/Dealer/Supplier/SupplierProductList";

const DETAILED_SUPPLIERS = [
  {
    name: "Hợp tác xã Rau sạch Đà Lạt",
    contact: "Nguyễn Văn Hùng",
    phone: "0912.345.678",
    email: "contact@htxraudalat.vn",
    website: "www.htxraudalat.vn",
    address: "12 Mai Anh Đào, Phường 8, TP. Đà Lạt, Lâm Đồng",
    rating: 5.0,
    status: "Đang hợp tác",
    scale: "Hơn 50 héc-ta nhà kính chuẩn VietGAP",
    joinedDate: "15/10/2024",
    description: "Hợp tác xã quy tụ hơn 30 hộ nông dân lành nghề tại Đà Lạt, chuyên canh tác các loại rau ăn lá thủy canh và rau củ quả ôn đới chất lượng cao. Quy trình khép kín từ ươm giống đến thu hoạch và đóng gói.",
    certifications: ["VietGAP", "Organic USDA", "HACCP"],
    bgClass: "bg-emerald-50 text-emerald-800 border-emerald-100",
    avatarColor: "bg-emerald-500",
    avatar: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=150&auto=format&fit=crop&q=60",
    products: [
      {
        code: "SP-001",
        name: "Cải thìa hữu cơ",
        image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=120&auto=format&fit=crop&q=60",
        category: "Rau lá xanh",
        unit: "kg",
        price: "30,000 đ",
        status: "Đang kinh doanh"
      },
      {
        code: "SP-002",
        name: "Bông cải xanh sạch",
        image: "https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=120&auto=format&fit=crop&q=60",
        category: "Rau lá xanh",
        unit: "kg",
        price: "45,000 đ",
        status: "Đang kinh doanh"
      },
      {
        code: "SP-003",
        name: "Cà chua bi hữu cơ",
        image: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=120&auto=format&fit=crop&q=60",
        category: "Quả hữu cơ",
        unit: "kg",
        price: "50,000 đ",
        status: "Đang kinh doanh"
      },
      {
        code: "SP-004",
        name: "Dâu tây Đà Lạt chuẩn VietGAP",
        image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=120&auto=format&fit=crop&q=60",
        category: "Trái cây sạch",
        unit: "kg",
        price: "150,000 đ",
        status: "Đang kinh doanh"
      },
      {
        code: "SP-005",
        name: "Xà lách thủy canh",
        image: "https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=120&auto=format&fit=crop&q=60",
        category: "Rau lá xanh",
        unit: "kg",
        price: "35,000 đ",
        status: "Tạm ngưng"
      }
    ]
  },
  {
    name: "Nông trại Xanh Lâm Đồng",
    contact: "Trần Thị Lan",
    phone: "0987.654.321",
    email: "info@nongtraixanhld.com",
    website: "www.nongtraixanhld.com",
    address: "Quốc lộ 20, Thị trấn Liên Nghĩa, Huyện Đức Trọng, Lâm Đồng",
    rating: 4.8,
    status: "Đang hợp tác",
    scale: "35 héc-ta canh tác ngoài trời và nhà màng",
    joinedDate: "08/12/2024",
    description: "Nông trại chuyên cung cấp các mặt hàng củ quả dài ngày như khoai tây, cà rốt, cà chua bi, hành tây. Ứng dụng công nghệ tưới nhỏ giọt Israel và phân bón hữu cơ sinh học tự ủ.",
    certifications: ["GlobalGAP", "VietGAP"],
    bgClass: "bg-green-50 text-green-800 border-green-100",
    avatarColor: "bg-green-500",
    avatar: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=150&auto=format&fit=crop&q=60",
    products: [
      {
        code: "SP-006",
        name: "Cà chua bi vườn hữu cơ",
        image: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=120&auto=format&fit=crop&q=60",
        category: "Quả hữu cơ",
        unit: "kg",
        price: "50,000 đ",
        status: "Đang kinh doanh"
      },
      {
        code: "SP-007",
        name: "Khoai tây vàng Đà Lạt",
        image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=120&auto=format&fit=crop&q=60",
        category: "Củ & Thân",
        unit: "kg",
        price: "20,000 đ",
        status: "Đang kinh doanh"
      },
      {
        code: "SP-008",
        name: "Cà rốt hữu cơ",
        image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=120&auto=format&fit=crop&q=60",
        category: "Củ & Thân",
        unit: "kg",
        price: "25,000 đ",
        status: "Đang kinh doanh"
      }
    ]
  },
  {
    name: "Trại nấm Hữu cơ Minh Đức",
    contact: "Phạm Minh Đức",
    phone: "0903.111.222",
    email: "duc.pham@namminhduc.vn",
    website: "www.namminhduc.vn",
    address: "Đường số 9, Xã Trung An, Huyện Củ Chi, TP. Hồ Chí Minh",
    rating: 4.5,
    status: "Đang hợp tác",
    scale: "10,000 m² xưởng nuôi cấy nấm khép kín máy lạnh",
    joinedDate: "22/01/2025",
    description: "Đơn vị tiên phong nuôi trồng nấm hữu cơ tại miền Nam. Các sản phẩm nấm tươi ngon như nấm đùi gà, nấm rơm, nấm kim châm luôn được kiểm soát chặt chẽ nhiệt độ và độ ẩm phòng nuôi.",
    certifications: ["VietGAP", "ISO 22000"],
    bgClass: "bg-teal-50 text-teal-800 border-teal-100",
    avatarColor: "bg-teal-500",
    avatar: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=150&auto=format&fit=crop&q=60",
    products: [
      {
        code: "SP-009",
        name: "Nấm đùi gà hữu cơ",
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=120&auto=format&fit=crop&q=60",
        category: "Nấm & Thảo mộc",
        unit: "kg",
        price: "60,000 đ",
        status: "Đang kinh doanh"
      },
      {
        code: "SP-010",
        name: "Ớt chuông đỏ organic",
        image: "https://images.unsplash.com/photo-1563565312876-4fd457d4f108?w=120&auto=format&fit=crop&q=60",
        category: "Quả hữu cơ",
        unit: "kg",
        price: "70,000 đ",
        status: "Đang kinh doanh"
      },
      {
        code: "SP-011",
        name: "Nấm rơm tươi",
        image: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=120&auto=format&fit=crop&q=60",
        category: "Nấm & Thảo mộc",
        unit: "kg",
        price: "80,000 đ",
        status: "Tạm ngưng"
      }
    ]
  },
  {
    name: "Vườn cây ăn trái hữu cơ Miền Tây",
    contact: "Lê Hoàng Nam",
    phone: "0944.555.666",
    email: "contact@traicaymientay.org",
    website: "www.traicaymientay.org",
    address: "Ấp Nhơn Lộc, Xã Nhơn Nghĩa, Huyện Phong Điền, Cần Thơ",
    rating: 4.2,
    status: "Chưa hợp tác",
    scale: "15 héc-ta nhà vườn trồng cây ăn trái quả ngọt",
    joinedDate: "03/03/2025",
    description: "Nhà vườn chuyên trồng bưởi da xanh ruột hồng, cam sành, và xoài cát Hòa Lộc theo phương pháp hữu cơ hoàn toàn, không phun thuốc bảo vệ thực vật hóa học.",
    certifications: ["VietGAP"],
    bgClass: "bg-amber-50 text-amber-800 border-amber-100",
    avatarColor: "bg-amber-500",
    avatar: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=150&auto=format&fit=crop&q=60",
    products: [
      {
        code: "SP-012",
        name: "Bưởi da xanh ruột hồng",
        image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=120&auto=format&fit=crop&q=60",
        category: "Trái cây sạch",
        unit: "quả",
        price: "75,000 đ",
        status: "Đang kinh doanh"
      },
      {
        code: "SP-013",
        name: "Cam sành Miền Tây",
        image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=120&auto=format&fit=crop&q=60",
        category: "Trái cây sạch",
        unit: "kg",
        price: "35,000 đ",
        status: "Đang kinh doanh"
      }
    ]
  }
];

export default function DealerSupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  //Cơ chế tính toán tránh việc id lớn hơn số lượng sản phẩm
  const supplierIndex = (parseInt(id) - 1) % DETAILED_SUPPLIERS.length;
  const supplier = DETAILED_SUPPLIERS[isNaN(supplierIndex) || supplierIndex < 0 ? 0 : supplierIndex];

  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      {/* Breadcrumb & Navigation */}
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

      {/* Main Info Card Component */}
      <SupplierInfoCard supplier={supplier} id={id} />

      {/* Product List Component */}
      <SupplierProductList products={supplier.products} />
    </div>
  );
}