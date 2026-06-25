// src/components/User/OrderTracking/OrderDetailModal.jsx
import React, { useEffect, useCallback, useState } from "react";
import { toast } from "sonner";
import { PackageCheck, RotateCcw } from "lucide-react";

import {
  buyerOrder,
  handleApiError,
  parseBuyerOrderDetail,
} from "../../../services/api/Buyer/buyerOrder";

import {
  formatCurrency,
  formatDateTime,
  formatEstimatedDeliveryTime,
  getStatusCfg,
  formatPaymentMethod,
} from "../../../utils/orderUtils";

/**
 * =========================================================================
 * COMPONENT: OrderDetailModal
 * =========================================================================
 * Nhận `orderId` (KHÔNG nhận object order đầy đủ nữa) vì buyerOrder.getAll()
 * (trang danh sách) chỉ trả về thông tin tóm tắt — không có items, payments,
 * status_histories, customer_phone, receiver, địa chỉ giao hàng...
 *
 * Khi modal mở (isOpen=true + có orderId), component tự gọi
 * buyerOrder.getById(dealerSlug, orderId) để lấy toàn bộ chi tiết.
 *
 * Props:
 *   dealerSlug : string        — slug cửa hàng (lấy từ route ở trang cha)
 *   orderId    : number | null — id đơn hàng cần xem chi tiết
 *   isOpen     : boolean       — hiện / ẩn modal
 *   onClose    : () => void    — callback đóng modal
 *   onOrderUpdated : () => void — callback sau khi cập nhật trạng thái đơn
 * =========================================================================
 */

const PAYMENT_STATUS_LABEL = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  success: "Đã thanh toán",
  verified: "Đã xác minh",
  failed: "Thất bại",
  rejected: "Từ chối",
};

const PAYMENT_TYPE_LABEL = {
  full: "Thanh toán toàn bộ",
  partial: "Thanh toán một phần",
  deposit: "Đặt cọc",
};

