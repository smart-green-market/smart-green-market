import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  Store,
  UserRound,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  DealerCustomerTable,
  DealerSegmentChart,
  DealerSegmentTable,
} from "../../components/Admin/Dealer/DealerDetailSections";
import { getDealerDisplayStatus } from "../../components/Admin/Dealer/DealerFilter";
import { getDealerApprovalDocumentError } from "../../components/Admin/Dealer/dealerDocumentHelpers";
import ConfirmModal from "../../components/common/ConfirmModal";
import RejectModal from "../../components/common/RejectModal";
import { formatDateTime } from "../../components/common/formatDateTime";
import { appToast } from "../../components/common/toast";
import { aiTrainingServicer } from "../../services/api/Admin/aiTrainingServicer";
import {
  adminSegmentAiService,
  handleSegmentAiError,
} from "../../services/api/Admin/adminSegmentAiService";
import { adminDealerService } from "../../services/api/Admin/adminDealerService";
import { dealerService, handleApiError } from "../../services/api/dealerService";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const SEGMENT_PAGE_SIZE = 5;
const CUSTOMER_PAGE_SIZE = 10;

const SEGMENT_LABELS = {
  VIP: "Khách hàng VIP",
  LOYAL: "Khách hàng trung thành",
  POTENTIAL: "Khách hàng tiềm năng",
  AT_RISK: "Khách hàng có nguy cơ rời bỏ",
  PASSIVE: "Khách hàng thụ động",
  NEW: "Khách hàng mới",
};

const DEALER_STATUS = {
  active: { label: "Đang hoạt động", className: "bg-emerald-100 text-emerald-700" },
  inactive: { label: "Tạm khóa", className: "bg-neutral-200 text-neutral-700" },
  banned: { label: "Bị cấm", className: "bg-red-100 text-red-700" },
  pending: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-700" },
  rejected: { label: "Từ chối", className: "bg-rose-100 text-rose-700" },
};

