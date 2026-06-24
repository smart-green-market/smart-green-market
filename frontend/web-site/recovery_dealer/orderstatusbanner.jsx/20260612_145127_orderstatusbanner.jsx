import React from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Truck,
  PackageCheck,
  AlertTriangle,
  Ban,
  PartyPopper,
  Loader2,
} from "lucide-react";

/**
 * Thanh thông báo trạng thái — hiển thị hướng dẫn cho Đại lý biết
 * đơn hàng đang ở bước nào trong quy trình và cần làm gì tiếp theo.
 *
 * Luồng nghiệp vụ:
 * 1. Đại lý tạo phiếu → pending_supplier_confirmation → NCC nhận thông báo
 * 2. NCC xác nhận → confirmed → Đại lý nhận thông báo thanh toán cọc
 * 3. Đại lý nộp cọc → deposit_pending_verification → NCC nhận thông báo duyệt cọc
 * 4. NCC duyệt cọc → processing → NCC chuẩn bị hàng
 * 5. NCC giao hàng → shipping → Đại lý nhận thông báo xác nhận nhận hàng
 * 6. Đại lý nhận hàng → delivered → Đại lý thanh toán phần còn lại
 * 7. Đại lý nộp thanh toán cuối → final_payment_pending_verification → NCC duyệt
 * 8. NCC duyệt → completed
 */

