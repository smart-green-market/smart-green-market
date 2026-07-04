import { useState, useEffect } from "react";
import {
  X, CheckCheck, Truck, PackageCheck,
  MapPin, Phone, User, Store, CreditCard,
  Calendar, CalendarClock, CheckCircle2, XCircle,
  Printer, Loader2, Pencil, RotateCcw,
} from "lucide-react";

import {
  orderService,
  parseOrderDetail,
  findPendingPayment,
  findPendingReturnRequest,
  canReviewReturnRequest,
  mergeOrderDetail,
  sortPaymentsForDisplay,
  canVerifyPayment,
  buildConfirmOrderPayload,
  sortReturnsNewestFirst,
} from "../../../../services/api/orderService";
import { supplierService } from "../../../../services/api/suppilerService";
import { toast } from "sonner";

import { ORDER_STEPS, STEP_INDEX, SUB_STATUS_LABEL, PAYMENT_STATUS } from "./constants";
import { fmtPrice, fmtDate, fmtDateShort, getApiErrorMessage, buildPrintHtml } from "./utils";

// Components
import ItemList               from "./components/ItemList";
import PaymentReceiptCard    from "./components/PaymentReceiptCard";
import PrintPreviewModal     from "./components/PrintPreviewModal";
import ConfirmOrderModal     from "./components/ConfirmOrderModal";
import RejectOrderModal      from "./components/RejectOrderModal";
import ConfirmShippingModal  from "./components/ConfirmShippingModal";
import RejectPaymentModal    from "./components/RejectPaymentModal";
import ReturnRequestCard     from "./components/ReturnRequestCard";
import InfoCard              from "./shared/InfoCard";
import { InfoRow, MetaItem, SummaryRow } from "./shared/typography";