const StatusBadge = ({ status }) => {
  const cfg = getStatusCfg(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

// ── Lịch sử trạng thái (từ order.status_histories) ─────
const StatusTimeline = ({ order }) => {
  const histories = order.status_histories ?? [];

  // Nếu chưa có lịch sử (đơn vừa tạo) thì vẫn hiện ít nhất mốc "Đã đặt hàng"
  const events =
    histories.length > 0
      ? [...histories].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      : [{ label: "Đã đặt hàng", created_at: order.created_at }];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-[34px] h-[34px] bg-emerald-50 rounded-[10px] flex items-center justify-center text-emerald-700 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <h3 className="text-[14px] font-medium text-gray-900">Lịch sử trạng thái</h3>
      </div>

      <div className="relative">
        <div className="absolute left-[18px] top-[18px] bottom-[18px] w-[2px] bg-gray-100" />
        {events.length > 1 && (
          <div className="absolute left-[18px] top-[18px] bottom-[18px] w-[2px] bg-emerald-600" />
        )}

        <div className="space-y-6">
          {events.map((ev, i) => (
            <div key={ev.id ?? i} className="relative flex items-start gap-4 pl-10">
              <div className="absolute left-0 w-9 h-9 rounded-full border-2 flex items-center justify-center z-10
                bg-emerald-600 border-emerald-600 text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="pt-1.5">
                <p className="text-[13px] font-medium text-gray-900">{ev.label || ev.status}</p>
                {ev.note && <p className="text-[12px] text-gray-500 mt-0.5">{ev.note}</p>}
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {formatDateTime(ev.created_at)}
                  {ev.changed_by_name ? ` • ${ev.changed_by_name}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Bảng sản phẩm (order.items) ─────────────────────────
const ItemsTable = ({ items = [] }) => (
  <div className="bg-white rounded-2xl border border-gray-200">
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
      <div className="w-[34px] h-[34px] bg-emerald-50 rounded-[10px] flex items-center justify-center text-emerald-700 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="text-[14px] font-medium text-gray-900">Sản phẩm đã đặt</h3>
      <span className="ml-auto text-[12px] text-gray-400">{items.length} sản phẩm</span>
    </div>

    <div className="grid grid-cols-12 px-6 py-2.5 bg-gray-50 border-b border-gray-100
      text-[11px] font-medium text-gray-400 uppercase tracking-wide">
      <div className="col-span-5">Sản phẩm</div>
      <div className="col-span-2 text-center">Số Lượng</div>
      <div className="col-span-2 text-center">Đơn vị tính</div>
      <div className="col-span-3 text-right">Thành tiền</div>
    </div>

    <div className="divide-y divide-gray-50">
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-12 items-center px-6 py-3">
          <div className="col-span-5 flex items-center gap-2.5 min-w-0">
            {item.product_thumbnail_url ? (
              <img
                src={item.product_thumbnail_url}
                alt={item.product_name}
                className="w-9 h-9 rounded-lg object-cover bg-gray-100 flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
            )}
            <p className="text-[13px] text-gray-800 font-medium capitalize truncate">{item.product_name}</p>
          </div>
          <div className="col-span-2 text-center">
            <span className="text-[13px] text-gray-500">{item.quantity}</span>
          </div>
          <div className="col-span-2 text-center">
            <span className="text-[13px] text-gray-500">{item.product_unit}</span>
          </div>
          <div className="col-span-3 text-right">
            <span className="text-[13px] font-medium text-gray-800">{formatCurrency(item.subtotal)}</span>
            <span className="block text-[11px] text-gray-400">
              {formatCurrency(item.unit_price)}/{item.product_unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Thanh toán & tổng tiền (order.payments + các field amount) ──
const PaymentSummary = ({ order }) => {
  const payments = order.payments ?? [];
  const discount = Number(order.discount_amount ?? 0);
  const debt = Number(order.debt_amount ?? 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
        <div className="w-[34px] h-[34px] bg-amber-50 rounded-[10px] flex items-center justify-center text-amber-700 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-[14px] font-medium text-gray-900">Thanh toán</h3>
      </div>

      {payments.length > 0 && (
        <div className="px-6 py-3 space-y-2.5 border-b border-gray-100">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-[13px]">
              <div>
                <span className="text-gray-700 font-medium">{formatPaymentMethod(p.payment_method)}</span>
                <span className="text-gray-400"> • {PAYMENT_TYPE_LABEL[p.payment_type] ?? p.payment_type}</span>
              </div>
              <div className="text-right">
                <span className="font-medium text-gray-800">{formatCurrency(p.amount)}</span>
                <span className="block text-[11px] text-gray-400">
                  {PAYMENT_STATUS_LABEL[p.status] ?? p.status} • {formatDateTime(p.paid_at ?? p.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 py-4 space-y-2 text-[13px]">
        <div className="flex justify-between text-gray-500">
          <span>Tạm tính</span>
          <span>{formatCurrency(order.subtotal_amount)}</span>
        </div>
        {discount !== 0 && (
          <div className="flex justify-between text-gray-500">
            <span>Giảm giá</span>
            <span>-{formatCurrency(Math.abs(discount))}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-500">
          <span>Phí vận chuyển</span>
          <span>{formatCurrency(order.shipping_fee)}</span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-[14px] font-medium text-gray-900">Tổng cộng</span>
          <span className="text-[20px] font-medium text-emerald-700">{formatCurrency(order.total_amount)}</span>
        </div>

        {order.paid_amount != null && (
          <div className="flex justify-between text-gray-500 pt-1">
            <span>Đã thanh toán</span>
            <span>{formatCurrency(order.paid_amount)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Thông tin người mua / người nhận / giao hàng ────────
const DeliveryInfo = ({ order }) => {
  const estimatedDeliveryTime = formatEstimatedDeliveryTime(order);

  const rows = [
    { label: "Người nhận hàng", value: order.receiver_name, sub: order.receiver_phone },
    { label: "Địa chỉ nhận hàng", value: order.delivery_address ?? order.shipping_address },
    { label: "Thời gian dự kiến giao", value: estimatedDeliveryTime },
    { label: "Ghi chú", value: order.note },
  ].filter((r) => r.value);

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
        <div className="w-[34px] h-[34px] bg-gray-100 rounded-[10px] flex items-center justify-center text-gray-600 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-[14px] font-medium text-gray-900">Thông tin nhận hàng</h3>
      </div>

      <div className="px-6 py-4 space-y-2.5">
        {rows.map(({ label, value, sub }) => (
          <div key={label} className="flex items-start justify-between gap-4 text-[13px]
            py-2.5 border-b border-gray-50 last:border-none">
            <span className="text-gray-400 flex-shrink-0">{label}</span>
            <span className="text-gray-800 font-medium text-right">
              {value}
              {sub && <span className="block text-gray-400 font-normal">{sub}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Nút hành động cuối modal ────────────────────────────
const ModalActionFooter = ({
  order,
  actionLoading,
  onConfirmDelivery,
  onComplete,
}) => {
  if (!order) return null;

  if (order.status === "shipping") {
    return (
      <div className="bg-white px-6 py-4 border-t border-gray-200 flex-shrink-0">
        <button
          type="button"
          disabled={actionLoading}
          onClick={onConfirmDelivery}
          className="hover:scale-105 cursor-pointer w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3
            text-[14px] font-medium text-white hover:bg-emerald-800 transition-colors
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <PackageCheck size={18} />
          {actionLoading ? "Đang xử lý..." : "Nhận hàng"}
        </button>
      </div>
    );
  }

  if (order.status === "delivered") {
    return (
      <div className="bg-white px-6 py-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex flex-col-reverse sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => toast.info("Tính năng trả hàng đang được phát triển.")}
            className="hover:scale-105 cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3
              text-[14px] font-medium text-gray-600 hover:bg-gray-50 transition-colors
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RotateCcw size={17} />
            Trả hàng
          </button>
          <button
            type="button"
            disabled={actionLoading}
            onClick={onComplete}
            className="hover:scale-105 cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3
              text-[14px] font-medium text-white hover:bg-emerald-800 transition-colors
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <PackageCheck size={18} />
            {actionLoading ? "Đang xử lý..." : "Hoàn thành"}
          </button>
        </div>
      </div>
    );
  }

  return null;
};
export const formatDateTimeVN = (dateStr) => {
  const date = new Date(dateStr);

  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
// ── Main modal ──────────────────────────────────────────
export default function OrderDetailModal({ dealerSlug, orderId, isOpen, onClose, onOrderUpdated }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // =======================================================================
  // 🔌 FETCH API — LẤY CHI TIẾT ĐƠN HÀNG
  // =======================================================================
  const fetchDetail = useCallback(async () => {
    if (!orderId || !dealerSlug) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const data = await buyerOrder.getById(dealerSlug, orderId);
      setOrder(parseBuyerOrderDetail(data));
    } catch (err) {
      setError(handleApiError(err, "Không tải được chi tiết đơn hàng."));
    } finally {
      setLoading(false);
    }
  }, [dealerSlug, orderId]);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchDetail();
    }
    if (!isOpen) {
      setOrder(null);
      setError(null);
    }
  }, [isOpen, orderId, fetchDetail]);

  const handleConfirmDelivery = useCallback(async () => {
    if (!order?.id || !dealerSlug) return;
    if (!window.confirm("Bạn xác nhận đã nhận đủ hàng từ shipper?")) return;

    setActionLoading(true);
    try {
      await buyerOrder.confirmReceived(dealerSlug, order.id);
      toast.success("Xác nhận nhận hàng thành công!");
      await fetchDetail();
      onOrderUpdated?.();
    } catch (err) {
      toast.error(handleApiError(err, "Không thể xác nhận nhận hàng."));
    } finally {
      setActionLoading(false);
    }
  }, [order?.id, dealerSlug, fetchDetail, onOrderUpdated]);

  const handleComplete = useCallback(async () => {
    if (!order?.id || !dealerSlug) return;
    if (!window.confirm("Bạn xác nhận hoàn thành đơn hàng này?")) return;

    setActionLoading(true);
    try {
      await buyerOrder.confirmReceived(dealerSlug, order.id);
      toast.success("Đơn hàng đã hoàn thành!");
      await fetchDetail();
      onOrderUpdated?.();
    } catch (err) {
      toast.error(handleApiError(err, "Không thể hoàn thành đơn hàng."));
    } finally {
      setActionLoading(false);
    }
  }, [order?.id, dealerSlug, fetchDetail, onOrderUpdated]);

  // Đóng khi nhấn Escape + khoá scroll nền
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal box */}
      <div className="bg-[#f3f4f6] rounded-2xl w-full max-w-2xl max-h-[90vh]
        flex flex-col shadow-xl overflow-hidden">

        {/* ── Modal header ── */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex justify-between items-end flex-1 mr-4">
            {/* Trái */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-medium text-gray-900">
                Mã đơn hàng: {order?.order_code ?? "—"}
              </span>
              <span className="text-[12px] text-gray-400 font-medium">
                {order ? "Ngày giao hàng dự kiến: " + formatDateTimeVN(order.delivery_time) : "—"}
              </span>
            </div>

            {/* Phải */}
            <div className="flex flex-col gap-0.5 text-right">
              <p className="text-[12px] font-medium text-gray-900">
                {order?.payment_method ?? "—"}
              </p>
              <p className="text-[12px] font-medium text-gray-900">
                {order ? "Tổng tiền: " + Number(order.total_amount).toLocaleString("vi-VN") + "₫" : "—"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="hover:scale-105 cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
      hover:bg-gray-100 hover:text-gray-700 transition-colors flex-shrink-0"
            aria-label="Đóng"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Modal body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {loading && (
            <div className="flex items-center justify-center py-16 text-[13px] text-gray-400">
              Đang tải chi tiết đơn hàng...
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-[13px] text-red-500">{error}</p>
              <button
                onClick={fetchDetail}
                className="px-4 py-1.5 rounded-lg text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && order && (
            <>
              {/* 4. Thông tin giao hàng */}
              <DeliveryInfo order={order} />
              {/* 2. Bảng sản phẩm */}
              <ItemsTable items={order.items} />

              {/* 3. Thanh toán & tổng tiền */}
              <PaymentSummary order={order} />


              {/* 1. Lịch sử trạng thái */}
              <StatusTimeline order={order} />

              {/* 5. Mốc thời gian */}
              <div className="text-[11px] text-gray-400 px-2 space-y-0.5">
                <p>Đặt hàng lúc: {formatDateTime(order.created_at)}</p>
                {order.delivered_at && <p>Giao hàng lúc: {formatDateTime(order.delivered_at)}</p>}
                {order.completed_at && <p>Hoàn thành lúc: {formatDateTime(order.completed_at)}</p>}
              </div>
            </>
          )}
        </div>

        {!loading && !error && order && (
          <ModalActionFooter
            order={order}
            actionLoading={actionLoading}
            onConfirmDelivery={handleConfirmDelivery}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}