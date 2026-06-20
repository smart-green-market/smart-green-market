import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import OrderInfoCard from "../../components/User/Order/OrderInfoCard";
import CheckoutAddressSection from "../../components/User/Order/CheckoutAddressSection";
import OrderDeliverySection from "../../components/User/Order/OrderDeliverySection";
import OrderVoucherSection from "../../components/User/Order/OrderVoucherSection";
import OrderNoteSection from "../../components/User/Order/OrderNoteSection";
import PaymentSummaryCard from "../../components/User/Order/PaymentSummaryCard";
import AddressFormModal from "../../components/User/Profile/AddressFormModal";
import { appToast } from "../../components/common/toast";
import { useCart } from "../../contexts/cartProvider";
import { useBuyerAddresses } from "../../hooks/useBuyerAddresses";
import { useStorefrontPaths } from "../../hooks/useStorefrontPaths";
import {
    buyerOrder,
    handleApiError as handleOrderApiError,
} from "../../services/api/Buyer/buyerOrder";
import {
    buildCreateOrderPayload,
    CHECKOUT_SHIPPING_FEE,
    parseDeliverySlots,
} from "../../utils/buyerOrderUtils";

export default function OrderPage() {
    const navigate = useNavigate();
    const paths = useStorefrontPaths();
    const { items: cartItems, removeItem } = useCart();

    const checkoutItems = useMemo(
        () => cartItems.filter((item) => item.selected),
        [cartItems],
    );

    const {
        addresses,
        loading: addressLoading,
        saving: addressSaving,
        error: addressError,
        defaultAddressId,
        canAddMore,
        maxAddresses,
        createAddress,
    } = useBuyerAddresses();

    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [deliveryDates, setDeliveryDates] = useState([]);
    const [deliveryLoading, setDeliveryLoading] = useState(true);
    const [deliveryError, setDeliveryError] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [note, setNote] = useState("");
    const [voucherCode, setVoucherCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [pageError, setPageError] = useState("");
    const [addressModalOpen, setAddressModalOpen] = useState(false);

    const subtotal = useMemo(
        () =>
            checkoutItems.reduce(
                (sum, item) => sum + Number(item.price) * Number(item.quantity),
                0,
            ),
        [checkoutItems],
    );

    const orderItems = useMemo(
        () =>
            checkoutItems.map((item) => ({
                id: item.id,
                name: item.name,
                image: item.image,
                unitPrice: item.price,
                unit: item.unit,
                quantity: item.quantity,
            })),
        [checkoutItems],
    );

    useEffect(() => {
        if (checkoutItems.length === 0) return;
        if (selectedAddressId != null) return;

        const defaultId =
            defaultAddressId ??
            addresses.find((item) => item.is_default)?.id ??
            addresses[0]?.id ??
            null;

        if (defaultId != null) {
            setSelectedAddressId(defaultId);
        }
    }, [addresses, defaultAddressId, selectedAddressId, checkoutItems.length]);

    useEffect(() => {
        if (!paths.slug) {
            setDeliveryLoading(false);
            setDeliveryError("Chưa xác định cửa hàng.");
            return;
        }

        let cancelled = false;

        buyerOrder
            .getDelivery(paths.slug)
            .then((data) => {
                if (cancelled) return;
                const dates = parseDeliverySlots(data);
                setDeliveryDates(dates);
                setDeliveryError("");

                if (dates.length) {
                    setSelectedDate(dates[0].date);
                    setSelectedSlot(dates[0].slots[0]?.id ?? "");
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setDeliveryError(
                        handleOrderApiError(err, "Không thể tải khung giờ giao hàng"),
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setDeliveryLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [paths.slug]);

    const handleSelectDate = (date) => {
        setSelectedDate(date);
        const entry = deliveryDates.find((item) => item.date === date);
        setSelectedSlot(entry?.slots[0]?.id ?? "");
    };

    const handleCreateAddress = async (form) => createAddress(form);

    const canSubmit =
        checkoutItems.length > 0 &&
        selectedAddressId != null &&
        selectedDate &&
        selectedSlot &&
        !submitting;

    const handlePlaceOrder = async () => {
        if (!canSubmit || !paths.slug) return;

        setSubmitting(true);
        setPageError("");

        try {
            const payload = buildCreateOrderPayload({
                items: checkoutItems,
                customerAddressId: selectedAddressId,
                deliveryDate: selectedDate,
                deliverySlot: selectedSlot,
                note,
            });

            const order = await buyerOrder.create(paths.slug, payload);

            checkoutItems.forEach((item) => removeItem(item.id));

            appToast.success("Đặt hàng thành công");
            navigate(paths.orderStatus, {
                replace: true,
                state: { newOrderId: order?.id, orderCode: order?.order_code },
            });
        } catch (err) {
            const message = handleOrderApiError(err, "Đặt hàng không thành công");
            setPageError(message);
            appToast.warning(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!paths.slug) {
        return (
            <div className="mx-auto flex min-h-[50vh] max-w-[1280px] flex-col items-center justify-center gap-4 px-10 text-center">
                <p className="text-neutral-600">
                    Chưa xác định cửa hàng. Vui lòng truy cập qua link cửa hàng đại lý.
                </p>
                <Link to="/" className="text-sm font-semibold text-emerald-800 no-underline">
                    Về trang chủ
                </Link>
            </div>
        );
    }

    if (checkoutItems.length === 0) {
        return (
            <div className="mx-auto w-full max-w-[1280px] px-4 py-16 text-center sm:px-10">
                <h1 className="text-2xl font-bold text-emerald-950">Xác nhận đơn hàng</h1>
                <p className="mt-3 text-neutral-600">
                    Chưa có sản phẩm nào được chọn để đặt hàng.
                </p>
                <Link
                    to={paths.cart}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 no-underline hover:text-teal-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại giỏ hàng
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-10 sm:py-12">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-emerald-950 sm:text-4xl">
                        Xác nhận đơn hàng
                    </h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        {checkoutItems.length} sản phẩm • Thanh toán COD
                    </p>
                </div>
                <Link
                    to={paths.cart}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 no-underline hover:text-teal-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại giỏ hàng
                </Link>
            </div>

            {pageError ? (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {pageError}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="space-y-6">
                    <OrderInfoCard items={orderItems} subtotal={subtotal} />

                    <CheckoutAddressSection
                        addresses={addresses}
                        selectedAddressId={selectedAddressId}
                        loading={addressLoading}
                        saving={addressSaving}
                        error={addressError}
                        canAddMore={canAddMore}
                        maxAddresses={maxAddresses}
                        onSelectAddress={setSelectedAddressId}
                        onAddAddress={() => {
                            if (!canAddMore) {
                                appToast.warning(
                                    `Chỉ được thêm tối đa ${maxAddresses} địa chỉ.`,
                                );
                                return;
                            }
                            setAddressModalOpen(true);
                        }}
                    />

                    <OrderDeliverySection
                        dates={deliveryDates}
                        loading={deliveryLoading}
                        error={deliveryError}
                        selectedDate={selectedDate}
                        selectedSlot={selectedSlot}
                        onSelectDate={handleSelectDate}
                        onSelectSlot={setSelectedSlot}
                    />

                    <OrderNoteSection value={note} onChange={setNote} />
                </div>

                <div className="space-y-4">
                    <OrderVoucherSection
                        voucherCode={voucherCode}
                        onVoucherCodeChange={setVoucherCode}
                        disabled
                    />
                    <PaymentSummaryCard
                        subtotal={subtotal}
                        shippingFee={CHECKOUT_SHIPPING_FEE}
                        discount={0}
                        submitting={submitting}
                        disabled={!canSubmit}
                        onPay={handlePlaceOrder}
                    />
                </div>
            </div>

            <AddressFormModal
                open={addressModalOpen}
                mode="create"
                address={null}
                saving={addressSaving}
                onClose={() => setAddressModalOpen(false)}
                onSubmit={async (form) => {
                    const result = await handleCreateAddress(form);
                    if (result.success) setAddressModalOpen(false);
                    return result;
                }}
            />
        </div>
    );
}
