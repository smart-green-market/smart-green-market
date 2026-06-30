import React, { useState, useEffect } from 'react';
import { discountService } from '../../../services/api/discountService';
import { Loader2, Plus, Percent } from 'lucide-react';
import { toast } from 'sonner';
import CreateDiscountModal from '../../../components/Dealer/Discount/CreateDiscountModal';
import DiscountDetailModal from '../../../components/Dealer/Discount/DiscountDetailModal';
import EditDiscountModal from '../../../components/Dealer/Discount/EditDiscountModal';
import DiscountFilterBar from '../../../components/Dealer/Discount/DiscountFilterBar';
import DiscountTable from '../../../components/Dealer/Discount/DiscountTable';

export default function DealerDiscountPage() {
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [scope, setScope] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPolicies();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, status, scope, page]);

  const fetchPolicies = async () => {
    try {
      setIsLoading(true);
      const params = {
        page,
        limit,
      };
      if (search) params.search = search;
      if (status !== 'all') params.is_active = status === 'active';
      if (scope !== 'all') params.scope = scope;

      const data = await discountService.getAll(params);

      setPolicies(data?.results || (Array.isArray(data) ? data : []));
      setTotalCount(data?.count || (Array.isArray(data) ? data.length : 0));
    } catch (error) {
      console.error("Error fetching discount policies:", error);
      toast.error("Không thể tải danh sách giảm giá. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (policy) => {
    try {
      const newStatus = !policy.is_active;
      // We only send the updated is_active field to patch endpoint
      await discountService.update(policy.id, { is_active: newStatus });

      setPolicies(prevPolicies =>
        prevPolicies.map(p =>
          p.id === policy.id ? { ...p, is_active: newStatus } : p
        )
      );
      toast.success(`Đã ${newStatus ? 'bật' : 'tắt'} chính sách thành công`);
    } catch (error) {
      console.error("Error toggling policy:", error);
      toast.error("Không thể thay đổi trạng thái. Vui lòng thử lại.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chính sách giảm giá này không?")) return;

    try {
      await discountService.delete(id);
      toast.success("Xóa chính sách thành công");
      fetchPolicies();
    } catch (error) {
      console.error("Error deleting policy:", error);
      toast.error("Không thể xóa chính sách. Vui lòng thử lại.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý chính sách giảm giá</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tạo và quản lý các chính sách giảm giá cho sản phẩm
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm active:scale-95"
        >
          <Plus size={18} />
          Tạo chính sách giảm giá
        </button>
      </div>

      <DiscountFilterBar
        search={search}
        setSearch={setSearch}
        scope={scope}
        setScope={setScope}
        status={status}
        setStatus={setStatus}
        setPage={setPage}
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : policies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Percent size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có mã giảm giá nào</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">
            Bắt đầu tạo các chương trình khuyến mãi để thu hút khách hàng và tăng doanh thu.
          </p>
        </div>
      ) : (
        <DiscountTable
          policies={policies}
          totalCount={totalCount}
          page={page}
          setPage={setPage}
          limit={limit}
          handleToggleActive={handleToggleActive}
          handleDelete={handleDelete}
          setSelectedPolicyId={setSelectedPolicyId}
          setIsDetailModalOpen={setIsDetailModalOpen}
          setIsEditModalOpen={setIsEditModalOpen}
        />
      )}

      <CreateDiscountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPolicies}
      />

      <DiscountDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        policyId={selectedPolicyId}
      />

      <EditDiscountModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchPolicies}
        policyId={selectedPolicyId}
      />
    </div>
  );
}