const STATUS_CONFIG = {
  pending_supplier_confirmation: {
    icon: Clock,
    color: "bg-amber-50 border-amber-200 text-amber-800",
    iconColor: "text-amber-600",
    title: "Đang chờ Nhà cung cấp xác nhận",
    description:
      "Phiếu nhập đã được gửi tới Nhà cung cấp. Hệ thống đã thông báo cho NCC. Bạn sẽ nhận được thông báo khi NCC xác nhận hoặc từ chối đơn hàng.",
    hint: "Bạn có thể hủy phiếu nếu cần thay đổi.",
  },
  rejected: {
    icon: XCircle,
    color: "bg-red-50 border-red-200 text-red-800",
    iconColor: "text-red-600",
    title: "Nhà cung cấp đã từ chối phiếu nhập",
    description:
      "Nhà cung cấp đã từ chối đơn hàng này. Vui lòng xem lý do từ chối bên dưới và tạo phiếu nhập mới nếu cần.",
    hint: null,
  },
  confirmed: {
    icon: CreditCard,
    color: "bg-blue-50 border-blue-200 text-blue-800",
    iconColor: "text-blue-600",
    title: "NCC đã xác nhận — Vui lòng thanh toán tiền cọc",
    description:
      "Nhà cung cấp đã xác nhận đơn hàng! Bước tiếp theo: Quét mã VietQR bên dưới để chuyển khoản đặt cọc (30%), sau đó tải lên ảnh biên lai để NCC xác nhận.",
    hint: "Sau khi nộp biên lai, NCC sẽ nhận thông báo để duyệt thanh toán.",
  },
  deposit_pending_verification: {
    icon: Loader2,
    color: "bg-amber-50 border-amber-200 text-amber-800",
    iconColor: "text-amber-600 animate-spin",
    title: "Đang chờ NCC xác nhận tiền cọc",
    description:
      "Biên lai thanh toán cọc của bạn đã được gửi tới Nhà cung cấp. Hệ thống đã thông báo cho NCC kiểm tra và xác nhận. Vui lòng chờ...",
    hint: "Nếu NCC từ chối, bạn sẽ được yêu cầu chuyển khoản lại.",
  },
  processing: {
    icon: PackageCheck,
    color: "bg-indigo-50 border-indigo-200 text-indigo-800",
    iconColor: "text-indigo-600",
    title: "NCC đã nhận cọc — Đang chuẩn bị hàng",
    description:
      "Nhà cung cấp đã xác nhận nhận tiền cọc thành công và đang thu hoạch / chuẩn bị hàng cho bạn. Bạn sẽ nhận thông báo khi hàng bắt đầu giao.",
    hint: null,
  },
  shipping: {
    icon: Truck,
    color: "bg-sky-50 border-sky-200 text-sky-800",
    iconColor: "text-sky-600",
    title: "Hàng đang trên đường giao tới bạn",
    description:
      "Nhà cung cấp đã bắt đầu giao hàng. Khi nhận đủ hàng và kiểm tra đạt tiêu chuẩn, hãy bấm nút \"Xác nhận đã nhận hàng\" bên dưới.",
    hint: "Kiểm tra kỹ số lượng và chất lượng nông sản trước khi xác nhận.",
  },
  delivered: {
    icon: CreditCard,
    color: "bg-blue-50 border-blue-200 text-blue-800",
    iconColor: "text-blue-600",
    title: "Đã nhận hàng — Vui lòng thanh toán phần còn lại",
    description:
      "Bạn đã xác nhận nhận hàng thành công! Bước cuối cùng: Quét mã VietQR bên dưới để chuyển khoản số tiền còn lại, sau đó tải lên ảnh biên lai.",
    hint: "Sau khi NCC duyệt thanh toán cuối, đơn hàng sẽ hoàn tất và hàng được tự động nhập kho.",
  },
  final_payment_pending_verification: {
    icon: Loader2,
    color: "bg-amber-50 border-amber-200 text-amber-800",
    iconColor: "text-amber-600 animate-spin",
    title: "Đang chờ NCC xác nhận thanh toán cuối",
    description:
      "Biên lai thanh toán cuối của bạn đã được gửi tới Nhà cung cấp. Hệ thống đã thông báo cho NCC kiểm tra và xác nhận.",
    hint: "Khi NCC duyệt xong, đơn hàng tự động hoàn tất và hàng nhập vào kho đại lý.",
  },
  completed: {
    icon: PartyPopper,
    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
    iconColor: "text-emerald-600",
    title: "Phiếu nhập đã hoàn tất!",
    description:
      "Toàn bộ quy trình đã hoàn tất. Thanh toán đã được xác nhận và hàng hóa đã được nhập vào kho đại lý của bạn.",
    hint: null,
  },
  cancelled: {
    icon: Ban,
    color: "bg-neutral-100 border-neutral-300 text-neutral-600",
    iconColor: "text-neutral-500",
    title: "Phiếu nhập đã bị hủy",
    description: "Phiếu nhập hàng này đã bị hủy. Bạn có thể tạo phiếu nhập mới nếu cần.",
    hint: null,
  },
  draft: {
    icon: AlertTriangle,
    color: "bg-violet-50 border-violet-200 text-violet-800",
    iconColor: "text-violet-600",
    title: "Đơn nháp — Chưa gửi cho Nhà cung cấp",
    description:
      "Đây là bản xem trước phiếu nhập. Vui lòng kiểm tra thông tin bên dưới rồi bấm \"Xác nhận gửi phiếu\" để gửi tới Nhà cung cấp.",
    hint: "Sau khi gửi, NCC sẽ nhận thông báo và xem xét đơn hàng của bạn.",
  },
};

export default function OrderStatusBanner({ rawStatus, rejectionReason }) {
  const config = STATUS_CONFIG[rawStatus];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={`mb-6 rounded-2xl border-2 p-5 ${config.color} flex gap-4 items-start`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/60 ${config.iconColor}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-extrabold text-sm leading-tight">{config.title}</h3>
        <p className="text-xs font-medium mt-1.5 leading-relaxed opacity-80">
          {config.description}
        </p>
        {rawStatus === "rejected" && rejectionReason && (
          <div className="mt-3 bg-red-100 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-700">
            <span className="opacity-60">Lý do từ chối: </span>
            {rejectionReason}
          </div>
        )}
        {config.hint && (
          <p className="text-[11px] font-semibold mt-2 opacity-60 italic">
             {config.hint}
          </p>
        )}
      </div>
    </div>
  );
}
