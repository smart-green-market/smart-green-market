import {
  Ban,
  Clock3,
  PackageCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

export const PREORDER_STATUS_CONFIG = {
  submitted: {
    buyerLabel: "Chờ đại lý",
    dealerLabel: "Chờ xử lý",
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-200",
    border: "border-amber-200",
    accent: "bg-amber-500",
    icon: Clock3,
    needsDealerAction: true,
    needsBuyerAction: false,
  },
  customer_confirmation_pending: {
    buyerLabel: "Cần bạn xác nhận",
    dealerLabel: "Chờ khách xác nhận",
    bg: "bg-sky-50",
    text: "text-sky-800",
    ring: "ring-sky-200",
    border: "border-sky-200",
    accent: "bg-sky-500",
    icon: UserCheck,
    needsDealerAction: false,
    needsBuyerAction: true,
  },
  converted: {
    buyerLabel: "Đã thành đơn",
    dealerLabel: "Đã chuyển đơn",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "ring-emerald-200",
    border: "border-emerald-200",
    accent: "bg-emerald-500",
    icon: PackageCheck,
    needsDealerAction: false,
    needsBuyerAction: false,
  },
  rejected_by_dealer: {
    buyerLabel: "Đại lý từ chối",
    dealerLabel: "Đã từ chối",
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
    border: "border-red-200",
    accent: "bg-red-500",
    icon: XCircle,
    needsDealerAction: false,
    needsBuyerAction: false,
  },
  rejected_by_customer: {
    buyerLabel: "Bạn đã từ chối",
    dealerLabel: "Khách từ chối",
    bg: "bg-orange-50",
    text: "text-orange-800",
    ring: "ring-orange-200",
    border: "border-orange-200",
    accent: "bg-orange-500",
    icon: Ban,
    needsDealerAction: false,
    needsBuyerAction: false,
  },
  cancelled: {
    buyerLabel: "Đã hủy",
    dealerLabel: "Đã hủy",
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    ring: "ring-neutral-200",
    border: "border-neutral-200",
    accent: "bg-neutral-400",
    icon: Ban,
    needsDealerAction: false,
    needsBuyerAction: false,
  },
};

const FALLBACK_CONFIG = {
  buyerLabel: "Không xác định",
  dealerLabel: "Không xác định",
  bg: "bg-neutral-100",
  text: "text-neutral-600",
  ring: "ring-neutral-200",
  border: "border-neutral-200",
  accent: "bg-neutral-400",
  icon: Clock3,
  needsDealerAction: false,
  needsBuyerAction: false,
};

export function getPreOrderStatusMeta(status, audience = "buyer") {
  const config = PREORDER_STATUS_CONFIG[status] ?? FALLBACK_CONFIG;
  return {
    ...config,
    status,
    label: audience === "dealer" ? config.dealerLabel : config.buyerLabel,
  };
}

export const BUYER_PREORDER_FILTERS = [
  { value: "", label: "Tất cả", countKey: "all", color: "text-neutral-700" },
  {
    value: "customer_confirmation_pending",
    label: "Cần xác nhận",
    countKey: "customer_confirmation_pending",
    color: "text-sky-700",
  },
  {
    value: "submitted",
    label: "Chờ đại lý",
    countKey: "submitted",
    color: "text-amber-700",
  },
  {
    value: "converted",
    label: "Đã thành đơn",
    countKey: "converted",
    color: "text-emerald-700",
  },
  {
    value: "rejected_by_dealer",
    label: "Bị từ chối",
    countKey: "rejected_by_dealer",
    color: "text-red-700",
  },
];

export function countPreOrdersByStatus(requests = []) {
  const counts = {
    all: requests.length,
    submitted: 0,
    customer_confirmation_pending: 0,
    converted: 0,
    rejected_by_dealer: 0,
    rejected_by_customer: 0,
    cancelled: 0,
  };

  requests.forEach((item) => {
    const status = item.status ?? item.raw?.status;
    if (status && counts[status] != null) {
      counts[status] += 1;
    }
  });

  counts.action = counts.submitted;
  counts.review = counts.customer_confirmation_pending;
  counts.done = counts.converted;
  counts.closed =
    counts.rejected_by_dealer + counts.rejected_by_customer + counts.cancelled;

  return counts;
}

export const DEALER_PREORDER_FILTERS = [
  { value: "", label: "Tất cả", countKey: "all", color: "text-neutral-700" },
  {
    value: "submitted",
    label: "Chờ xử lý",
    countKey: "submitted",
    color: "text-amber-700",
  },
  {
    value: "customer_confirmation_pending",
    label: "Chờ khách",
    countKey: "customer_confirmation_pending",
    color: "text-sky-700",
  },
  {
    value: "converted",
    label: "Đã chuyển đơn",
    countKey: "converted",
    color: "text-emerald-700",
  },
  {
    value: "rejected_by_dealer",
    label: "Đã từ chối",
    countKey: "rejected_by_dealer",
    color: "text-red-700",
  },
  {
    value: "rejected_by_customer",
    label: "Khách từ chối",
    countKey: "rejected_by_customer",
    color: "text-orange-700",
  },
];

export function formatPreOrderDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
