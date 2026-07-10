import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import PreOrderProposeModal from "../../../components/Dealer/PreOrder/PreOrderProposeModal";
import PreOrderDetailPanel from "../../../components/PreOrder/PreOrderDetailPanel";
import PreOrderRequestCard from "../../../components/PreOrder/PreOrderRequestCard";
import PreOrderStatusSummary from "../../../components/PreOrder/PreOrderStatusSummary";
import RejectModal from "../../../components/common/RejectModal";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
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

export default function DealerPreOrderPage() {
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
    <div className="space-y-6 bg-emerald-50/15 p-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-extrabold text-emerald-950">Yêu cầu đặt trước</h1>
        <p className="mt-1 text-sm text-emerald-800/70">
          Xử lý các yêu cầu đặt hàng vượt tồn kho từ khách hàng.
        </p>
      </div>

      <PreOrderStatusSummary
        counts={statusCounts}
        audience="dealer"
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        filters={DEALER_PREORDER_FILTERS}
      />

      <SupplierFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        filterOptions={DEALER_PREORDER_FILTERS.map((item) => ({
          label: item.label,
          value: item.value,
        }))}
        placeholder="Tìm mã YC, tên khách..."
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
        </div>
      ) : allRequests.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center shadow-sm">
          <ClipboardList className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 font-medium text-neutral-700">Chưa có yêu cầu đặt trước</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-10 text-center text-sm text-neutral-600">
          Không có yêu cầu nào ở trạng thái đã chọn.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-3">
            {requests.map((item) => (
              <PreOrderRequestCard
                key={item.id}
                request={item}
                selected={selectedId === item.id}
                onClick={() => setSelectedId(item.id)}
                audience="dealer"
              />
            ))}
          </div>

          <PreOrderDetailPanel
            detail={detail}
            audience="dealer"
            loading={detailLoading && !detail}
            emptyMessage="Chọn một yêu cầu để xem và xử lý."
          >
            {detail?.status === "submitted" ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirm}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  Xác nhận theo yêu cầu
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setProposeOpen(true)}
                  className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                >
                  Đề xuất điều chỉnh
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setRejectOpen(true)}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
                >
                  Từ chối
                </button>
              </div>
            ) : null}

            {detail?.convertedOrderId ? (
              <p className="text-sm font-medium text-emerald-800">
                Đã chuyển thành đơn #{detail.convertedOrderId}
              </p>
            ) : null}
          </PreOrderDetailPanel>
        </div>
      )}

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
    </div>
  );
}
