import { useState, useEffect } from "react";
import {
  X, CheckCheck, Truck, PackageCheck, Clock, CheckCircle2,
  MapPin, Phone, User, Store, CreditCard,
  Calendar, CalendarClock, XCircle, Printer, Loader2,
  ShieldCheck, Ban, ZoomIn,
} from "lucide-react";
import {
  orderService,
  parseOrderDetail,
  findPendingPayment,
  mergeOrderDetail,
  sortPaymentsForDisplay,
  canVerifyPayment,
} from "../../../services/api/orderService";
import { supplierService } from "../../../services/api/suppilerService";
import { appToast } from "../../common/toast";
// ─── STATUS CONFIG ──────────────────────────────────────────────────────────
const ORDER_STEPS = [
  { key: "pending_supplier_confirmation", label: "Chờ xác nhận", icon: Clock },
  { key: "confirmed",                     label: "Đã xác nhận",  icon: CheckCircle2 },
  { key: "processing",                    label: "Chuẩn bị hàng", icon: PackageCheck },
  { key: "shipping",                      label: "Đang giao",    icon: Truck },
  { key: "completed",                     label: "Hoàn thành",   icon: CheckCheck },
];

// Map mọi trạng thái về step tương ứng trên timeline
const STEP_INDEX = {
  pending_supplier_confirmation:        0,
  confirmed:                            1,
  deposit_pending_verification:         1, // vẫn ở bước "Đã xác nhận"
  deposit_paid:                         1,
  processing:                           2,
  shipping:                             3,
  delivered:                            3, // đang trên đường / đã tới, vẫn ở bước giao
  final_payment_pending_verification:   3,
  completed:                            4,
  // trạng thái đặc biệt — không tính vào timeline tiến trình
  rejected:                             -1,
  cancelled:                            -1,
};

