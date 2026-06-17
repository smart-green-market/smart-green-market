import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Plus } from "lucide-react";
import SupplierFilter from "../../components/Dealer/Supplier/SupplierFilter";
import CategoryGrid from "../../components/Dealer/Category/CategoryGrid";
import CreateCategoryModal from "../../components/Dealer/Category/CreateCategoryModal";

const INITIAL_CATEGORIES = [
    {
        id:1,
        name: "Rau lá xanh",
        code: "CAT-RLX",
        description: "Các loại rau ăn lá như cải thìa, cải ngọt, xà lách, rau muống hữu cơ.",
        count: "18 sản phẩm",
        status: "Đang kinh doanh",
        bgClass: "bg-emerald-50 text-emerald-800 border-emerald-100",
        iconColor: "text-emerald-600"
    },
    {
        id:2,
        name: "Quả hữu cơ",
        code: "CAT-QHC",
        description: "Cà chua bi, ớt chuông, dưa leo Baby, bí ngòi được trồng tự nhiên.",
        count: "12 sản phẩm",
        status: "Đang kinh doanh",
        bgClass: "bg-green-50 text-green-800 border-green-100",
        iconColor: "text-green-600"
    },
    {
        id:3,
        name: "Củ & Thân",
        code: "CAT-CT",
        description: "Khoai tây, cà rốt Đà Lạt, củ cải đường, khoai lang mật sạch.",
        count: "15 sản phẩm",
        status: "Đang kinh doanh",
        bgClass: "bg-lime-50 text-lime-800 border-lime-100",
        iconColor: "text-lime-600"
    },
    {
        id:4,
        name: "Nấm & Thảo mộc",
        code: "CAT-NTM",
        description: "Nấm đùi gà, nấm rơm, nấm kim châm, hành lá, ngò rí tươi.",
        count: "8 sản phẩm",
        status: "Đang kinh doanh",
        bgClass: "bg-teal-50 text-teal-800 border-teal-100",
        iconColor: "text-teal-600"
    },
    {
        id:5,
        name: "Trái cây sạch",
        code: "CAT-TCS",
        description: "Dâu tây Đà Lạt, táo mật sạch nhập vườn, bơ sáp Đắk Lắk.",
        count: "10 sản phẩm",
        status: "Tạm ngưng",
        bgClass: "bg-amber-50 text-amber-800 border-amber-100",
        iconColor: "text-amber-600"
    }
];

export default function DealerCategoryPage() {
    const navigate = useNavigate();
    const [categoryList, setCategoryList] = useState(INITIAL_CATEGORIES);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const filteredCategories = categoryList.filter((cat) => {
        const matchesSearch =
            cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cat.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "" || cat.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filterOptions = [
        { label: "Tất cả", value: "", colorClass: "text-neutral-700" },
        { label: "Đang kinh doanh", value: "Đang kinh doanh", colorClass: "text-emerald-700" },
        { label: "Tạm ngưng", value: "Tạm ngưng", colorClass: "text-amber-700" }
    ];

    const handleViewDetail = (cat) => {
        navigate(`/dai-ly/danh-muc/${cat.id}`);
    };

    const handleCreateCategory = (newCat) => {
        setCategoryList((prev) => [newCat, ...prev]);
    };

    return (
        <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight flex items-center gap-2">
                        <Tag className="w-6 h-6 text-emerald-600" /> Danh Mục Nông Sản
                    </h1>
                    <p className="text-sm text-emerald-800/70 mt-1">
                        Quản lý phân loại các mặt hàng rau củ quả tại cửa hàng của bạn.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 cursor-pointer self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" /> Thêm danh mục
                </button>
            </div>

            {/* Filter */}
            <SupplierFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                filterOptions={filterOptions}
                placeholder="Tìm kiếm danh mục..."
            />

            {/* Grid layout for categories */}
            <CategoryGrid
                categories={filteredCategories}
                onViewDetail={handleViewDetail}
            />

            {/* Create Category Modal */}
            {isCreateModalOpen && (
                <CreateCategoryModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onConfirm={handleCreateCategory}
                />
            )}
        </div>
    );
}