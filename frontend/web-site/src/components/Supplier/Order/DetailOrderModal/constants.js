import {
  Clock, CheckCircle2, PackageCheck, Truck, CheckCheck,
} from "lucide-react";

// ─── TIMELINE STEPS ──────────────────────────────────────────────────────────
export const ORDER_STEPS = [
  { key: "pending_supplier_confirmation", label: "Chờ xác nhận",  icon: Clock },
  { key: "confirmed",                     label: "Đã xác nhận",   icon: CheckCircle2 },
  { key: "processing",                    label: "Chuẩn bị hàng", icon: PackageCheck },
  { key: "shipping",                      label: "Đang giao",     icon: Truck },
  { key: "completed",                     label: "Hoàn thành",    icon: CheckCheck },
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
  rejected:                                 -1,
  cancelled:                                -1,
};

// Sub-status label hiển thị dưới step active
export const SUB_STATUS_LABEL = {
  deposit_pending_verification:         "Chờ xác nhận cọc",
  deposit_paid:                         "Đã cọc",
  delivered:                            "Đã giao hàng",
  final_payment_pending_verification:   "Chờ TT cuối",
};

// ─── PAYMENT ─────────────────────────────────────────────────────────────────
export const PAYMENT_STATUS = {
  pending:  { label: "Chờ xác minh", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  verified: { label: "Đã xác minh",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Từ chối",      cls: "bg-red-50 text-red-600 border-red-200" },
};

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
