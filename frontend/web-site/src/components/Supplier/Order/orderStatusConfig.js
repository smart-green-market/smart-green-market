/** Trạng thái phiếu nhập — bám enum BE (Supplier) */
export const SUPPLIER_ORDER_STATUS = {
  pending_supplier_confirmation: { label: "Chờ xác nhận", tone: "a" },
  rejected: { label: "Từ chối", tone: "r" },
  pending_dealer_confirmation: { label: "Chờ đại lý xác nhận điều chỉnh", tone: "a" },
  confirmed: { label: "Đã xác nhận", tone: "b" },
  deposit_pending_verification: { label: "Chờ xác nhận tiền cọc", tone: "a" },
  deposit_paid: { label: "Đã thanh toán cọc", tone: "b" },
  processing: { label: "Đang chuẩn bị hàng", tone: "b" },
  shipping: { label: "Đang giao hàng", tone: "a" },
  delivered: { label: "Đã giao hàng", tone: "g" },
  final_payment_pending_verification: { label: "Chờ xác nhận thanh toán cuối", tone: "a" },
  return_requested: { label: "Yêu cầu trả hàng", tone: "a" },
  return_approved: { label: "Đã duyệt trả hàng", tone: "g" },
  return_rejected: { label: "Từ chối trả hàng", tone: "r" },
  returned: { label: "Đã trả hàng", tone: "p" },
  completed: { label: "Hoàn tất", tone: "g" },
  cancelled: { label: "Đã hủy", tone: "gr" },
  // alias cũ (nếu BE/FE còn sót)
  return_request: { label: "Yêu cầu trả hàng", tone: "a" },
  return_pending_review: { label: "Yêu cầu trả hàng", tone: "a" },
};

export const SUPPLIER_ORDER_STATUS_FILTERS = [
  { key: "all", label: "Tất cả trạng thái" },
  { key: "pending_supplier_confirmation", label: "Chờ NCC xác nhận" },
  { key: "pending_dealer_confirmation", label: "Chờ đại lý xác nhận điều chỉnh" },
  { key: "rejected", label: "NCC từ chối" },
  { key: "confirmed", label: "NCC đã xác nhận" },
  { key: "deposit_pending_verification", label: "Chờ xác nhận tiền cọc" },
  { key: "deposit_paid", label: "Đã thanh toán cọc" },
  { key: "processing", label: "Đang chuẩn bị hàng" },
  { key: "shipping", label: "Đang giao hàng" },
  { key: "delivered", label: "Đã giao hàng" },
  { key: "final_payment_pending_verification", label: "Chờ xác nhận thanh toán cuối" },
  {
    key: "return_requested",
    label: "Yêu cầu trả hàng",
    statuses: ["return_requested", "return_request", "return_pending_review"],
  },
  { key: "return_approved", label: "Đã duyệt trả hàng" },
  { key: "return_rejected", label: "Từ chối trả hàng" },
  { key: "returned", label: "Đã trả hàng" },
  { key: "completed", label: "Hoàn tất" },
  { key: "cancelled", label: "Đã hủy" },
];

export function getSupplierOrderStatusConfig(status) {
  return SUPPLIER_ORDER_STATUS[status] ?? { label: status || "Không xác định", tone: "gr" };
}
