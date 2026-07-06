import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { discountService } from '../../../services/api/discountService';
import { voucherService } from '../../../services/api/voucherService';
import { Loader2, Plus, Percent } from 'lucide-react';
import { toast } from 'sonner';
import CreateDiscountModal from '../../../components/Dealer/Discount/CreateDiscountModal';
import DiscountDetailModal from '../../../components/Dealer/Discount/DiscountDetailModal';
import EditDiscountModal from '../../../components/Dealer/Discount/EditDiscountModal';
import CreateVoucherModal from '../../../components/Dealer/Discount/CreateVoucherModal';
import VoucherDetailModal from '../../../components/Dealer/Discount/VoucherDetailModal';
import EditVoucherModal from '../../../components/Dealer/Discount/EditVoucherModal';
import DiscountFilterBar from '../../../components/Dealer/Discount/DiscountFilterBar';
import VoucherFilterBar from '../../../components/Dealer/Discount/VoucherFilterBar';
import DiscountTable from '../../../components/Dealer/Discount/DiscountTable';
import VoucherTable from '../../../components/Dealer/Discount/VoucherTable';
import {
  formatDiscountApiError,
  normalizeIsActive,
} from '../../../components/Dealer/Discount/discountPolicyUtils';
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal';


export default function DealerDiscountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "policy";

  const setActiveTab = (tab) => {
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      nextParams.set("tab", tab);
      return nextParams;
    });
  };

  // Discount policies states
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

  // Voucher states
  const [vouchers, setVouchers] = useState([]);
  const [isVouchersLoading, setIsVouchersLoading] = useState(true);
  const [voucherSearch, setVoucherSearch] = useState("");
  const [voucherStatus, setVoucherStatus] = useState("all");
  const [voucherPage, setVoucherPage] = useState(1);
  const [vouchersTotalCount, setVouchersTotalCount] = useState(0);
  const vouchersLimit = 10;

  // Voucher modals states
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isVoucherDetailModalOpen, setIsVoucherDetailModalOpen] = useState(false);
  const [isVoucherEditModalOpen, setIsVoucherEditModalOpen] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);

  // Custom delete confirm states
  const [deletePolicyId, setDeletePolicyId] = useState(null);
  const [deleteVoucherId, setDeleteVoucherId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPolicies();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, status, scope, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVouchers();
    }, 500);
    return () => clearTimeout(timer);
  }, [voucherSearch, voucherStatus, voucherPage]);

  const fetchPolicies = async () => {
    try {
      setIsLoading(true);
      const params = {
        page,
        limit,
      };
      if (search) params.search = search;
      if (status !== 'all') params.is_active = status === 'active';
      if (scope !== 'all') {
        params.scope = scope === 'all_products' ? 'all' : scope;
      }

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

  const fetchVouchers = async () => {
    try {
      setIsVouchersLoading(true);
      const params = {
        page: voucherPage,
        limit: vouchersLimit,
      };
      if (voucherSearch) params.search = voucherSearch.trim();
      if (voucherStatus !== 'all') params.status = voucherStatus;

      const data = await voucherService.getAll(params);

      setVouchers(data?.results || (Array.isArray(data) ? data : []));
      setVouchersTotalCount(data?.count || (Array.isArray(data) ? data.length : 0));
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast.error("Không thể tải danh sách voucher. Vui lòng thử lại sau.");
    } finally {
      setIsVouchersLoading(false);
    }
  };

  const handleToggleActive = async (policy) => {
    const previousStatus = normalizeIsActive(policy.is_active);
    const newStatus = !previousStatus;

    setPolicies((prevPolicies) =>
      prevPolicies.map((p) =>
        p.id === policy.id ? { ...p, is_active: newStatus } : p
      )
    );

    try {
      await discountService.update(policy.id, { is_active: newStatus });
      toast.success(`Đã ${newStatus ? 'bật' : 'tắt'} chính sách thành công`);
    } catch (error) {
      console.error('Error toggling policy:', error);
      setPolicies((prevPolicies) =>
        prevPolicies.map((p) =>
          p.id === policy.id ? { ...p, is_active: previousStatus } : p
        )
      );
      toast.error(formatDiscountApiError(error));
    }
  };

  const handleDelete = (id) => {
    setDeletePolicyId(id);
  };

  const handleConfirmDeletePolicy = async () => {
    if (!deletePolicyId) return;
    try {
      await discountService.delete(deletePolicyId);
      toast.success("Xóa chính sách thành công");
      fetchPolicies();
    } catch (error) {
      console.error("Error deleting policy:", error);
      toast.error("Không thể xóa chính sách. Vui lòng thử lại.");
    } finally {
      setDeletePolicyId(null);
    }
  };

  const handleDeleteVoucher = (id) => {
    setDeleteVoucherId(id);
  };

  const handleConfirmDeleteVoucher = async () => {
    if (!deleteVoucherId) return;
    try {
      await voucherService.delete(deleteVoucherId);
      toast.success("Xóa voucher thành công");
      fetchVouchers();
    } catch (error) {
      console.error("Error deleting voucher:", error);
      toast.error("Không thể xóa voucher. Vui lòng thử lại.");
    } finally {
      setDeleteVoucherId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {activeTab === 'policy' ? 'Quản lý chính sách giảm giá' : 'Quản lý Voucher & Khuyến mãi'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'policy'
              ? 'Tạo và quản lý các chính sách giảm giá cho sản phẩm'
              : 'Theo dõi và quản lý các chương trình mã giảm giá (voucher) áp dụng cho cửa hàng'
            }
          </p>
        </div>
        {activeTab === 'policy' ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm active:scale-95 w-full sm:w-auto"
          >
            <Plus size={18} />
            Tạo chính sách giảm giá
          </button>
        ) : (
          <button
            onClick={() => setIsVoucherModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm active:scale-95 w-full sm:w-auto"
          >
            <Plus size={18} />
            Tạo Voucher
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("policy")}
          className={`py-3 px-6 font-medium text-sm transition-colors relative ${activeTab === "policy"
            ? "text-green-600 border-b-2 border-green-600 font-semibold"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Chính sách chiết khấu
        </button>
        <button
          onClick={() => setActiveTab("voucher")}
          className={`py-3 px-6 font-medium text-sm transition-colors relative ${activeTab === "voucher"
            ? "text-green-600 border-b-2 border-green-600 font-semibold"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Voucher & Mã giảm giá
        </button>
      </div>

      {activeTab === 'policy' ? (
        <>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có chính sách giảm giá nào</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                Bắt đầu tạo chính sách giảm giá theo khung giờ để thu hút khách hàng và tăng doanh thu.
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
        </>
      ) : (
        <>
          {/* Voucher Filter Bar */}
          <VoucherFilterBar
            search={voucherSearch}
            setSearch={setVoucherSearch}
            status={voucherStatus}
            setStatus={setVoucherStatus}
            setPage={setVoucherPage}
          />


          {isVouchersLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Percent size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có voucher nào</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                Chưa có mã giảm giá voucher nào được tạo trên gian hàng của bạn.
              </p>
            </div>
          ) : (
            <VoucherTable
              vouchers={vouchers}
              totalCount={vouchersTotalCount}
              page={voucherPage}
              setPage={setVoucherPage}
              limit={vouchersLimit}
              handleDelete={handleDeleteVoucher}
              setSelectedVoucherId={setSelectedVoucherId}
              setIsDetailModalOpen={setIsVoucherDetailModalOpen}
              setIsEditModalOpen={setIsVoucherEditModalOpen}
            />
          )}
        </>
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

      <CreateVoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        onSuccess={fetchVouchers}
      />

      <VoucherDetailModal
        isOpen={isVoucherDetailModalOpen}
        onClose={() => setIsVoucherDetailModalOpen(false)}
        voucherId={selectedVoucherId}
      />

      <EditVoucherModal
        isOpen={isVoucherEditModalOpen}
        onClose={() => setIsVoucherEditModalOpen(false)}
        onSuccess={fetchVouchers}
        voucherId={selectedVoucherId}
      />

      <DeleteConfirmModal
        isOpen={deletePolicyId !== null}
        onClose={() => setDeletePolicyId(null)}
        onConfirm={handleConfirmDeletePolicy}
        itemType="chính sách giảm giá này"
      />

      <DeleteConfirmModal
        isOpen={deleteVoucherId !== null}
        onClose={() => setDeleteVoucherId(null)}
        onConfirm={handleConfirmDeleteVoucher}
        itemType="voucher này"
      />
    </div>
  );
}