const PAYMENT_STATUS = {
  pending:  { label: "Chờ xác minh", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  verified: { label: "Đã xác minh",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Từ chối",      cls: "bg-red-50 text-red-600 border-red-200" },
};

const PAYMENT_TYPE = { deposit: "Đặt cọc", full: "Thanh toán đủ", final_payment: "Thanh toán còn lại" };
const PAYMENT_METHOD = { bank_transfer: "Chuyển khoản", cash: "Tiền mặt", momo: "MoMo" };

// ─── HELPERS ────────────────────────────────────────────────────────────────
const fmtPrice = (n) => {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return isNaN(num) ? "—" : num.toLocaleString("vi-VN") + "₫";
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const fmtDateShort = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

function normalizeOrder(raw) {
  return parseOrderDetail(raw);
}

function getApiErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.detail) return String(data.detail);
  if (data?.message) return String(data.message);
  if (data && typeof data === "object") {
    const key = Object.keys(data)[0];
    if (key) {
      const val = data[key];
      return Array.isArray(val) ? String(val[0]) : String(val);
    }
  }
  return fallback;
}

// ─── MAIN MODAL ─────────────────────────────────────────────────────────────
export default function DetailOrderModal({ isOpen, onClose, order: initialOrder, onUpdate }) {
  const [order, setOrder]             = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [depositPct, setDepositPct]   = useState("");
  const [depositErr, setDepositErr]   = useState("");
  const [printModal, setPrintModal]   = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [supplier, setSupplier] = useState(null);
  const [verifyDepositLoading, setVerifyDepositLoading]     = useState(false);
  const [verifyFinalLoading, setVerifyFinalLoading]         = useState(false);
  const [rejectDepositModal, setRejectDepositModal]         = useState(false);
  const [rejectFinalModal, setRejectFinalModal]             = useState(false);
  const [lightboxImg, setLightboxImg]                       = useState(null);
  const [detailFetched, setDetailFetched]                   = useState(false);
  const [shippingModal, setShippingModal]                   = useState(false);
  const [shippingLoading, setShippingLoading]               = useState(false);

  useEffect(() => {
    const fetchSupplier = async () => {
      const res = await supplierService.getAll();
      setSupplier(res);
    };
    fetchSupplier();
  }, []);

  useEffect(() => {
    if (!isOpen || !initialOrder?.id) {
      setOrder(null);
      setLoadingDetail(false);
      setDetailError("");
      return;
    }

    setConfirmModal(false);
    setRejectModal(false);
    setDepositPct("");
    setDepositErr("");
    setPrintModal(false);
    setDetailError("");
    setLoading(false);
    setRejectLoading(false);
    setVerifyDepositLoading(false);
    setVerifyFinalLoading(false);
    setRejectDepositModal(false);
    setRejectFinalModal(false);
    setLightboxImg(null);
    setDetailFetched(false);
    setShippingModal(false);
    setShippingLoading(false);

    // Hiển thị ngay dữ liệu sơ bộ từ list; payments chỉ có sau getById
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
        if (!full?.items?.length) {
          setDetailError("Đơn hàng chưa có sản phẩm nào.");
        }
      })
      .catch((err) => {
        console.error("[DetailOrderModal] fetch order detail error:", err);
        if (!cancelled) {
          setDetailError("Không tải được danh sách sản phẩm. Vui lòng thử lại.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => { cancelled = true; };
  }, [isOpen, initialOrder?.id]);

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

  const items = Array.isArray(order.items) ? order.items : [];
  const total = items.length;
  const showItemsLoader = loadingDetail && total === 0;
  const approved  = items.filter(i => i.item_status === "approved").length;
  const rejected  = items.filter(i => i.item_status === "rejected").length;
  const processed = approved + rejected;
  const allDone   = processed === total;
  const isPending = order.status === "pending_supplier_confirmation";
  const isProcessing = order.status === "processing";
  const depositNum = parseFloat(depositPct);
  const depositValid = !isNaN(depositNum) && depositNum >= 10 && depositNum <= 50;
  const canConfirm = isPending && allDone && approved > 0 && depositValid;

  const isDepositPendingVerify = order.status === "deposit_pending_verification";
  const isFinalPendingVerify = order.status === "final_payment_pending_verification";
  const needsPaymentVerify = isDepositPendingVerify || isFinalPendingVerify;
  const sortedPayments = sortPaymentsForDisplay(order.payments);
  const pendingDepositPayment = findPendingPayment(order.payments, "deposit");
  const pendingFinalPayment = findPendingPayment(order.payments, "final_payment");

  const refreshOrderDetail = async () => {
    const detail = await orderService.getById(order.id);
    setOrder((prev) => mergeOrderDetail(prev, detail));
    setDetailFetched(true);
    return detail;
  };

  // ── Item actions ──────────────────────────────────────
  const setItemStatus = (id, status, reason = "") =>
    setOrder(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, item_status: status, reject_reason: reason } : i),
    }));

  const approveAll = () =>
    setOrder(prev => ({ ...prev, items: prev.items.map(i => ({ ...i, item_status: "approved", reject_reason: "" })) }));

  // ── Confirm / reject order ───────────────────────────
  const confirmOrder = async () => {
    setLoading(true);
    try {
      const updated = await orderService.confirmOrder(order.id, {
        deposit_percent: String(depositNum),
      });
      setOrder(updated ?? { ...order, status: "confirmed", deposit_percent: String(depositNum) });
      setConfirmModal(false);
      appToast.success("Đã xác nhận đơn hàng thành công");
      onUpdate?.();
    } catch (err) {
      console.error("[DetailOrderModal] confirm order error:", err);
      appToast.danger(getApiErrorMessage(err, "Không thể xác nhận đơn hàng. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  const rejectOrder = async (rejectionReason) => {
    setRejectLoading(true);
    try {
      const updated = await orderService.rejectOrder(order.id, {
        rejection_reason: rejectionReason.trim(),
      });
      setOrder(updated ?? { ...order, status: "rejected", rejection_reason: rejectionReason.trim() });
      setRejectModal(false);
      appToast.success("Đã từ chối đơn hàng");
      onUpdate?.();
    } catch (err) {
      console.error("[DetailOrderModal] reject order error:", err);
      appToast.danger(getApiErrorMessage(err, "Không thể từ chối đơn hàng. Vui lòng thử lại."));
    } finally {
      setRejectLoading(false);
    }
  };

  // ── Chuyển đơn sang trạng thái đang giao ──────────────
  const confirmShipping = async () => {
    setShippingLoading(true);
    try {
      const updated = await orderService.confirmShipping(order.id, {});
      setOrder((prev) => mergeOrderDetail(prev, updated) ?? { ...prev, status: "shipping" });
      setShippingModal(false);
      appToast.success("Đã chuyển đơn hàng sang trạng thái đang giao");
      onUpdate?.();
    } catch (err) {
      console.error("[DetailOrderModal] confirm shipping error:", err);
      appToast.danger(getApiErrorMessage(err, "Không thể chuyển trạng thái giao hàng. Vui lòng thử lại."));
    } finally {
      setShippingLoading(false);
    }
  };


  // ── Verify deposit / final payment ────────────────────────
  const verifyPaymentAction = async (payment, action, rejectionReason = "") => {
    const isDeposit = payment.payment_type === "deposit";
    const setLoading = isDeposit ? setVerifyDepositLoading : setVerifyFinalLoading;
    setLoading(true);
    try {
      await orderService.verifyPayment(order.id, {
        payment_id: payment.id,
        status: action === "approve" ? "verified" : "rejected",
        rejection_reason: rejectionReason,
      });
      await refreshOrderDetail();
      setRejectDepositModal(false);
      setRejectFinalModal(false);
      const label = isDeposit ? "tiền cọc" : "thanh toán cuối";
      appToast.success(action === "approve" ? `Đã duyệt ${label} thành công` : `Đã từ chối ${label}`);
      onUpdate?.();
    } catch (err) {
      console.error("[DetailOrderModal] verify payment error:", err);
      appToast.danger(getApiErrorMessage(err, "Không thể xác nhận thanh toán. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  // ── Print order ───────────────────────────────────
  const printOrder = () => {
    const printTotal = order.items.reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
    const depPct  = order.deposit_percent ? parseFloat(order.deposit_percent) : (depositValid ? depositNum : null);
    const depAmt  = depPct ? Math.round(printTotal * depPct / 100) : null;
    const STATUS_LABEL = {
      pending_supplier_confirmation: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      shipping: "Đang giao hàng",
      completed: "Hoàn thành",
    };

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>Đơn hàng ${order.order_code}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #166534; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { font-size: 20px; font-weight: 800; color: #166534; }
    .brand small { display: block; font-size: 11px; font-weight: 400; color: #666; margin-top: 2px; }
    .order-code { text-align: right; }
    .order-code h2 { font-size: 15px; font-weight: 700; }
    .order-code .status { display: inline-block; margin-top: 4px; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
    .info-block { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; }
    .info-block .block-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888; margin-bottom: 8px; }
    .info-row { display: flex; flex-direction: column; margin-bottom: 5px; }
    .info-row .lbl { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: .04em; }
    .info-row .val { font-size: 13px; font-weight: 500; color: #111; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #666; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #166534; color: #fff; }
    thead th { padding: 8px 10px; text-align: left; font-size: 12px; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f0fdf4; }
    tbody td { padding: 8px 10px; font-size: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    .tag-approved { display: inline-block; padding: 1px 8px; border-radius: 20px; background: #dcfce7; color: #166534; font-size: 10px; font-weight: 700; }
    .tag-rejected { display: inline-block; padding: 1px 8px; border-radius: 20px; background: #fee2e2; color: #dc2626; font-size: 10px; font-weight: 700; }
    .tag-pending  { display: inline-block; padding: 1px 8px; border-radius: 20px; background: #fef9c3; color: #92400e; font-size: 10px; font-weight: 700; }
    .summary-box { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; max-width: 320px; margin-left: auto; margin-bottom: 24px; }
    .summary-row { display: flex; justify-content: space-between; padding: 7px 14px; font-size: 12px; }
    .summary-row:nth-child(even) { background: #f9fafb; }
    .summary-row.total { background: #166534; color: #fff; font-weight: 700; font-size: 14px; padding: 10px 14px; }
    .summary-row.deposit { background: #dcfce7; color: #166534; font-weight: 700; }
    .note-box { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; font-size: 12px; color: #78350f; margin-bottom: 18px; }
    .footer { border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: #999; }
    .sig-row { display: flex; justify-content: space-between; margin-top: 32px; }
    .sig-box { text-align: center; width: 200px; }
    .sig-box .sig-title { font-size: 12px; font-weight: 700; margin-bottom: 48px; }
    .sig-box .sig-line { border-top: 1px solid #ccc; padding-top: 6px; font-size: 11px; color: #999; }
    @media print { body { padding: 16px 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">🌿 Smart Green Market<small>Phiếu xác nhận đơn hàng</small></div>
    <div class="order-code">
      <h2>#${order.order_code}</h2>
      <span class="status">${STATUS_LABEL[order.status] ?? order.status}</span><br/>
      <small style="color:#888">Ngày đặt: ${fmtDate(order.created_at)}</small>
    </div>
  </div>

  <div class="two-col">
    <div class="info-block">
      <div class="block-title">👤 Thông tin Đại lý</div>
      <div class="info-row"><span class="lbl">Người nhận</span><span class="val">${order.receiver_name}</span></div>
      <div class="info-row"><span class="lbl">Điện thoại</span><span class="val">${order.receiver_phone}</span></div>
      <div class="info-row"><span class="lbl">Địa chỉ giao</span><span class="val">${order.delivery_address}</span></div>
      <div class="info-row"><span class="lbl">Ngày giao dự kiến</span><span class="val">${fmtDateShort(order.requested_delivery_time)}</span></div>
    </div>
    <div class="info-block">
      <div class="block-title">🏪 Thông tin Nhà cung cấp</div>
      <div class="info-row"><span class="lbl">Nhà cung cấp</span><span class="val" style="font-weight:700">${order.supplier_name}</span></div>
      ${order.supplier_bank ? `
      <div class="info-row"><span class="lbl">Người đại diện</span><span class="val">${supplier[0].account_name}</span></div>
      <div class="info-row"><span class="lbl">Số điện thoại</span><span class="val">${supplier[0].phone}</span></div>
      <div class="info-row"><span class="lbl">Địa chỉ</span><span class="val">${supplier[0].address}</span></div>
      ` : ""}
    </div>
  </div>

  ${order.note ? `<div class="note-box">📝 Ghi chú: ${order.note}</div>` : ""}

  <div class="section-title">Danh sách sản phẩm</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Sản phẩm</th>
        <th>Đơn vị</th>
        <th style="text-align:right">Số lượng</th>
        <th style="text-align:right">Đơn giá</th>
        <th style="text-align:right">Thành tiền</th>
        <th style="text-align:center">Trạng thái</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((item, i) => `
      <tr>
        <td style="color:#999">${i + 1}</td>
        <td><strong>${item.product_name}</strong>${item.note ? `<br/><small style="color:#999">${item.note}</small>` : ""}</td>
        <td>${item.product_unit}</td>
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">${fmtPrice(item.unit_price)}</td>
        <td style="text-align:right;font-weight:700">${fmtPrice(item.subtotal)}</td>
        <td style="text-align:center">
          ${item.item_status === "approved" ? '<span class="tag-approved">✓ Duyệt</span>' :
            item.item_status === "rejected" ? `<span class="tag-rejected">✗ Từ chối</span>${item.reject_reason ? `<br/><small style="color:#dc2626;font-size:10px">${item.reject_reason}</small>` : ""}` :
            '<span class="tag-pending">Chờ duyệt</span>'}
        </td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div class="summary-box">
    <div class="summary-row"><span>Tạm tính (${order.items.length} sản phẩm)</span><span>${fmtPrice(printTotal)}</span></div>
    ${depPct ? `<div class="summary-row deposit"><span>Tiền cọc (${depPct}%)</span><span>${fmtPrice(depAmt)}</span></div>` : ""}
    ${order.paid_amount ? `<div class="summary-row"><span>Đã thanh toán</span><span style="color:#166534;font-weight:700">${fmtPrice(order.paid_amount)}</span></div>` : ""}
    ${order.debt_amount ? `<div class="summary-row"><span>Còn lại</span><span style="color:#dc2626;font-weight:700">${fmtPrice(order.debt_amount)}</span></div>` : ""}
    <div class="summary-row total"><span>Tổng đơn hàng</span><span>${fmtPrice(printTotal)}</span></div>
  </div>

  <div class="sig-row">
    <div class="sig-box"><div class="sig-title">Người mua</div><div class="sig-line">${order.receiver_name}</div></div>
    <div class="sig-box"><div class="sig-title">Nhà cung cấp</div><div class="sig-line">${order.supplier_name}</div></div>
  </div>

  <div class="footer">
    <span>Mã đơn: #${order.order_code}</span>
    <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
  </div>
</body>
</html>`;

    return html;
  };

  const openPrintModal = () => setPrintModal(true);

  const stepIdx = STEP_INDEX[order.status] ?? 0;
  const isTerminalBad = order.status === "rejected" || order.status === "cancelled";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

        <div
          className="relative w-full max-w-5xl bg-neutral-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ animation: "modalIn 0.18s ease-out both", maxHeight: "92vh" }}
        >
          {/* ── Header ── */}
          <div className="bg-white border-b border-neutral-200 flex-shrink-0 px-6 py-3 flex items-center gap-4">
            <div className="mr-auto min-w-0">
              <p className="text-[11px] text-neutral-400 leading-none">Chi tiết đơn hàng</p>
              <h2 className="text-base font-extrabold text-gray-900 truncate">#{order.order_code}</h2>
            </div>

            <button
              onClick={openPrintModal}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 transition-colors shrink-0"
              title="In đơn hàng"
            >
              <Printer size={13} /> In đơn
            </button>

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
                  const Icon = step.icon;
                  const done   = idx < stepIdx;
                  const active = idx === stepIdx;
                  const SUB_STATUS_LABEL = {
                    deposit_pending_verification:           "Chờ xác nhận cọc",
                    deposit_paid:                           "Đã cọc",
                    delivered:                              "Đã giao hàng",
                    final_payment_pending_verification:     "Chờ TT cuối",
                  };
                  const subLabel = active ? SUB_STATUS_LABEL[order.status] : null;
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

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 shrink-0 transition-colors"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="overflow-y-auto flex-1 px-6 py-6 flex flex-col gap-5">

        {/* ── Thông tin chung (ngày đặt + ngày giao) ───── */}
        <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetaItem icon={<Calendar size={14} className="text-emerald-700" />} label="Ngày đặt hàng">
            {fmtDate(order.created_at)}
          </MetaItem>
          <MetaItem icon={<CalendarClock size={14} className="text-emerald-700" />} label="Ngày giao dự kiến">
            <span className="text-emerald-700 font-bold">{fmtDateShort(order.requested_delivery_time)}</span>
          </MetaItem>
          <MetaItem icon={<CheckCircle2 size={14} className="text-emerald-700" />} label="Xác nhận lúc">
            {fmtDate(order.confirmed_at)}
          </MetaItem>
          <MetaItem icon={<Truck size={14} className="text-emerald-700" />} label="Giao hàng lúc">
            {fmtDate(order.delivered_at)}
          </MetaItem>
        </div>

        {/* ── Buyer + Supplier ──────────────────────────── */}
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
            {order.supplier_bank && (
              <>
                <InfoRow label="Người đại diện">{supplier[0].account_name}</InfoRow>
                <InfoRow label="Số điện thoại">{supplier[0].phone}</InfoRow>
                <InfoRow label="Địa chỉ">{supplier[0].address}</InfoRow>
              </>
            )}
          </InfoCard>
        </div>

        {/* ── Danh sách sản phẩm ───────────────────────── */}
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

          {showItemsLoader ? (
            <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tải danh sách sản phẩm...
            </div>
          ) : detailError && total === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-red-500">{detailError}</div>
          ) : total === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-neutral-400">
              Đơn hàng chưa có sản phẩm nào.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {items.map((item, idx) => (
                <ItemRow
                  key={item.id ?? idx}
                  item={item}
                  canEdit={isPending}
                  onApprove={() => setItemStatus(item.id, "approved")}
                  onReject={() => setItemStatus(item.id, "rejected")}
                  onReset={() => setItemStatus(item.id, "pending")}
                />
              ))}
            </div>
          )}

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
                  <span className={allDone ? "text-emerald-700" : "text-amber-700"}>
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

        {/* ── Chứng từ thanh toán (payments từ getById) ──────── */}
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
              const canVerify = canVerifyPayment(order.status, payment);
              const isDeposit = payment.payment_type === "deposit";
              const verifyLoading = isDeposit ? verifyDepositLoading : verifyFinalLoading;
              const ps = PAYMENT_STATUS[payment.status] ?? PAYMENT_STATUS.pending;

              return (
                <PaymentReceiptCard
                  key={payment.id}
                  payment={payment}
                  depositPercent={order.deposit_percent}
                  supplierBank={order.supplier_bank}
                  statusBadge={ps}
                  canVerify={canVerify}
                  verifyLoading={verifyLoading}
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

        {needsPaymentVerify && detailFetched && !loadingDetail && sortedPayments.length > 0 &&
          !sortedPayments.some((p) => canVerifyPayment(order.status, p)) && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 px-6 py-4 text-sm text-amber-800">
            Không tìm thấy thanh toán đang chờ duyệt. Vui lòng tải lại trang.
          </div>
        )}

        {/* ── Tổng kết ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <PackageCheck size={15} className="text-emerald-700" />
            <h2 className="font-bold text-gray-900 text-sm">Tổng kết đơn hàng</h2>
          </div>
          <div className="flex flex-col gap-2 text-sm max-w-sm ml-auto">
            <SummaryRow label={`Tạm tính (${total} sản phẩm)`} value={fmtPrice(order.total_amount)} />
            {order.deposit_percent && (
              <SummaryRow label={`Tiền cọc (${order.deposit_percent}%)`} value={fmtPrice(order.deposit_amount)} />
            )}
            <SummaryRow label="Đã thanh toán" value={fmtPrice(order.paid_amount)} className="text-emerald-700" />
            <SummaryRow label="Còn lại" value={fmtPrice(order.debt_amount)} className="text-red-500" />
            <div className="border-t border-neutral-100 pt-3 flex justify-between items-end mt-1">
              <span className="text-neutral-500">Tổng thanh toán</span>
              <span className="text-2xl font-extrabold text-emerald-800">{fmtPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* ── NÚT CHUYỂN SANG ĐANG GIAO — khi đơn đang ở processing ─── */}
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

        {/* ── NÚT XÁC NHẬN ĐƠN — cuối trang ──────────── */}
        {isPending && (
          <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-5 flex flex-col gap-4">
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Xác nhận đơn hàng</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Nhập tỉ lệ tiền cọc yêu cầu, sau đó xác nhận đơn hàng
              </p>
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
                    onChange={e => {
                      setDepositPct(e.target.value);
                      setDepositErr("");
                    }}
                    onBlur={() => {
                      if (depositPct === "") return;
                      const n = parseFloat(depositPct);
                      if (isNaN(n) || n < 10 || n > 50)
                        setDepositErr("Tỉ lệ cọc phải từ 10% đến 50%");
                    }}
                    placeholder="VD: 30"
                    className="w-28 px-4 py-2.5 text-sm outline-none bg-white font-semibold text-gray-900"
                  />
                  <span className="px-3 py-2.5 bg-neutral-50 border-l border-neutral-200 text-sm font-semibold text-neutral-500">%</span>
                </div>

                {/* Preview số tiền cọc */}
                {depositValid && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-neutral-400">=</span>
                    <span className="font-bold text-emerald-700">
                      {fmtPrice(Math.round(parseFloat(order.total_amount) * depositNum / 100))}
                    </span>
                    <span className="text-xs text-neutral-400">/ tổng {fmtPrice(order.total_amount)}</span>
                  </div>
                )}
              </div>
              {depositErr && <p className="text-xs text-red-500">{depositErr}</p>}
            </div>

            {/* Status hint + buttons */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl px-4 py-3 border ${
              canConfirm ? "bg-emerald-50 border-emerald-200" : "bg-neutral-50 border-neutral-200"
            }`}>
              <p className={`text-xs font-medium ${canConfirm ? "text-emerald-700" : "text-neutral-400"}`}>
                {!allDone
                  ? "⚠ Cần duyệt hoặc từ chối tất cả sản phẩm"
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
          </div>
        </div>
      </div>

      {/* ── Nested modals ── */}
      {printModal && (
        <PrintPreviewModal
          htmlContent={printOrder()}
          onClose={() => setPrintModal(false)}
        />
      )}
      {confirmModal && (
        <ConfirmOrderModal
          approved={approved} rejected={rejected} total={total}
          depositPct={depositNum}
          totalAmount={order.total_amount}
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

      {rejectDepositModal && (() => {
        const p = pendingDepositPayment;
        return p ? (
          <RejectPaymentModal
            title="Từ chối tiền cọc"
            loading={verifyDepositLoading}
            onClose={() => setRejectDepositModal(false)}
            onReject={(reason) => verifyPaymentAction(p, "reject", reason)}
          />
        ) : null;
      })()}

      {rejectFinalModal && (() => {
        const p = pendingFinalPayment;
        return p ? (
          <RejectPaymentModal
            title="Từ chối thanh toán cuối"
            loading={verifyFinalLoading}
            onClose={() => setRejectFinalModal(false)}
            onReject={(reason) => verifyPaymentAction(p, "reject", reason)}
          />
        ) : null;
      })()}

      {lightboxImg && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onMouseDown={e => { if (e.target === e.currentTarget) setLightboxImg(null); }}
        >
          <div className="relative max-w-3xl w-full mx-4">
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X size={22} />
            </button>
            <img
              src={lightboxImg}
              alt="Chứng từ thanh toán"
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
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

// ─── ITEM ROW ───────────────────────────────────────────────────────────────
function ItemRow({ item, canEdit, onApprove, onReject, onReset }) {
  return (
    <div className={`px-5 py-4 ${
      item.item_status === "rejected" ? "bg-red-50/40" :
      item.item_status === "approved" ? "bg-emerald-50/20" : "bg-white"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Duyệt / Từ chối */}
        {canEdit ? (
          <div className="flex gap-3 shrink-0">
            <button type="button" onClick={item.item_status === "approved" ? onReset : onApprove}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                item.item_status === "approved"
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-emerald-500 hover:text-emerald-700"
              }`}>
              {item.item_status === "approved" ? "✓ Đã duyệt" : "Duyệt"}
            </button>
            <button type="button" onClick={item.item_status === "rejected" ? onReset : onReject}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                item.item_status === "rejected"
                  ? "bg-red-500 border-red-500 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-red-400 hover:text-red-600"
              }`}>
              {item.item_status === "rejected" ? "✗ Từ chối" : "Từ chối"}
            </button>
          </div>
        ) : (
          <span className={`text-xs font-bold shrink-0 ${
            item.item_status === "approved" ? "text-emerald-600" :
            item.item_status === "rejected" ? "text-red-500" : "text-neutral-400"
          }`}>
            {item.item_status === "approved" ? "✓ Đã duyệt" :
             item.item_status === "rejected" ? "✗ Từ chối" : "· Chờ duyệt"}
          </span>
        )}

        {/* Thông tin sản phẩm */}
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
            {item.product_thumbnail_url ? (
              <img src={item.product_thumbnail_url} alt={item.product_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">🥬</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{item.product_name}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {item.quantity} {item.product_unit} × {fmtPrice(item.unit_price)}
            </p>
            {item.note && <p className="text-xs text-neutral-400 italic mt-1">{item.note}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] text-neutral-400">Thành tiền</p>
            <p className="text-sm font-bold text-gray-900">{fmtPrice(item.subtotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REJECT PAYMENT MODAL ──────────────────────────────────────────────────
function RejectPaymentModal({ title, loading, onClose, onReject }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = () => {
    const trimmed = reason.trim();
    if (!trimmed) { setErr("Vui lòng nhập lý do từ chối"); return; }
    onReject(trimmed);
  };

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 py-6 flex flex-col gap-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <Ban size={26} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-4">{title}</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Hãy nhập lý do để thông báo đến đại lý.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setErr(""); }}
              placeholder="VD: Số tiền không khớp với yêu cầu"
              className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none resize-none transition-colors ${
                err ? "border-red-400" : "border-neutral-200 focus:border-red-400"
              }`}
            />
            {err && <p className="text-xs text-red-500">{err}</p>}
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
            Quay lại
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60">
            {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── REJECT ORDER MODAL ─────────────────────────────────────────────────────
function RejectOrderModal({ orderCode, loading, onClose, onReject }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setErr("Vui lòng nhập lý do từ chối");
      return;
    }
    onReject(trimmed);
  };

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 py-6 flex flex-col gap-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle size={26} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-4">Từ chối đơn hàng?</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Đơn <span className="font-semibold text-gray-800">{orderCode}</span> sẽ bị từ chối và thông báo tới đại lý.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setErr(""); }}
              placeholder="VD: Không đủ năng lực sản xuất trong thời gian yêu cầu"
              className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none resize-none transition-colors ${
                err ? "border-red-400" : "border-neutral-200 focus:border-red-400"
              }`}
            />
            {err && <p className="text-xs text-red-500">{err}</p>}
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
            Quay lại
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60">
            {loading ? "Đang xử lý..." : "Từ chối đơn"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── CONFIRM SHIPPING MODAL ─────────────────────────────────────────────────
function ConfirmShippingModal({ orderCode, loading, onClose, onConfirm }) {
  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 py-6 flex flex-col gap-4 items-center text-center">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
            <Truck size={26} className="text-blue-600" />
          </div>
          <div className="w-full">
            <h2 className="text-lg font-bold text-gray-900">Chuyển sang đang giao?</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Đơn <span className="font-semibold text-gray-800">{orderCode}</span> sẽ chuyển sang trạng thái{" "}
              <span className="font-semibold text-blue-600">Đang giao</span> và thông báo tới đại lý.
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
            Quay lại
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-1.5">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Đang xử lý...</> : <><Truck size={14} /> Xác nhận giao hàng</>}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── PAYMENT RECEIPT CARD ───────────────────────────────────────────────────
function PaymentReceiptCard({
  payment,
  depositPercent,
  supplierBank,
  statusBadge,
  canVerify,
  verifyLoading,
  onZoom,
  onApprove,
  onReject,
}) {
  const isDeposit = payment.payment_type === "deposit";
  const title = isDeposit
    ? `Tiền cọc${depositPercent ? ` (${depositPercent}%)` : ""}`
    : "Thanh toán cuối";

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className={`px-6 py-4 border-b flex items-center gap-2 flex-wrap ${
        canVerify
          ? isDeposit ? "border-amber-100 bg-amber-50" : "border-emerald-100 bg-emerald-50"
          : "border-neutral-100 bg-neutral-50"
      }`}>
        <ShieldCheck size={15} className={canVerify ? (isDeposit ? "text-amber-600" : "text-emerald-700") : "text-neutral-400"} />
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
        {canVerify && (
          <span className="ml-auto text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200">
            Cần xác nhận
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
        <div className="flex flex-col items-center gap-3 px-6 py-5">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide self-start">Hình ảnh chứng từ</p>
          {payment.receipt_file ? (
            <div className="relative w-full group cursor-pointer" onClick={() => onZoom(payment.receipt_file)}>
              <img
                src={payment.receipt_file}
                alt="Chứng từ thanh toán"
                className="w-full max-h-72 object-contain rounded-xl border border-neutral-200 bg-neutral-50"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center">
                <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </div>
          ) : (
            <div className="w-full h-40 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-neutral-400 text-xs gap-2">
              <CreditCard size={24} />
              Chưa có hình chứng từ
            </div>
          )}

          {canVerify && (
            <div className="flex gap-2 w-full mt-1">
              <button
                type="button"
                onClick={onReject}
                disabled={verifyLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                <Ban size={13} /> Từ chối
              </button>
              <button
                type="button"
                onClick={onApprove}
                disabled={verifyLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm shadow-emerald-200"
              >
                {verifyLoading
                  ? <><Loader2 size={13} className="animate-spin" /> Đang duyệt...</>
                  : <><ShieldCheck size={13} /> {isDeposit ? "Duyệt cọc" : "Duyệt thanh toán"}</>
                }
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Chi tiết thanh toán</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Loại</span>
              <span className="text-sm font-semibold text-gray-900">
                {PAYMENT_TYPE[payment.payment_type] ?? payment.payment_type}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Phương thức</span>
              <span className="text-sm font-semibold text-gray-900">
                {PAYMENT_METHOD[payment.payment_method] ?? payment.payment_method}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Số tiền</span>
              <span className="text-xl font-extrabold text-emerald-800">{fmtPrice(payment.amount)}</span>
            </div>
            {payment.transaction_code && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Mã giao dịch</span>
                <span className="text-sm font-semibold text-gray-900 font-mono">{payment.transaction_code}</span>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Thời gian gửi</span>
              <span className="text-sm font-medium text-gray-700">{fmtDate(payment.paid_at)}</span>
            </div>
            {payment.verified_at && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Xác minh lúc</span>
                <span className="text-sm font-medium text-gray-700">{fmtDate(payment.verified_at)}</span>
              </div>
            )}
            {payment.note && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Ghi chú</span>
                <span className="text-sm text-gray-700 italic">{payment.note}</span>
              </div>
            )}
            {payment.rejection_reason && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-red-400 uppercase tracking-wide">Lý do từ chối</span>
                <span className="text-sm text-red-600">{payment.rejection_reason}</span>
              </div>
            )}
          </div>

          {supplierBank && (
            <div className="mt-auto bg-neutral-50 rounded-xl border border-neutral-200 px-4 py-3 flex flex-col gap-1.5">
              <p className="text-[11px] text-neutral-400 uppercase tracking-wide font-medium">Tài khoản nhận tiền</p>
              <p className="text-sm font-bold text-gray-900">{supplierBank.account_name}</p>
              <p className="text-xs text-neutral-500">{supplierBank.bank_name} · {supplierBank.account_number}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CONFIRM ORDER MODAL ────────────────────────────────────────────────────
function ConfirmOrderModal({ approved, rejected, total, depositPct, totalAmount, loading, onClose, onConfirm }) {
  const depositAmount = Math.round(parseFloat(totalAmount) * depositPct / 100);
  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 py-6 flex flex-col gap-4 items-center text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCheck size={26} className="text-emerald-700" />
          </div>
          <div className="w-full">
            <h2 className="text-lg font-bold text-gray-900">Xác nhận đơn hàng?</h2>
            <p className="text-sm text-neutral-500 mt-1">
              <span className="text-emerald-700 font-bold">{approved} sản phẩm duyệt</span>
              {rejected > 0 && <span className="text-red-500 font-bold">, {rejected} từ chối</span>}
              <span className="text-neutral-400"> / tổng {total}</span>
            </p>

            {/* Deposit summary */}
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-emerald-800 font-medium">Tiền cọc yêu cầu</span>
              <div className="text-right">
                <p className="text-base font-extrabold text-emerald-800">{fmtPrice(depositAmount)}</p>
                <p className="text-xs text-emerald-600">{depositPct}% tổng đơn</p>
              </div>
            </div>

            {rejected > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                Sản phẩm bị từ chối sẽ được thông báo đến người mua.
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Quay lại</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60">
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}

function InfoCard({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">{icon}<h2 className="font-bold text-gray-900 text-sm">{title}</h2></div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-neutral-400 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-sm font-medium text-gray-800">{children}</span>
    </div>
  );
}

function MetaItem({ icon, label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium uppercase tracking-wide">{icon}{label}</div>
      <p className="text-sm font-semibold text-gray-800">{children}</p>
    </div>
  );
}

function SummaryRow({ label, value, className = "" }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className={`font-medium text-gray-800 ${className}`}>{value}</span>
    </div>
  );
}

// ─── PRINT PREVIEW MODAL ────────────────────────────────────────────────────
function PrintPreviewModal({ htmlContent, onClose }) {
  const handlePrint = () => {
    const iframe = document.getElementById("print-iframe");
    if (!iframe) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  return (
    <>
      {/* Hide modal UI when printing — only iframe content prints */}
      <style>{`@media print { .print-modal-shell { display: none !important; } }`}</style>

      <div className="print-modal-shell fixed inset-0 z-[60] flex flex-col bg-black/60">
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-2">
            <Printer size={15} className="text-emerald-700" />
            <span className="font-bold text-gray-900 text-sm">Xem trước khi in</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Printer size={13} /> In / Xuất PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Preview area ── */}
        <div className="flex-1 overflow-auto bg-neutral-300 p-6 flex justify-center">
          <div className="w-full max-w-[860px] shadow-2xl rounded-lg overflow-hidden bg-white">
            <iframe
              id="print-iframe"
              srcDoc={htmlContent}
              className="w-full border-0"
              style={{ height: "calc(100vh - 120px)", minHeight: 600 }}
              title="print-preview"
            />
          </div>
        </div>
      </div>
    </>
  );
}