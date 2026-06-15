import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Plus } from "lucide-react";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
import CategoryGrid from "../../../components/Dealer/Category/CategoryGrid";
import CreateCategoryModal from "../../../components/Dealer/Category/CreateCategoryModal";
import { categoryService, handleApiError } from "../../../services/api/categoryService";

export default function DealerCategoryPage() {
    const navigate = useNavigate();
    const [categoryList, setCategoryList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const data = await categoryService.getAll();
            const mappedData = data.map(cat => ({
                ...cat,
                code: cat.code || `CAT-${cat.id}`,
                status: cat.status === 'active' ? "Đang kinh doanh" : "Tạm ngưng",
                count: "0 sản phẩm",
            }));
            setCategoryList(mappedData);
        } catch (err) {
            setError(handleApiError(err, "Không thể tải danh sách danh mục"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

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

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : (
                /* Grid layout for categories */
                <CategoryGrid
                    categories={filteredCategories}
                    onViewDetail={handleViewDetail}
                />
            )}

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