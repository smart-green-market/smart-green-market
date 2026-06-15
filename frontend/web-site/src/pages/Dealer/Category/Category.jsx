import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Plus } from "lucide-react";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
import CategoryGrid from "../../../components/Dealer/Category/CategoryGrid";
import CreateCategoryModal from "../../../components/Dealer/Category/CreateCategoryModal";
import UpdateCategoryModal from "../../../components/Dealer/Category/UpdateCategoryModal";
import { categoryService, handleApiError } from "../../../services/api/categoryService";
import { toast } from "sonner";

export default function DealerCategoryPage() {
    const navigate = useNavigate();
    const [categoryList, setCategoryList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [categoryToUpdate, setCategoryToUpdate] = useState(null);

    const mapCategoryStatus = (status) => {
        const statusMap = {
            pending: "Chờ duyệt",
            active: "Hoạt động",
            inactive: "Đã khóa",
            rejected: "Từ chối",
        };
        return statusMap[status] || status;
    };

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const data = await categoryService.getAll();
            const mappedData = data.map(cat => ({
                ...cat,
                code: cat.code || `CAT-${cat.id}`,
                status: mapCategoryStatus(cat.status),
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
            (cat.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (cat.code || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "" || cat.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filterOptions = [
        { label: "Tất cả", value: "", colorClass: "text-neutral-700" },
        { label: "Hoạt động", value: "Hoạt động", colorClass: "text-emerald-700" },
        { label: "Chờ duyệt", value: "Chờ duyệt", colorClass: "text-amber-700" },
        { label: "Đã khóa", value: "Đã khóa", colorClass: "text-neutral-500" },
        { label: "Từ chối", value: "Từ chối", colorClass: "text-red-700" }
    ];

    const handleViewDetail = (cat) => {
        navigate(`/dai-ly/danh-muc/${cat.id}`);
    };

    const handleCreateCategory = async (newCatData) => {
        try {
            const dataToCreate = {
                name: newCatData.name,
                description: newCatData.description || "",
                sort_order: "1"
            };
            const response = await categoryService.create(dataToCreate);
            const newCat = response?.data || response;
            
            const mappedCat = {
                ...newCat,
                code: newCat.id ? `CAT-${newCat.id}` : `CAT-${Math.floor(Math.random() * 1000)}`,
                status: mapCategoryStatus(newCat.status),
                count: "0 sản phẩm",
            };
            setCategoryList((prev) => [mappedCat, ...prev]);
            toast.success("Thêm danh mục thành công!");
        } catch (error) {
            toast.error(handleApiError(error, "Không thể thêm danh mục mới"));
            throw error;
        }
    };

    const handleUpdateCategory = async (id, updatedData) => {
        try {
            await categoryService.update(id, updatedData);
            toast.success("Cập nhật danh mục thành công!");
            fetchCategories();
        } catch (error) {
            toast.error(handleApiError(error, "Không thể cập nhật danh mục"));
            throw error;
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
        try {
            await categoryService.delete(id);
            toast.success("Xóa danh mục thành công!");
            
            fetchCategories();
        } catch (error) {
            console.log(error);
            toast.error(handleApiError(error, "Không thể xóa danh mục"));
            
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 bg-emerald-50/15 min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

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

            {/* Grid layout for categories */}
            <CategoryGrid
                categories={filteredCategories}
                onViewDetail={handleViewDetail}
                onUpdate={(cat) => setCategoryToUpdate(cat)}
                onDelete={handleDeleteCategory}
            />

            {/* Create Category Modal */}
            {isCreateModalOpen && (
                <CreateCategoryModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onConfirm={handleCreateCategory}
                />
            )}

            {/* Update Category Modal */}
            {categoryToUpdate && (
                <UpdateCategoryModal
                    category={categoryToUpdate}
                    onClose={() => setCategoryToUpdate(null)}
                    onConfirm={handleUpdateCategory}
                />
            )}
        </div>
    );
}