export default function DetailDealerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [dealerLoading, setDealerLoading] = useState(true);
  const [dealerError, setDealerError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const [segments, setSegments] = useState([]);
  const [segmentPage, setSegmentPage] = useState(1);
  const [segmentCount, setSegmentCount] = useState(0);
  const [segmentLoading, setSegmentLoading] = useState(true);
  const [segmentError, setSegmentError] = useState("");
  const [segmentHistory, setSegmentHistory] = useState([]);
  const [segmentHistoryLoading, setSegmentHistoryLoading] = useState(true);
  const [segmentHistoryError, setSegmentHistoryError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerCount, setCustomerCount] = useState(0);
  const [countSegment, setCountSegment] = useState({});
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSegmentCode, setCustomerSegmentCode] = useState("");
  const customerRequestIdRef = useRef(0);
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 350);
  const routeDealerId = Number(id);
  const selectedDealerId = Number.isFinite(routeDealerId) ? routeDealerId : null;

  const fetchDealer = useCallback(async () => {
    try {
      setDealerLoading(true);
      setDealerError("");
      const data = await dealerService.getById(id);
      setDealer(data);
      return data;
    } catch (error) {
      setDealerError(handleApiError(error, "Không thể tải thông tin đại lý"));
      return null;
    } finally {
      setDealerLoading(false);
    }
  }, [id]);

  const fetchSegments = useCallback(async (page = 1) => {
    try {
      setSegmentLoading(true);
      setSegmentError("");
      const data = await aiTrainingServicer.customerSegment({
        page,
        page_size: SEGMENT_PAGE_SIZE,
      });
      setSegments(Array.isArray(data?.results) ? data.results : []);
      setSegmentCount(Number(data?.count) || 0);
      setSegmentPage(Number(data?.page) || page);
    } catch (error) {
      setSegmentError(handleApiError(error, "Không thể tải danh sách nhóm khách hàng"));
    } finally {
      setSegmentLoading(false);
    }
  }, []);

  const fetchDealerCustomers = useCallback(async (page = 1) => {
    if (!selectedDealerId) return;
    const requestId = ++customerRequestIdRef.current;
    try {
      setCustomerLoading(true);
      setCustomerError("");
      const data = await adminDealerService.getCustomers({
        dealer_id: Number(selectedDealerId),
        page,
        page_size: CUSTOMER_PAGE_SIZE,
        search: debouncedCustomerSearch || undefined,
        segment_code: customerSegmentCode || undefined,
      });
      if (requestId !== customerRequestIdRef.current) return;
      setCustomers(data.results);
      setCustomerCount(data.count);
      const hasSecondaryFilter = Boolean(
        debouncedCustomerSearch ||
        customerSegmentCode,
      );
      if (!hasSecondaryFilter) {
        setCountSegment(data.count_segment || {});
      }
      setCustomerPage(data.page || page);
    } catch (error) {
      if (requestId !== customerRequestIdRef.current) return;
      setCustomerError(handleApiError(error, "Không thể tải khách hàng của đại lý"));
    } finally {
      if (requestId === customerRequestIdRef.current) {
        setCustomerLoading(false);
      }
    }
  }, [
    customerSegmentCode,
    debouncedCustomerSearch,
    selectedDealerId,
  ]);

  const fetchSegmentHistory = useCallback(async () => {
    if (!selectedDealerId) return;
    setSegmentHistoryLoading(true);
    setSegmentHistoryError("");
    try {
      const data = await adminSegmentAiService.getDealerHistory(selectedDealerId);
      setSegmentHistory(data);
    } catch (error) {
      setSegmentHistoryError(
        handleSegmentAiError(error, "Không thể tải lịch sử phân loại của đại lý"),
      );
    } finally {
      setSegmentHistoryLoading(false);
    }
  }, [selectedDealerId]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchDealer(), fetchSegments(1)]);
    };
    load();
  }, [fetchDealer, fetchSegments]);

  useEffect(() => {
    const load = async () => {
      await fetchDealerCustomers(1);
    };
    load();
  }, [fetchDealerCustomers]);

  useEffect(() => {
    if (!selectedDealerId) return;
    // Đồng bộ lịch sử AI 60 ngày khi đã xác định đúng dealer từ route chi tiết.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSegmentHistory();
  }, [fetchSegmentHistory, selectedDealerId]);

  const segmentFilterOptions = useMemo(() => {
    const options = new Map();
    segments.forEach((segment) => {
      if (segment.code) options.set(segment.code, segment.name || segment.code);
    });
    Object.keys(countSegment || {}).forEach((code) => {
      if (!options.has(code)) {
        options.set(code, SEGMENT_LABELS[String(code).toUpperCase()] || formatCodeLabel(code));
      }
    });
    return Array.from(options, ([value, label]) => ({ value, label }));
  }, [countSegment, segments]);

  const displayStatus = getDealerDisplayStatus({
    status: dealer?.status,
    account_status: dealer?.account?.status,
    account: dealer?.account,
  });

  const executeDealerAction = async (action) => {
    try {
      setActionLoading(true);
      await action();
      await fetchDealer();
    } catch (error) {
      throw new Error(
        handleApiError(error, "Không thể cập nhật trạng thái đại lý"),
        { cause: error },
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openApprove = () => {
    const documentError = getDealerApprovalDocumentError(dealer?.documents || []);
    if (documentError) {
      appToast.warning(documentError);
      return;
    }
    setConfirmConfig({
      title: "Duyệt đại lý",
      message: `Bạn có chắc chắn muốn duyệt “${dealer.store_name}” không?`,
      confirmText: "Duyệt",
      variant: "success",
      action: () => dealerService.verify(dealer.id, { status: "active" }),
    });
  };

  const openAccountStatusConfirm = (status) => {
    const unlocking = status === "active";
    setConfirmConfig({
      title: unlocking ? "Mở khóa đại lý" : "Khóa đại lý",
      message: `Bạn có chắc chắn muốn ${unlocking ? "mở khóa" : "khóa"} “${dealer.store_name}” không?`,
      confirmText: unlocking ? "Mở khóa" : "Khóa",
      variant: unlocking ? "success" : "warning",
      action: () =>
        dealerService.statusUpdate(dealer.id, {
          status,
          reason: unlocking ? "Mở khóa bởi admin" : "Tạm khóa bởi admin",
        }),
    });
  };

  const handleConfirm = async () => {
    if (!confirmConfig?.action) return;
    await executeDealerAction(confirmConfig.action);
    setConfirmConfig(null);
  };

  const handleReject = async (reason) => {
    await executeDealerAction(() =>
      dealerService.verify(dealer.id, {
        status: "rejected",
        rejection_reason: reason,
      }),
    );
    setRejectOpen(false);
  };

  if (dealerLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (dealerError || !dealer) {
    return (
      <div className="px-8 py-10">
        <button
          type="button"
          onClick={() => navigate("/quan-tri/dai-ly")}
          className="mb-6 flex cursor-pointer items-center gap-2 text-sm font-bold text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </button>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-700">
          <p className="font-semibold">{dealerError || "Không tìm thấy đại lý."}</p>
          <button
            type="button"
            onClick={fetchDealer}
            className="mt-4 cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-8 pb-12 pt-6">
      <button
        type="button"
        onClick={() => navigate("/quan-tri/dai-ly")}
        className="flex w-fit cursor-pointer items-center gap-2 text-sm font-bold text-neutral-600 transition hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại quản lý đại lý
      </button>

      <DealerInformation
        dealer={dealer}
        displayStatus={displayStatus}
        actionLoading={actionLoading}
        onApprove={openApprove}
        onReject={() => setRejectOpen(true)}
        onLock={() => openAccountStatusConfirm("inactive")}
        onUnlock={() => openAccountStatusConfirm("active")}
      />

      <DealerSegmentChart
        data={segmentHistory}
        loading={segmentHistoryLoading}
        error={segmentHistoryError}
        onRetry={fetchSegmentHistory}
      />

      <DealerSegmentTable
        rows={segments}
        loading={segmentLoading}
        error={segmentError}
        page={segmentPage}
        pageSize={SEGMENT_PAGE_SIZE}
        totalCount={segmentCount}
        onPageChange={fetchSegments}
        onRetry={() => fetchSegments(segmentPage)}
      />

      <DealerCustomerTable
        rows={customers}
        page={customerPage}
        pageSize={CUSTOMER_PAGE_SIZE}
        totalCount={customerCount}
        onPageChange={fetchDealerCustomers}
        loading={customerLoading}
        error={customerError}
        onRetry={() => fetchDealerCustomers(customerPage)}
        search={customerSearch}
        onSearchChange={setCustomerSearch}
        segmentCode={customerSegmentCode}
        onSegmentChange={setCustomerSegmentCode}
        segmentOptions={segmentFilterOptions}
      />

      <ConfirmModal
        isOpen={confirmConfig !== null}
        onClose={() => setConfirmConfig(null)}
        onConfirm={handleConfirm}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        confirmText={confirmConfig?.confirmText}
        variant={confirmConfig?.variant}
        loading={actionLoading}
      />
      <RejectModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        title="Từ chối đại lý"
        message={`Bạn có chắc chắn muốn từ chối “${dealer.store_name}” không?`}
        loading={actionLoading}
      />
    </div>
  );
}

function formatCodeLabel(value) {
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function DealerInformation({
  dealer,
  displayStatus,
  actionLoading,
  onApprove,
  onReject,
  onLock,
  onUnlock,
}) {
  const status = DEALER_STATUS[displayStatus] || DEALER_STATUS.pending;
  const documentError = getDealerApprovalDocumentError(dealer.documents || []);

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 px-6 py-7 text-white">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            {dealer.account?.avatar_url ? (
              <img
                src={dealer.account.avatar_url}
                alt={dealer.store_name}
                className="h-20 w-20 rounded-2xl border-4 border-white/30 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15">
                <Store className="h-9 w-9" />
              </div>
            )}
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black">{dealer.store_name}</h1>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-emerald-50">Mã cửa hàng: {dealer.slug || dealer.id}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(displayStatus === "pending" || displayStatus === "rejected") ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={onApprove}
                className="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                Duyệt đại lý
              </button>
            ) : null}
            {displayStatus === "active" || displayStatus === "pending" ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={onReject}
                className="cursor-pointer rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400 disabled:opacity-50"
              >
                Từ chối
              </button>
            ) : null}
            {displayStatus === "active" ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={onLock}
                className="cursor-pointer rounded-lg border border-white/40 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50"
              >
                Khóa tài khoản
              </button>
            ) : null}
            {displayStatus === "inactive" ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={onUnlock}
                className="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                Mở khóa
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-base font-bold text-neutral-900">Thông tin đại lý</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem icon={UserRound} label="Chủ đại lý" value={dealer.account?.full_name} />
            <InfoItem icon={Mail} label="Email" value={dealer.account?.email} />
            <InfoItem icon={Phone} label="Số điện thoại" value={dealer.account?.phone} />
            <InfoItem icon={MapPin} label="Địa chỉ" value={dealer.store_address} />
            <InfoItem icon={CalendarDays} label="Ngày đăng ký" value={formatDateTime(dealer.created_at)} />
            <InfoItem icon={CalendarDays} label="Cập nhật gần nhất" value={formatDateTime(dealer.updated_at)} />
          </div>
          <div className="rounded-xl bg-neutral-50 px-4 py-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-400">Mô tả</p>
            <p className="text-sm leading-6 text-neutral-700">{dealer.description || "Chưa có mô tả."}</p>
          </div>
          {dealer.rejection_reason ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <strong>Lý do từ chối:</strong> {dealer.rejection_reason}
            </div>
          ) : null}
        </div>

        <div>
          <h2 className="mb-4 text-base font-bold text-neutral-900">Giấy tờ xác minh</h2>
          <div className="space-y-3">
            {(dealer.documents || []).map((document) => (
              <div key={document.id} className="rounded-xl border border-neutral-200 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-neutral-400" />
                    <span className="truncate text-sm font-semibold text-neutral-800">
                      {document.document_type_label || document.document_type}
                    </span>
                  </div>
                  {document.file_url ? (
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:text-emerald-600"
                      aria-label="Xem giấy tờ"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
                <p className="mt-2 text-xs font-bold text-neutral-500">
                  {document.status === "approved"
                    ? "Đã duyệt"
                    : document.status === "rejected"
                      ? "Từ chối"
                      : "Chờ duyệt"}
                </p>
              </div>
            ))}
            {dealer.documents?.length ? null : (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Chưa tải lên giấy tờ.</p>
            )}
            {documentError ? <p className="text-xs leading-5 text-amber-700">{documentError}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-xl border border-neutral-100 px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-neutral-800">{value || "-"}</p>
      </div>
    </div>
  );
}
