import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PackageSearch } from "lucide-react";
import PreOrderProposeModal from "../../../components/Dealer/PreOrder/PreOrderProposeModal";
import PreOrderWorkspace from "../../../components/PreOrder/PreOrderWorkspace";
import RejectModal from "../../../components/common/RejectModal";
import {
  dealerPreOrderService,
  handleApiError,
} from "../../../services/api/dealerPreOrderService";
import { useOrderRealtimeRefresh } from "../../../hooks/useOrderRealtimeRefresh";
import { ORDER_REFERENCE_TYPES } from "../../../utils/orderRealtimeUtils";
import { parsePreOrderList, parsePreOrderSummary } from "../../../utils/buyerPreorderUtils";
import {
  countPreOrdersByStatus,
  DEALER_PREORDER_FILTERS,
} from "../../../utils/preorderStatusConfig";
import { useAuth } from "../../../contexts/authProvider";
import WaitingStockModal from "../../../components/Dealer/PreOrder/WaitingStockModal";

export default function DealerPreOrderPage() {
  const { user } = useAuth();
  const [waitingStockOpen, setWaitingStockOpen] = useState(false);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchList = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await dealerPreOrderService.getAll({
        search: debouncedSearch,
        page_size: 50,
      });
      setAllRequests(parsePreOrderList(data));
    } catch (err) {
      if (!silent) toast.error(handleApiError(err, "Không tải được YC đặt trước"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [debouncedSearch]);

  const requests = useMemo(() => {
    if (!statusFilter) return allRequests;
    return allRequests.filter((item) => item.status === statusFilter);
  }, [allRequests, statusFilter]);

  const fetchDetail = useCallback(async (id) => {
    if (!id) return;
    setDetailLoading(true);
    try {
      const data = await dealerPreOrderService.getById(id);
      setDetail(parsePreOrderSummary(data));
    } catch (err) {
      toast.error(handleApiError(err, "Không tải được chi tiết YC"));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!requests.length) {
      setSelectedId(null);
      setDetail(null);
      return;
    }
    const stillVisible = requests.some((item) => item.id === selectedId);
    if (!stillVisible) {
      setSelectedId(requests[0].id);
    }
  }, [requests, selectedId]);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
    else setDetail(null);
  }, [selectedId, fetchDetail]);

  useOrderRealtimeRefresh({
    referenceTypes: [ORDER_REFERENCE_TYPES.CUSTOMER_PREORDER_REQUEST],
    watchOrderId: selectedId,
    onRefresh: () => fetchList({ silent: true }),
    onDetailRefresh: () => {
      if (selectedId) fetchDetail(selectedId);
    },
  });

  const statusCounts = useMemo(
    () => countPreOrdersByStatus(allRequests),
    [allRequests],
  );

  const handleConfirm = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await dealerPreOrderService.confirm(selectedId, {});
      toast.success("Đã tạo đơn chờ hàng cho khách");
      await fetchList({ silent: true });
      await fetchDetail(selectedId);
    } catch (err) {
      toast.error(handleApiError(err, "Không thể xác nhận YC"));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePropose = async (payload) => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await dealerPreOrderService.propose(selectedId, payload);
      toast.success("Đã gửi đề xuất cho khách hàng");
      setProposeOpen(false);
      await fetchList({ silent: true });
      await fetchDetail(selectedId);
    } catch (err) {
      toast.error(handleApiError(err, "Không thể gửi đề xuất"));
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await dealerPreOrderService.reject(selectedId, { reason });
      toast.success("Đã từ chối yêu cầu");
      setRejectOpen(false);
      await fetchList({ silent: true });
      await fetchDetail(selectedId);
    } catch (err) {
      toast.error(handleApiError(err, "Không thể từ chối YC"));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/15 p-6">
      <PreOrderWorkspace
        title="Yêu cầu đặt trước"
        subtitle="Xử lý các yêu cầu đặt hàng vượt tồn kho từ khách hàng."
        audience="dealer"
        loading={loading}
        requests={requests}
        allCount={allRequests.length}
        statusCounts={statusCounts}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        filters={DEALER_PREORDER_FILTERS}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm mã YC, tên khách..."
        showSearch
        selectedId={selectedId}
        onSelect={setSelectedId}
        detail={detail}
        detailLoading={detailLoading}
        emptyDetailMessage="Chọn yêu cầu bên trái để xem và xử lý."
        headerActions={
          <button
            type="button"
            onClick={() => setWaitingStockOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 px-4 py-2.5 text-xs font-bold text-stone-700 transition-all shadow-xs"
          >
            <PackageSearch className="w-4 h-4 text-emerald-600 animate-pulse" />
            Thống kê đặt trước
          </button>
        }
        detailActions={
          detail ? (
            <>
              {detail.status === "submitted" ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleConfirm}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Xác nhận
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setProposeOpen(true)}
                    className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    Đề xuất
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setRejectOpen(true)}
                    className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-stone-50 disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </div>
              ) : null}
              {detail.convertedOrderId ? (
                <p className="text-sm font-medium text-emerald-800">
                  Đã chuyển thành đơn #{detail.convertedOrderId}
                </p>
              ) : null}
            </>
          ) : null
        }
      />

      <PreOrderProposeModal
        open={proposeOpen}
        items={detail?.items ?? []}
        submitting={actionLoading}
        onClose={() => {
          if (!actionLoading) setProposeOpen(false);
        }}
        onSubmit={handlePropose}
      />

      <RejectModal
        isOpen={rejectOpen}
        onClose={() => {
          if (!actionLoading) setRejectOpen(false);
        }}
        onConfirm={handleReject}
        title="Từ chối yêu cầu đặt trước"
        message="Nhập lý do từ chối để gửi cho khách hàng."
        showToast={false}
        loading={actionLoading}
      />

      <WaitingStockModal
        isOpen={waitingStockOpen}
        onClose={() => setWaitingStockOpen(false)}
        dealerId={user?.dealer_profile?.id}
      />
    </div>
  );
}
