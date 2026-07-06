import React, { useState, useEffect } from "react";
import { Plus, Percent, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { quantityDiscountService } from "../../services/api/quantityDiscountService";
import { formatQuantityDiscountApiError } from "../../utils/quantityDiscountUtils";
import CreateQuantityDiscountModal from "../../components/Supplier/Discount/CreateQuantityDiscountModal";
import EditQuantityDiscountModal from "../../components/Supplier/Discount/EditQuantityDiscountModal";
import QuantityDiscountDetailModal from "../../components/Supplier/Discount/QuantityDiscountDetailModal";
import QuantityDiscountTable from "../../components/Supplier/Discount/QuantityDiscountTable";

export default function SupplierDiscountPage() {
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => fetchPolicies(), 400);
    return () => clearTimeout(timer);
  }, [search, status, page]);

  const fetchPolicies = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit };
      if (search) params.search = search;
      if (status !== "all") params.is_active = status === "active";
      const data = await quantityDiscountService.getAll(params);
      setPolicies(data.results || []);
      setTotalCount(data.count || 0);
    } catch (error) {
      toast.error(formatQuantityDiscountApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa chính sách giảm giá này?")) return;
    try {
      await quantityDiscountService.delete(id);
      toast.success("Đã xóa chính sách");
      fetchPolicies();
    } catch (error) {
      toast.error(formatQuantityDiscountApiError(error));
    }
  };

  const handleToggleActive = async (policy) => {
    try {
      await quantityDiscountService.update(policy.id, { is_active: !policy.is_active });
      toast.success(policy.is_active ? "Đã tắt chính sách" : "Đã kích hoạt chính sách");
      fetchPolicies();
    } catch (error) {
      toast.error(formatQuantityDiscountApiError(error));
    }
  };

  return (
    <div className="font-['Geist',sans-serif] p-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Percent className="w-6 h-6 text-emerald-600" />
            Giảm giá theo số lượng
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Thiết lập bậc giảm khi đại lý đặt đủ số lượng (VD: từ 100 kg giảm 10%)
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tạo chính sách
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Tìm theo tên chính sách..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-neutral-200 rounded-xl text-sm min-w-[220px]"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-neutral-200 rounded-xl text-sm bg-white"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Đã tắt</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <QuantityDiscountTable
          policies={policies}
          totalCount={totalCount}
          page={page}
          setPage={setPage}
          limit={limit}
          onView={(id) => { setSelectedPolicyId(id); setIsDetailOpen(true); }}
          onEdit={(id) => { setSelectedPolicyId(id); setIsEditOpen(true); }}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      )}

      <CreateQuantityDiscountModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchPolicies}
      />
      <EditQuantityDiscountModal
        isOpen={isEditOpen}
        policyId={selectedPolicyId}
        onClose={() => { setIsEditOpen(false); setSelectedPolicyId(null); }}
        onSuccess={fetchPolicies}
      />
      <QuantityDiscountDetailModal
        isOpen={isDetailOpen}
        policyId={selectedPolicyId}
        onClose={() => { setIsDetailOpen(false); setSelectedPolicyId(null); }}
      />
    </div>
  );
}
