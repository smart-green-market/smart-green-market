import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RejectModal from "../../../components/common/RejectModal";
import { appToast } from "../../../components/common/toast";
import PreOrderWorkspace from "../../../components/PreOrder/PreOrderWorkspace";
import {
  buyerPreorder,
  handleApiError,
} from "../../../services/api/Buyer/buyerPreorder";
import { useDealerSlug, useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import { useOrderRealtimeRefresh } from "../../../hooks/useOrderRealtimeRefresh";
import { ORDER_REFERENCE_TYPES } from "../../../utils/orderRealtimeUtils";
import {
  canAcceptPreOrder,
  parsePreOrderList,
  parsePreOrderSummary,
} from "../../../utils/buyerPreorderUtils";
import {
  BUYER_PREORDER_FILTERS,
  countPreOrdersByStatus,
} from "../../../utils/preorderStatusConfig";

export default function PreOrderRequestsPage() {
  const dealerSlug = useDealerSlug();
  const paths = useStorefrontPaths();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const fetchList = useCallback(async ({ silent = false } = {}) => {
    if (!dealerSlug) {
      setError("Không xác định được cửa hàng.");
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const data = await buyerPreorder.getAll(dealerSlug);
      setRequests(parsePreOrderList(data));
    } catch (err) {
      if (!silent) {
        setError(handleApiError(err, "Không tải được danh sách yêu cầu đặt trước."));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [dealerSlug]);

  const fetchDetail = useCallback(
    async (id) => {
      if (!dealerSlug || !id) return;
      setDetailLoading(true);
      try {
        const data = await buyerPreorder.getById(dealerSlug, id);
        setDetail(parsePreOrderSummary(data));
      } catch (err) {
        appToast.warning(handleApiError(err, "Không tải được chi tiết yêu cầu."));
      } finally {
        setDetailLoading(false);
      }
    },
    [dealerSlug],
  );

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filteredRequests = useMemo(() => {
    if (!statusFilter) return requests;
    return requests.filter((item) => item.status === statusFilter);
  }, [requests, statusFilter]);

  useEffect(() => {
    if (!filteredRequests.length) {
      setSelectedId(null);
      setDetail(null);
      return;
    }
    const stillVisible = filteredRequests.some((item) => item.id === selectedId);
    if (!stillVisible) {
      setSelectedId(filteredRequests[0].id);
    }
  }, [filteredRequests, selectedId]);

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

  const statusCounts = useMemo(() => countPreOrdersByStatus(requests), [requests]);

  const selectedSummary = useMemo(
    () => requests.find((item) => item.id === selectedId) ?? detail,
    [requests, selectedId, detail],
  );

  const handleAccept = async () => {
    if (!dealerSlug || !selectedId) return;
    setActionLoading(true);
    try {
      await buyerPreorder.accept(dealerSlug, selectedId);
      appToast.success("Đã xác nhận yêu cầu đặt trước");
      await fetchList({ silent: true });
      await fetchDetail(selectedId);
    } catch (err) {
      appToast.warning(handleApiError(err, "Không thể xác nhận yêu cầu."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    if (!dealerSlug || !selectedId) return;
    setActionLoading(true);
    try {
      await buyerPreorder.reject(dealerSlug, selectedId, { reason });
      appToast.success("Đã từ chối đề xuất");
      setRejectOpen(false);
      await fetchList({ silent: true });
      await fetchDetail(selectedId);
    } catch (err) {
      appToast.warning(handleApiError(err, "Không thể từ chối yêu cầu."));
    } finally {
      setActionLoading(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!loading && requests.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-emerald-950">Yêu cầu đặt trước</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Theo dõi và xác nhận đề xuất từ đại lý khi đặt hàng vượt tồn kho.
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-6 py-10 text-center">
          <p className="font-medium text-emerald-950">Chưa có yêu cầu đặt trước</p>
          <Link
            to={paths.checkout}
            className="mt-4 inline-block text-sm font-semibold text-teal-800 no-underline"
          >
            Quay lại đặt hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PreOrderWorkspace
        title="Yêu cầu đặt trước"
        subtitle="Theo dõi và xác nhận đề xuất từ đại lý khi đặt hàng vượt tồn kho."
        audience="buyer"
        loading={loading}
        requests={filteredRequests}
        allCount={requests.length}
        statusCounts={statusCounts}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        filters={BUYER_PREORDER_FILTERS}
        selectedId={selectedId}
        onSelect={setSelectedId}
        detail={detail ?? selectedSummary}
        detailLoading={detailLoading && !selectedSummary}
        emptyDetailMessage="Chọn yêu cầu bên trái để xem chi tiết."
        detailActions={
          selectedSummary ? (
            <>
              {canAcceptPreOrder(selectedSummary) ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleAccept}
                    className="flex-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    Đồng ý đề xuất
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setRejectOpen(true)}
                    className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-stone-50 disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </div>
              ) : null}
              {selectedSummary.convertedOrderId ? (
                <Link
                  to={paths.orderStatus}
                  className="inline-flex text-sm font-semibold text-teal-800 no-underline hover:text-teal-900"
                >
                  Xem đơn hàng đã tạo →
                </Link>
              ) : null}
            </>
          ) : null
        }
      />

      <RejectModal
        isOpen={rejectOpen}
        onClose={() => {
          if (!actionLoading) setRejectOpen(false);
        }}
        onConfirm={handleReject}
        title="Từ chối đề xuất đặt trước"
        message="Vui lòng cho biết lý do. Yêu cầu sẽ được đóng sau khi từ chối."
        showToast={false}
        loading={actionLoading}
      />
    </div>
  );
}
