import ConfirmModal from "../../common/ConfirmModal";
import { formatCurrency } from "../Cart/mockData";

export default function OrderConfirmModal({
    open,
    onClose,
    onConfirm,
    submitting = false,
    itemCount = 0,
    subtotal = 0,
    shippingFee = 0,
    discount = 0,
    deliveryLabel = "",
    deliverySlotName = "",
    deliverySlotTime = "",
    address = null,
    note = "",
}) {
    const total = Math.max(0, subtotal + shippingFee - discount);
    const addressLine = address
        ? `${address.receiver_name} • ${address.receiver_phone}`
        : "—";
    const addressDetail = address?.address ?? "—";

    return (
        <ConfirmModal
            isOpen={open}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Xác nhận đặt hàng"
            confirmText="Xác nhận đặt hàng"
            cancelText="Quay lại"
            variant="info"
            showToast={false}
            loading={submitting}
            message={
                <div className="space-y-4 text-sm text-neutral-700">
                    <p>
                        Vui lòng kiểm tra lại thông tin trước khi đặt hàng. Đơn hàng sẽ được
                        xử lý và giao theo khung giờ đã chọn.
                    </p>

                    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                        <p className="font-semibold text-emerald-950">Sản phẩm</p>
                        <p className="mt-1">
                            {itemCount} sản phẩm • Tổng{" "}
                            <span className="font-semibold text-green-900">
                                {formatCurrency(total)}
                            </span>
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                            Thanh toán COD khi nhận hàng
                        </p>
                    </div>

                    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                        <p className="font-semibold text-emerald-950">Giao hàng</p>
                        <p className="mt-1">{deliveryLabel || "—"}</p>
                        <p className="mt-0.5 text-neutral-600">
                            Khung giờ:{" "}
                            {deliverySlotName
                                ? deliverySlotTime
                                    ? `${deliverySlotName} (${deliverySlotTime})`
                                    : deliverySlotName
                                : "—"}
                        </p>
                    </div>

                    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                        <p className="font-semibold text-emerald-950">Địa chỉ nhận hàng</p>
                        <p className="mt-1">{addressLine}</p>
                        <p className="mt-0.5 text-neutral-600">{addressDetail}</p>
                    </div>

                    {note?.trim() ? (
                        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                            <p className="font-semibold text-emerald-950">Ghi chú</p>
                            <p className="mt-1 whitespace-pre-wrap">{note.trim()}</p>
                        </div>
                    ) : null}
                </div>
            }
        />
    );
}
