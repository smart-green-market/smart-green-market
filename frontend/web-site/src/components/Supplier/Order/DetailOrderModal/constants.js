import {
  Clock, CheckCircle2, PackageCheck, Truck, CheckCheck,
} from "lucide-react";

// ─── TIMELINE STEPS ──────────────────────────────────────────────────────────
export const ORDER_STEPS = [
  { key: "pending_supplier_confirmation", label: "Chờ xác nhận", icon: Clock },
  { key: "confirmed",                     label: "Đã xác nhận",  icon: CheckCircle2 },
  { key: "processing",                    label: "Chuẩn bị hàng",    icon: PackageCheck },
  { key: "shipping",                      label: "Đang giao",        icon: Truck },
  { key: "completed",                     label: "Hoàn thành",       icon: CheckCheck },
];

// Map mọi trạng thái về step tương ứng trên timeline
export const STEP_INDEX = {
  pending_supplier_confirmation:            0,
  confirmed:                                1,
  deposit_pending_verification:             1,
  deposit_paid:                             1,
  processing:                               2,
  shipping:                                 3,
  delivered:                                3,
  final_payment_pending_verification:       3,
  completed:                                4,
  return_requested:                         4,
  return_request:                           4,
  return_pending_review:                    4,
  return_approved:                          4,
  return_rejected:                          4,
  returned:                                 4,
  rejected:                                 -1,
  cancelled:                                -1,
};

// Sub-status label hiển thị dưới step active
export const SUB_STATUS_LABEL = {
  pending_dealer_confirmation:          "Chờ đại lý xác nhận điều chỉnh",
  deposit_pending_verification:         "Chờ xác nhận tiền cọc",
  deposit_paid:                         "Đã thanh toán cọc",
  delivered:                            "Đã giao hàng",
  final_payment_pending_verification:   "Chờ xác nhận TT cuối",
  return_requested:                     "Yêu cầu trả hàng",
  return_request:                       "Yêu cầu trả hàng",
  return_pending_review:                "Yêu cầu trả hàng",
  return_approved:                      "Đã duyệt trả hàng",
  return_rejected:                      "Từ chối trả hàng",
  returned:                             "Đã trả hàng",
};

// ─── PAYMENT ─────────────────────────────────────────────────────────────────
export const PAYMENT_STATUS = {
  pending:  { label: "Chờ xác minh", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  verified: { label: "Đã xác minh",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Từ chối",      cls: "bg-red-50 text-red-600 border-red-200" },
};

export const RETURN_RECORD_STATUS = {
  pending:         { label: "Chờ duyệt",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  pending_review:  { label: "Chờ duyệt",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  requested:       { label: "Chờ duyệt",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  approved:        { label: "Đã duyệt",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected:        { label: "Từ chối",      cls: "bg-red-50 text-red-600 border-red-200" },
};

export function getReturnRecordStatusBadge(ret) {
  if (!ret) return RETURN_RECORD_STATUS.pending;
  const key = String(ret.status ?? "").toLowerCase();
  if (RETURN_RECORD_STATUS[key]) return RETURN_RECORD_STATUS[key];
  if (ret.status_label) {
    const tone = key.includes("reject")
      ? "r"
      : key.includes("approv")
        ? "g"
        : "a";
    const cls =
      tone === "r"
        ? "bg-red-50 text-red-600 border-red-200"
        : tone === "g"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-amber-50 text-amber-700 border-amber-200";
    return { label: ret.status_label, cls };
  }
  return RETURN_RECORD_STATUS.pending;
}

export const PAYMENT_TYPE = {
  deposit:       "Đặt cọc",
  full:          "Thanh toán đủ",
  final_payment: "Thanh toán còn lại",
};

export const PAYMENT_METHOD = {
  bank_transfer: "Chuyển khoản",
  cash:          "Tiền mặt",
  momo:          "MoMo",
};
