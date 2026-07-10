import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PreOrderProposeModal from "../../../components/Dealer/PreOrder/PreOrderProposeModal";
import RejectModal from "../../../components/common/RejectModal";
import SupplierFilter from "../../../components/Dealer/Supplier/SupplierFilter";
import {
  dealerPreOrderService,
  handleApiError,
} from "../../../services/api/dealerPreOrderService";
import { useOrderRealtimeRefresh } from "../../../hooks/useOrderRealtimeRefresh";
import { ORDER_REFERENCE_TYPES } from "../../../utils/orderRealtimeUtils";
import { PREORDER_STATUS_LABELS } from "../../../utils/buyerPreorderUtils";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "submitted", label: "Chờ xử lý" },
  { value: "customer_confirmation_pending", label: "Chờ khách xác nhận" },
  { value: "converted", label: "Đã chuyển đơn" },
  { value: "rejected_by_dealer", label: "Đã từ chối" },
  { value: "rejected_by_customer", label: "Khách từ chối" },
];

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function DealerPreOrderPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
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
        status: statusFilter,
        page_size: 20,
      });
      setRequests(data.results ?? []);
    } catch (err) {
      if (!silent) toast.error(handleApiError(err, "Không tải được YC đặt trước"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  const fetchDetail = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await dealerPreOrderService.getById(id);
      setDetail(data);
    } catch (err) {
      toast.error(handleApiError(err, "Không tải được chi tiết YC"));
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (selected?.id) fetchDetail(selected.id);
    else setDetail(null);
  }, [selected, fetchDetail]);

  useOrderRealtimeRefresh({
    referenceTypes: [ORDER_REFERENCE_TYPES.CUSTOMER_PREORDER_REQUEST],
    watchOrderId: selected?.id,
    onRefresh: () => fetchList({ silent: true }),
    onDetailRefresh: () => {
      if (selected?.id) fetchDetail(selected.id);
    },
  });

  const handleConfirm = async () => {
    if (!selected?.id) return;
    setActionLoading(true);
    try {
      await dealerPreOrderService.confirm(selected.id, {});
      toast.success("Đã tạo đơn chờ hàng cho khách");
      await fetchList({ silent: true });
      await fetchDetail(selected.id);
    } catch (err) {
      toast.error(handleApiError(err, "Không thể xác nhận YC"));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePropose = async (payload) => {
    if (!selected?.id) return;
    setActionLoading(true);
    try {
      await dealerPreOrderService.propose(selected.id, payload);
      toast.success("Đã gửi đề xuất cho khách hàng");
      setProposeOpen(false);
      await fetchList({ silent: true });
      await fetchDetail(selected.id);
    } catch (err) {
      toast.error(handleApiError(err, "Không thể gửi đề xuất"));
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    if (!selected?.id) return;
    setActionLoading(true);
    try {
      await dealerPreOrderService.reject(selected.id, { reason });
      toast.success("Đã từ chối yêu cầu");
      setRejectOpen(false);
      await fetchList({ silent: true });
      await fetchDetail(selected.id);
    } catch (err) {
      toast.error(handleApiError(err, "Không thể từ chối YC"));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Yêu cầu đặt trước</h1>
        <p className="mt-1 text-sm text-gray-500">
          Xử lý các yêu cầu đặt hàng vượt tồn kho từ khách hàng.
        </p>
      </div>

      <SupplierFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        filterOptions={STATUS_OPTIONS}
        placeholder="Tìm mã YC, tên khách..."
      />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-medium text-gray-700">Chưa có yêu cầu đặt trước</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Mã YC</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Giao dự kiến</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`cursor-pointer hover:bg-emerald-50 ${selected?.id === item.id ? "bg-emerald-50" : ""
                      }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{item.request_code}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.status_label ?? PREORDER_STATUS_LABELS[item.status] ?? item.status}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDateTime(item.requested_delivery_time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            {!selected ? (
              <p className="text-sm text-gray-500">Chọn một yêu cầu để xử lý.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase text-gray-500">Mã YC</p>
                  <p className="font-semibold text-gray-900">{detail?.request_code ?? selected.request_code}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Trạng thái</p>
                  <p className="text-gray-800">
                    {detail?.status_label ??
                      PREORDER_STATUS_LABELS[detail?.status ?? selected.status]}
                  </p>
                </div>
                {(detail?.items ?? []).map((item) => (
                  <div key={item.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <p className="font-medium text-gray-900">{item.product_title}</p>
                    <p className="text-gray-600">
                      Yêu cầu {item.requested_quantity} {item.unit}
                    </p>
                  </div>
                ))}

                {detail?.status === "submitted" ? (
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleConfirm}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Xác nhận theo yêu cầu
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setProposeOpen(true)}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Đề xuất điều chỉnh
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setRejectOpen(true)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                    >
                      Từ chối
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
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