// ─── MAIN MODAL ─────────────────────────────────────────────────────────────
export default function DetailOrderModal({ isOpen, onClose, order: initialOrder, onUpdate }) {
  const [order, setOrder]                           = useState(null);
  const [supplier, setSupplier]                     = useState(null);
  const [loadingDetail, setLoadingDetail]           = useState(false);
  const [detailFetched, setDetailFetched]           = useState(false);
  const [detailError, setDetailError]               = useState("");

  // Modal visibility
  const [confirmModal, setConfirmModal]             = useState(false);
  const [rejectModal, setRejectModal]               = useState(false);
  const [shippingModal, setShippingModal]           = useState(false);
  const [rejectDepositModal, setRejectDepositModal] = useState(false);
  const [rejectFinalModal, setRejectFinalModal]     = useState(false);
  const [rejectReturnModal, setRejectReturnModal]   = useState(false);
  const [rejectItemModal, setRejectItemModal]       = useState(null);
  const [printModal, setPrintModal]                 = useState(false);
  const [lightboxImg, setLightboxImg]               = useState(null);

  // Action loading states
  const [loading, setLoading]                       = useState(false);
  const [rejectLoading, setRejectLoading]           = useState(false);
  const [shippingLoading, setShippingLoading]       = useState(false);
  const [verifyDepositLoading, setVerifyDepositLoading] = useState(false);
  const [verifyFinalLoading, setVerifyFinalLoading]     = useState(false);
  const [reviewReturnLoading, setReviewReturnLoading]   = useState(false);

  // Deposit input
  const [depositPct, setDepositPct]                 = useState("");
  const [depositErr, setDepositErr]                 = useState("");

  // Delivery date override
  const [deliveryDate, setDeliveryDate]             = useState("");
  const [editingDelivery, setEditingDelivery]       = useState(false);

  // ── Fetch supplier info ─────────────────────────────────────────
  useEffect(() => {
    supplierService.getAll().then(setSupplier).catch(console.error);
  }, []);

  // ── Fetch order detail when modal opens ─────────────────────────
  useEffect(() => {
    if (!isOpen || !initialOrder?.id) {
      setOrder(null);
      setLoadingDetail(false);
      setDetailError("");
      return;
    }

    // Reset all state
    setConfirmModal(false);
    setRejectModal(false);
    setShippingModal(false);
    setRejectDepositModal(false);
    setRejectFinalModal(false);
    setRejectReturnModal(false);
    setRejectItemModal(null);
    setPrintModal(false);
    setLightboxImg(null);

    setDetailError("");
    setLoading(false);
    setRejectLoading(false);
    setShippingLoading(false);
    setVerifyDepositLoading(false);
    setVerifyFinalLoading(false);
    setReviewReturnLoading(false);
    setDepositPct("");
    setDepositErr("");
    setDeliveryDate("");
    setEditingDelivery(false);

    const incoming = parseOrderDetail(initialOrder);
    setOrder(incoming);

    let cancelled = false;
    setLoadingDetail(true);

    orderService
      .getById(initialOrder.id)
      .then((detail) => {
        if (cancelled) return;
        setOrder((prev) => mergeOrderDetail(prev, detail));
        setDetailFetched(true);
        const full = mergeOrderDetail(incoming, detail);
        if (!full?.items?.length) setDetailError("Đơn hàng chưa có sản phẩm nào.");
      })
      .catch((err) => {
        console.error("[DetailOrderModal] fetch detail error:", err);
        if (!cancelled) setDetailError("Không tải được danh sách sản phẩm. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => { cancelled = true; };
  }, [isOpen, initialOrder?.id]);

  // ── Keyboard / scroll lock ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !order) return null;

  // ── Derived state ────────────────────────────────────────────────
  const items        = Array.isArray(order.items) ? order.items : [];
  const total        = items.length;
  const approved     = items.filter(i => i.item_status === "approved").length;
  const rejected     = items.filter(i => i.item_status === "rejected").length;
  const processed    = approved + rejected;
  const allDone      = processed === total && total > 0;
  const rejectedMissingReason = items.filter(
    (i) => i.item_status === "rejected" && !(i.reject_reason ?? i.rejection_reason ?? "").trim(),
  ).length;
  const isPending    = order.status === "pending_supplier_confirmation";
  const isProcessing = order.status === "processing";
  const depositNum   = parseFloat(depositPct);
  const depositValid = !isNaN(depositNum) && depositNum >= 10 && depositNum <= 50;
  const canConfirm   = isPending && allDone && approved > 0 && depositValid && rejectedMissingReason === 0;

  const isDepositPendingVerify = order.status === "deposit_pending_verification";
  const isFinalPendingVerify   = order.status === "final_payment_pending_verification";
  const isReturnPendingReview  = canReviewReturnRequest(order);
  const canEditDelivery        = isPending;
  const needsPaymentVerify     = isDepositPendingVerify || isFinalPendingVerify;
  const pendingReturnRequest   = findPendingReturnRequest(order);
  const sortedReturns          = sortReturnsNewestFirst(order.returns);
  const showReturnsSection     = sortedReturns.length > 0 || Boolean(pendingReturnRequest);
  const returnSummary          = order.return_summary;
  const sortedPayments         = sortPaymentsForDisplay(order.payments);
  const pendingDepositPayment  = findPendingPayment(order.payments, "deposit");
  const pendingFinalPayment    = findPendingPayment(order.payments, "final_payment");

  const stepIdx       = STEP_INDEX[order.status] ?? 0;
  const isTerminalBad = order.status === "rejected" || order.status === "cancelled";
  const hasConfirmedDelivery = Boolean(order.confirmed_delivery_time);
  const confirmedDeliveryDisplay = hasConfirmedDelivery ? fmtDateShort(order.confirmed_delivery_time) : null;

  // Tổng tiền tính lại tại chỗ từ danh sách item (loại trừ sản phẩm đã từ chối) —
  // chỉ áp dụng khi đơn còn đang chờ xác nhận (supplier có thể duyệt/từ chối/sửa số lượng).
  // Sau khi đơn đã xác nhận, dùng order.total_amount từ server làm chuẩn.
  const computedTotal = items.reduce(
    (s, i) => s + (i.item_status === "rejected" ? 0 : Number(i.subtotal || 0)),
    0,
  );
  const displayTotalAmount = isPending ? computedTotal : Number(order.total_amount || 0);

  // ── Helpers ──────────────────────────────────────────────────────
  const refreshOrderDetail = async () => {
    const detail = await orderService.getById(order.id);
    setOrder((prev) => mergeOrderDetail(prev, detail));
    setDetailFetched(true);
    return detail;
  };

  const setItemStatus = (id, status, reason = "") =>
    setOrder(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? {
        ...i,
        item_status: status,
        reject_reason: status === "rejected" ? reason : "",
        rejection_reason: status === "rejected" ? reason : "",
      } : i),
    }));

  const applyItemQuantities = (changes) => {
    setOrder((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        const change = changes.find((c) => String(c.id) === String(it.id));
        if (!change) return it;
        const qty = String(change.quantity);
        const unitPrice = Number(it.unit_price);
        return {
          ...it,
          quantity: qty,
          subtotal: String(Number(qty) * unitPrice),
        };
      }),
    }));
  };

  const approveAll = () =>
    setOrder(prev => ({ ...prev, items: prev.items.map(i => ({ ...i, item_status: "approved", reject_reason: "" })) }));

  // ── Actions ───────────────────────────────────────────────────────
  const confirmOrder = async () => {
    setLoading(true);
    try {
      const resolvedDate = deliveryDate
        ? new Date(`${deliveryDate}T00:00:00`).toISOString()
        : order.requested_delivery_time;

      if (!resolvedDate) {
        toast.error("Vui lòng chọn ngày giao hàng trước khi xác nhận.");
        setLoading(false);
        return;
      }

      const payload = buildConfirmOrderPayload({
        items,
        depositPercent: depositNum,
        confirmedDeliveryTime: resolvedDate,
        note: "",
      });

      const updated = await orderService.confirmOrder(order.id, payload);
      setOrder((prev) => mergeOrderDetail(prev, updated) ?? updated ?? {
        ...order,
        status: "confirmed",
        deposit_percent: String(depositNum),
        confirmed_delivery_time: resolvedDate,
      });
      setConfirmModal(false);
      toast.success("Đã xác nhận đơn hàng thành công");
      onUpdate?.();
    } catch (err) {
      console.log("confirm 400 detail:", err?.response?.data);
      toast.error(getApiErrorMessage(err, "Không thể xác nhận đơn hàng. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  const saveDeliveryDate = () => {
    if (!deliveryDate) {
      toast.error("Vui lòng chọn ngày giao hàng");
      return;
    }
    setEditingDelivery(false);
    toast.success("Đã chọn ngày giao — sẽ gửi khi xác nhận đơn hàng");
  };

  const rejectOrder = async (rejectionReason) => {
    setRejectLoading(true);
    try {
      const updated = await orderService.rejectOrder(order.id, { rejection_reason: rejectionReason.trim() });
      setOrder(updated ?? { ...order, status: "rejected", rejection_reason: rejectionReason.trim() });
      setRejectModal(false);
      toast.success("Đã từ chối đơn hàng");
      onUpdate?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể từ chối đơn hàng. Vui lòng thử lại."));
    } finally {
      setRejectLoading(false);
    }
  };

  const confirmShipping = async () => {
    setShippingLoading(true);
    try {
      const updated = await orderService.confirmShipping(order.id, {});
      setOrder((prev) => mergeOrderDetail(prev, updated) ?? { ...prev, status: "shipping" });
      setShippingModal(false);
      toast.success("Đã chuyển đơn hàng sang trạng thái đang giao");
      onUpdate?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể chuyển trạng thái giao hàng. Vui lòng thử lại."));
    } finally {
      setShippingLoading(false);
    }
  };

  const verifyPaymentAction = async (payment, action, rejectionReason = "") => {
    const isDeposit  = payment.payment_type === "deposit";
    const setVLoad   = isDeposit ? setVerifyDepositLoading : setVerifyFinalLoading;
    setVLoad(true);
    try {
      await orderService.verifyPayment(order.id, {
        payment_id:       payment.id,
        status:           action === "approve" ? "verified" : "rejected",
        rejection_reason: rejectionReason,
      });
      await refreshOrderDetail();
      setRejectDepositModal(false);
      setRejectFinalModal(false);
      const label = isDeposit ? "tiền cọc" : "thanh toán cuối";
      toast.success(action === "approve" ? `Đã duyệt ${label} thành công` : `Đã từ chối ${label}`);
      onUpdate?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xác nhận thanh toán. Vui lòng thử lại."));
    } finally {
      setVLoad(false);
    }
  };

  const reviewReturnAction = async (approved, reviewNote = "") => {
    const returnId = pendingReturnRequest?.id ?? order.return_id ?? order.latest_return_id;
    if (!returnId) {
      toast.error("Không tìm thấy yêu cầu trả hàng để xử lý.");
      return;
    }

    setReviewReturnLoading(true);
    try {
      const updated = await orderService.reviewReturn(order.id, returnId, {
        approved,
        review_note: reviewNote.trim(),
      });
      setOrder((prev) => mergeOrderDetail(prev, updated) ?? prev);
      await refreshOrderDetail();
      setRejectReturnModal(false);
      toast.success(approved ? "Đã duyệt yêu cầu trả hàng" : "Đã từ chối yêu cầu trả hàng");
      onUpdate?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xử lý yêu cầu trả hàng. Vui lòng thử lại."));
    } finally {
      setReviewReturnLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

        <div
          className="relative w-full max-w-5xl bg-neutral-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ animation: "modalIn 0.18s ease-out both", maxHeight: "92vh" }}
        >
          {/* ── Header / Timeline ── */}
          <div className="bg-white border-b border-neutral-200 flex-shrink-0 px-6 py-3 flex items-center gap-4">
            <div className="mr-auto min-w-0">
              <p className="text-[11px] text-neutral-400 leading-none">Chi tiết đơn hàng</p>
              <h2 className="text-base font-extrabold text-gray-900 truncate">#{order.order_code}</h2>
            </div>

            <button
              onClick={() => setPrintModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 transition-colors shrink-0"
            >
              <Printer size={13} /> In đơn
            </button>

            {hasConfirmedDelivery && !isTerminalBad && (
              <div
                className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 shrink-0 min-w-[108px]"
                title="Ngày giao NCC cam kết khi xác nhận phiếu"
              >
                <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wide leading-none">
                  Giao cam kết
                </span>
                <span className="text-sm font-extrabold text-emerald-800 leading-tight mt-0.5 whitespace-nowrap">
                  {confirmedDeliveryDisplay}
                </span>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-1 shrink-0">
              {isTerminalBad ? (
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                  order.status === "rejected"
                    ? "bg-red-100 text-red-600 border border-red-200"
                    : "bg-neutral-200 text-neutral-500 border border-neutral-300"
                }`}>
                  <XCircle size={11} />
                  {order.status === "rejected" ? "Đã từ chối" : "Đã hủy"}
                </span>
              ) : (
                ORDER_STEPS.map((step, idx) => {
                  const Icon   = step.icon;
                  const done   = idx < stepIdx;
                  const active = idx === stepIdx;
                  const subLabel = active ? SUB_STATUS_LABEL[order.status] : null;
                  const showCommittedDelivery =
                    step.key === "confirmed" && hasConfirmedDelivery && stepIdx >= 1;
                  return (
                    <div key={step.key} className="flex items-center gap-1">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                          active ? "bg-emerald-800 text-white" :
                          done   ? "bg-emerald-100 text-emerald-700" :
                                   "bg-neutral-100 text-neutral-400"
                        }`}>
                          <Icon size={11} />{step.label}
                        </div>
                        {showCommittedDelivery && (
                          <span
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full leading-tight whitespace-nowrap max-w-[140px] truncate"
                            title={confirmedDeliveryDisplay}
                          >
                            {confirmedDeliveryDisplay}
                          </span>
                        )}
                        {subLabel && (
                          <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-1.5 rounded-full leading-tight whitespace-nowrap">
                            {subLabel}
                          </span>
                        )}
                      </div>
                      {idx < ORDER_STEPS.length - 1 && (
                        <div className={`w-4 h-px mb-3 ${done ? "bg-emerald-300" : "bg-neutral-200"}`} />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 shrink-0 transition-colors" aria-label="Đóng">
              <X size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="overflow-y-auto flex-1 px-6 py-6 flex flex-col gap-5">

            {/* Thông tin chung */}
            <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetaItem icon={<Calendar size={14} className="text-emerald-700" />} label="Ngày đặt hàng">
                {fmtDate(order.created_at)}
              </MetaItem>
              <MetaItem icon={<CalendarClock size={14} className="text-emerald-700" />} label={hasConfirmedDelivery ? "Ngày giao cam kết" : "Ngày giao dự kiến"}>
                {canEditDelivery && editingDelivery ? (
                  <span className="flex items-center gap-2 mt-0.5">
                    <input
                      type="date"
                      value={deliveryDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={e => setDeliveryDate(e.target.value)}
                      autoFocus
                      className="px-2.5 py-1 text-sm border border-emerald-400 rounded-lg outline-none bg-white font-medium text-gray-900 focus:border-emerald-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={saveDeliveryDate}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                    >
                      Xong
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingDelivery(false)}
                      className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      Hủy
                    </button>
                  </span>
                ) : (
                  <span className="flex flex-col gap-0.5 mt-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className={hasConfirmedDelivery ? "text-base font-extrabold text-emerald-800" : "text-sm font-bold text-emerald-700"}>
                        {deliveryDate
                          ? fmtDateShort(`${deliveryDate}T00:00:00`)
                          : hasConfirmedDelivery
                            ? confirmedDeliveryDisplay
                            : fmtDateShort(order.requested_delivery_time)}
                      </span>
                      {canEditDelivery && (
                        <button
                          type="button"
                          onClick={() => {
                            const source = order.confirmed_delivery_time ?? order.requested_delivery_time;
                            if (!deliveryDate && source) {
                              setDeliveryDate(source.split("T")[0]);
                            }
                            setEditingDelivery(true);
                          }}
                          className="p-0.5 rounded text-neutral-300 hover:text-emerald-600 transition-colors"
                          title="Chỉnh ngày giao"
                        >
                          <Pencil size={11} />
                        </button>
                      )}
                    </span>
                    {hasConfirmedDelivery && order.requested_delivery_time && (
                      <span className="text-[11px] font-medium text-neutral-400">
                        Dealer mong: {fmtDateShort(order.requested_delivery_time)}
                      </span>
                    )}
                    {deliveryDate && !hasConfirmedDelivery && (
                      <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full self-start">
                        đã chọn — gửi khi xác nhận đơn
                      </span>
                    )}
                  </span>
                )}
              </MetaItem>
              <MetaItem icon={<CheckCircle2 size={14} className="text-emerald-700" />} label="Xác nhận lúc">
                {fmtDate(order.confirmed_at)}
              </MetaItem>
              <MetaItem icon={<Truck size={14} className="text-emerald-700" />} label="Giao hàng lúc">
                {fmtDate(order.delivered_at)}
              </MetaItem>
            </div>

            {/* Thông tin Đại lý + Nhà cung cấp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoCard icon={<User size={15} className="text-emerald-700" />} title="Thông tin Đại lý">
                <InfoRow label="Người nhận">{order.receiver_name}</InfoRow>
                <InfoRow label="Điện thoại">
                  <span className="flex items-center gap-1"><Phone size={12} />{order.receiver_phone}</span>
                </InfoRow>
                <InfoRow label="Địa chỉ giao">
                  <span className="flex items-start gap-1"><MapPin size={12} className="mt-0.5 shrink-0" />{order.delivery_address}</span>
                </InfoRow>
                {order.note && <InfoRow label="Ghi chú">{order.note}</InfoRow>}
              </InfoCard>

              <InfoCard icon={<Store size={15} className="text-emerald-700" />} title="Thông tin Nhà cung cấp">
                <InfoRow label="Nhà cung cấp"><span className="font-bold text-gray-900">{order.supplier_name}</span></InfoRow>
                {order.supplier_bank && supplier?.[0] && (
                  <>
                    <InfoRow label="Người đại diện">{supplier[0].account_name}</InfoRow>
                    <InfoRow label="Số điện thoại">{supplier[0].phone}</InfoRow>
                    <InfoRow label="Địa chỉ">{supplier[0].address}</InfoRow>
                  </>
                )}
              </InfoCard>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="bg-white rounded-2xl border border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">Danh sách sản phẩm</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">{total} sản phẩm</p>
                </div>
                {isPending && total > 0 && (
                  <button
                    type="button"
                    onClick={approveAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCheck size={13} /> Duyệt tất cả
                  </button>
                )}
              </div>

              {loadingDetail && total === 0 ? (
                <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-neutral-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách sản phẩm...
                </div>
              ) : detailError && total === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-red-500">{detailError}</div>
              ) : total === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-neutral-400">Đơn hàng chưa có sản phẩm nào.</div>
              ) : (
                <ItemList
                  items={items}
                  canEdit={isPending}
                  statusOrder={order.status}
                  onApprove={(id) => setItemStatus(id, "approved")}
                  onReject={(id) => setRejectItemModal(id)}
                  onReset={(id) => setItemStatus(id, "pending")}
                  onSaveQuantities={async (changes) => {
                    applyItemQuantities(changes);
                    toast.success("Đã áp dụng số lượng — sẽ gửi khi xác nhận đơn");
                  }}
                />
              )}

              {/* Progress bar khi pending */}
              {isPending && total > 0 && (
                <div className={`px-5 py-3 border-t border-neutral-100 flex items-center gap-4 ${
                  allDone ? "bg-emerald-50" : "bg-amber-50"
                }`}>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className={allDone ? "text-emerald-800" : "text-amber-800"}>
                        {allDone
                          ? "Tất cả sản phẩm đã được xử lý"
                          : `Đã xử lý ${processed}/${total} — cần duyệt hoặc từ chối tất cả sản phẩm`}
                      </span>
                      <span>
                        {approved > 0 && <span className="text-emerald-700 mr-2">✓ {approved} duyệt</span>}
                        {rejected > 0 && <span className="text-red-500">✗ {rejected} từ chối</span>}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : "bg-amber-400"}`}
                        style={{ width: `${total ? Math.round((processed / total) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chứng từ thanh toán */}
            {needsPaymentVerify && loadingDetail && (
              <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-8 flex items-center justify-center gap-2 text-sm text-neutral-500">
                <Loader2 size={16} className="animate-spin text-emerald-700" />
                Đang tải thông tin thanh toán...
              </div>
            )}

            {detailFetched && sortedPayments.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                  <CreditCard size={15} className="text-emerald-700" />
                  <h2 className="font-bold text-gray-900 text-sm">Chứng từ thanh toán</h2>
                </div>
                {sortedPayments.map((payment) => {
                  const canVerify    = canVerifyPayment(order.status, payment);
                  const isDeposit    = payment.payment_type === "deposit";
                  const verifyLoad   = isDeposit ? verifyDepositLoading : verifyFinalLoading;
                  const ps           = PAYMENT_STATUS[payment.status] ?? PAYMENT_STATUS.pending;
                  return (
                    <PaymentReceiptCard
                      key={payment.id}
                      payment={payment}
                      depositPercent={order.deposit_percent}
                      supplierBank={order.supplier_bank}
                      statusBadge={ps}
                      canVerify={canVerify}
                      verifyLoading={verifyLoad}
                      onZoom={setLightboxImg}
                      onApprove={() => verifyPaymentAction(payment, "approve")}
                      onReject={() => (isDeposit ? setRejectDepositModal(true) : setRejectFinalModal(true))}
                    />
                  );
                })}
              </div>
            )}

            {needsPaymentVerify && detailFetched && !loadingDetail && sortedPayments.length === 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 px-6 py-4 text-sm text-amber-800">
                Chưa có chứng từ thanh toán. Đại lý có thể chưa gửi biên lai chuyển khoản.
              </div>
            )}

            {/* Tổng kết */}
            <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <PackageCheck size={15} className="text-emerald-700" />
                <h2 className="font-bold text-gray-900 text-sm">Tổng kết đơn hàng</h2>
              </div>
              <div className="flex flex-col gap-2 text-sm max-w-sm ml-auto">
                <SummaryRow
                  label={`Tạm tính (${isPending ? total - rejected : total} sản phẩm${rejected > 0 && isPending ? `, ${rejected} từ chối` : ""})`}
                  value={fmtPrice(displayTotalAmount)}
                />
                {order.deposit_percent && (
                  <SummaryRow label={`Tiền cọc (${order.deposit_percent}%)`} value={fmtPrice(order.deposit_amount)} />
                )}
                <SummaryRow label="Đã thanh toán" value={fmtPrice(order.paid_amount)} className="text-emerald-700" />
                <SummaryRow label="Còn lại" value={fmtPrice(order.debt_amount)} className="text-red-500" />
                <div className="border-t border-neutral-100 pt-3 flex justify-between items-end mt-1">
                  <span className="text-neutral-500">Tổng thanh toán</span>
                  <span className="text-2xl font-extrabold text-emerald-800">{fmtPrice(displayTotalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Nút chuyển sang đang giao */}
            {isProcessing && (
              <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Truck size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-sm">Bắt đầu giao hàng</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Đơn hàng đang được chuẩn bị. Khi đã sẵn sàng, chuyển sang trạng thái đang giao.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShippingModal(true)}
                  disabled={shippingLoading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-60 shadow-sm shadow-blue-200 shrink-0"
                >
                  <Truck size={15} /> Chuyển sang đang giao
                </button>
              </div>
            )}

            {/* Nút xác nhận / từ chối đơn */}
            {isPending && (
              <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-5 flex flex-col gap-4">
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">Xác nhận đơn hàng</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Nhập tỉ lệ tiền cọc yêu cầu, sau đó xác nhận đơn hàng</p>
                </div>

                {/* Deposit input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-neutral-700">
                    Tỉ lệ tiền cọc <span className="text-red-500">*</span>
                    <span className="text-neutral-400 font-normal ml-1">(10% – 50%)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center border rounded-xl overflow-hidden transition-colors ${
                      depositErr ? "border-red-400" :
                      depositValid ? "border-emerald-500" :
                      "border-neutral-200 focus-within:border-emerald-500"
                    }`}>
                      <input
                        type="number"
                        min="10" max="50" step="1"
                        value={depositPct}
                        onChange={e => { setDepositPct(e.target.value); setDepositErr(""); }}
                        onBlur={() => {
                          if (depositPct === "") return;
                          const n = parseFloat(depositPct);
                          if (isNaN(n) || n < 10 || n > 50) setDepositErr("Tỉ lệ cọc phải từ 10% đến 50%");
                        }}
                        placeholder="VD: 30"
                        className="w-28 px-4 py-2.5 text-sm outline-none bg-white font-semibold text-gray-900"
                      />
                      <span className="px-3 py-2.5 bg-neutral-50 border-l border-neutral-200 text-sm font-semibold text-neutral-500">%</span>
                    </div>
                    {depositValid && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-neutral-400">=</span>
                        <span className="font-bold text-emerald-700">
                          {fmtPrice(Math.round(displayTotalAmount * depositNum / 100))}
                        </span>
                        <span className="text-xs text-neutral-400">/ tổng {fmtPrice(displayTotalAmount)}</span>
                      </div>
                    )}
                  </div>
                  {depositErr && <p className="text-xs text-red-500">{depositErr}</p>}
                </div>

                {/* Buttons */}
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl px-4 py-3 border ${
                  canConfirm ? "bg-emerald-50 border-emerald-200" : "bg-neutral-50 border-neutral-200"
                }`}>
                  <p className={`text-xs font-medium ${canConfirm ? "text-emerald-700" : "text-neutral-400"}`}>
                    {!allDone
                      ? "⚠ Cần duyệt hoặc từ chối tất cả sản phẩm"
                      : rejectedMissingReason > 0
                      ? `⚠ ${rejectedMissingReason} sản phẩm từ chối chưa có lý do`
                      : !depositValid
                      ? "⚠ Cần nhập tỉ lệ tiền cọc hợp lệ (10–50%)"
                      : `✓ ${approved} sản phẩm duyệt${rejected > 0 ? `, ${rejected} từ chối` : ""} · Cọc ${depositNum}%`}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRejectModal(true)}
                      disabled={rejectLoading || loading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-all disabled:opacity-60"
                    >
                      <XCircle size={15} /> Từ chối đơn hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmModal(true)}
                      disabled={!canConfirm || rejectLoading}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                        canConfirm
                          ? "bg-emerald-800 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200"
                          : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                      }`}
                    >
                      <CheckCheck size={15} /> Xác nhận đơn hàng
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Yêu cầu / lịch sử trả hàng */}
            {showReturnsSection && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw size={15} className="text-amber-600" />
                    <h2 className="font-bold text-gray-900 text-sm">
                      {isReturnPendingReview ? "Yêu cầu trả hàng" : "Lịch sử trả hàng"}
                    </h2>
                    {sortedReturns.length > 0 && (
                      <span className="text-xs text-neutral-400">
                        ({sortedReturns.length} lần)
                      </span>
                    )}
                  </div>
                  {returnSummary?.approved_refund_total > 0 && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      Đã hoàn: {fmtPrice(returnSummary.approved_refund_total)}
                    </span>
                  )}
                </div>

                {isReturnPendingReview && pendingReturnRequest &&
                  !sortedReturns.some((r) => r.id === pendingReturnRequest.id) && (
                  <ReturnRequestCard
                    returnRequest={pendingReturnRequest}
                    orderItems={items}
                    showActions
                    reviewLoading={reviewReturnLoading}
                    onApprove={() => reviewReturnAction(true, "")}
                    onReject={() => setRejectReturnModal(true)}
                  />
                )}

                {sortedReturns.map((ret) => (
                  <ReturnRequestCard
                    key={ret.id}
                    returnRequest={ret}
                    orderItems={items}
                    showActions={
                      isReturnPendingReview &&
                      pendingReturnRequest?.id === ret.id
                    }
                    reviewLoading={reviewReturnLoading}
                    onApprove={() => reviewReturnAction(true, "")}
                    onReject={() => setRejectReturnModal(true)}
                  />
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Nested modals ── */}
      {printModal && (
        <PrintPreviewModal
          htmlContent={buildPrintHtml({ order, supplier })}
          onClose={() => setPrintModal(false)}
        />
      )}
      {confirmModal && (
        <ConfirmOrderModal
          approved={approved} rejected={rejected} total={total}
          depositPct={depositNum}
          totalAmount={displayTotalAmount}
          deliveryDate={deliveryDate}
          originalDeliveryDate={order.requested_delivery_time}
          loading={loading}
          onClose={() => setConfirmModal(false)}
          onConfirm={confirmOrder}
        />
      )}
      {rejectModal && (
        <RejectOrderModal
          orderCode={order.order_code}
          loading={rejectLoading}
          onClose={() => setRejectModal(false)}
          onReject={rejectOrder}
        />
      )}
      {shippingModal && (
        <ConfirmShippingModal
          orderCode={order.order_code}
          loading={shippingLoading}
          onClose={() => setShippingModal(false)}
          onConfirm={confirmShipping}
        />
      )}
      {rejectDepositModal && pendingDepositPayment && (
        <RejectPaymentModal
          title="Từ chối tiền cọc"
          loading={verifyDepositLoading}
          onClose={() => setRejectDepositModal(false)}
          onReject={(reason) => verifyPaymentAction(pendingDepositPayment, "reject", reason)}
        />
      )}
      {rejectFinalModal && pendingFinalPayment && (
        <RejectPaymentModal
          title="Từ chối thanh toán cuối"
          loading={verifyFinalLoading}
          onClose={() => setRejectFinalModal(false)}
          onReject={(reason) => verifyPaymentAction(pendingFinalPayment, "reject", reason)}
        />
      )}
      {rejectReturnModal && (
        <RejectPaymentModal
          title="Từ chối yêu cầu trả hàng"
          loading={reviewReturnLoading}
          onClose={() => setRejectReturnModal(false)}
          onReject={(reason) => reviewReturnAction(false, reason)}
        />
      )}
      {rejectItemModal != null && (
        <RejectPaymentModal
          title="Từ chối sản phẩm"
          loading={false}
          onClose={() => setRejectItemModal(null)}
          onReject={(reason) => {
            setItemStatus(rejectItemModal, "rejected", reason);
            setRejectItemModal(null);
          }}
        />
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onMouseDown={e => { if (e.target === e.currentTarget) setLightboxImg(null); }}
        >
          <div className="relative max-w-3xl w-full mx-4">
            <button onClick={() => setLightboxImg(null)} className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white transition-colors">
              <X size={22} />
            </button>
            <img src={lightboxImg} alt="Chứng từ thanh toán" className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </>
  );
}