import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import RejectModal from "../../../components/common/RejectModal";
import { appToast } from "../../../components/common/toast";
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

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function PreOrderRequestsPage() {
  const dealerSlug = useDealerSlug();
  const paths = useStorefrontPaths();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-emerald-950">Yêu cầu đặt trước</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Theo dõi và xác nhận đề xuất từ đại lý khi đặt hàng vượt tồn kho.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-neutral-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Đang tải...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-6 py-10 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-neutral-400" />
          <p className="mt-3 font-medium text-emerald-950">Chưa có yêu cầu đặt trước</p>
          <Link
            to={paths.checkout}
            className="mt-4 inline-block text-sm font-semibold text-teal-800 no-underline"
          >
            Quay lại đặt hàng
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-3">
            {requests.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-xl border px-4 py-4 text-left transition-colors ${
                  selectedId === item.id
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-stone-200 bg-white hover:border-emerald-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-emerald-950">{item.requestCode}</p>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                    {item.statusLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-600">
                  {item.itemCount} sản phẩm • Giao dự kiến{" "}
                  {formatDateTime(item.requestedDeliveryTime)}
                </p>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5">
            {!selectedId ? (
              <p className="text-sm text-neutral-500">Chọn một yêu cầu để xem chi tiết.</p>
            ) : detailLoading && !selectedSummary ? (
              <div className="flex items-center text-sm text-neutral-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải chi tiết...
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Mã YC</p>
                  <p className="font-semibold text-emerald-950">
                    {selectedSummary?.requestCode}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Trạng thái</p>
                  <p className="font-medium text-neutral-800">
                    {selectedSummary?.statusLabel}
                  </p>
                </div>

                {(detail?.items ?? []).map((item) => (
                  <div key={item.id} className="rounded-lg bg-stone-50 px-3 py-2 text-sm">
                    <p className="font-medium text-emerald-950">{item.productTitle}</p>
                    <p className="text-neutral-600">
                      Yêu cầu {item.requestedQuantity} {item.unit}
                      {item.proposedQuantity != null
                        ? ` • Đại lý đề xuất ${item.proposedQuantity}`
                        : ""}
                    </p>
                  </div>
                ))}

                {detail?.proposedDeliveryTime ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Ngày giao đề xuất
                    </p>
                    <p className="text-sm text-neutral-800">
                      {formatDateTime(detail.proposedDeliveryTime)}
                    </p>
                  </div>
                ) : null}

                {detail?.dealerNote ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Ghi chú đại lý
                    </p>
                    <p className="text-sm text-neutral-700">{detail.dealerNote}</p>
                  </div>
                ) : null}

                {canAcceptPreOrder(selectedSummary) ? (
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleAccept}
                      className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Đồng ý đề xuất
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setRejectOpen(true)}
                      className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700"
                    >
                      Từ chối
                    </button>
                  </div>
                ) : null}

                {selectedSummary?.convertedOrderId ? (
                  <Link
                    to={paths.orderStatus}
                    className="inline-block text-sm font-semibold text-teal-800 no-underline"
                  >
                    Xem đơn hàng đã tạo
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

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
