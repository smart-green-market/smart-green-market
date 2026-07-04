import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import OrderInfoCard from "../../components/User/Order/OrderInfoCard";
import CheckoutAddressSection from "../../components/User/Order/CheckoutAddressSection";
import OrderDeliverySection from "../../components/User/Order/OrderDeliverySection";
import OrderVoucherSection from "../../components/User/Order/OrderVoucherSection";
import OrderNoteSection from "../../components/User/Order/OrderNoteSection";
import OrderConfirmModal from "../../components/User/Order/OrderConfirmModal";
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
    buyerVoucherService,
    handleApiError as handleVoucherApiError,
} from "../../services/api/Buyer/buyerVoucherService";
import {
    buildCreateOrderPayload,
    buildVoucherApplyPayload,
    CHECKOUT_SHIPPING_FEE,
    findFirstAvailableDeliverySelection,
    findVoucherByCode,
    getVoucherEligibility,
    isDeliverySlotAvailable,
    parseAvailableVouchers,
    parseDeliverySlots,
    parseVoucherApplyResult,
} from "../../utils/buyerOrderUtils";

export default function OrderPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const paths = useStorefrontPaths();
    const { items: cartItems, removeItem } = useCart();

    const buyNowItem = location.state?.buyNow ?? null;

    const checkoutItems = useMemo(() => {
        if (buyNowItem) return [buyNowItem];
        return cartItems.filter((item) => item.selected);
    }, [buyNowItem, cartItems]);

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
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [vouchersLoading, setVouchersLoading] = useState(true);
    const [applyingVoucher, setApplyingVoucher] = useState(false);
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [voucherError, setVoucherError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [pageError, setPageError] = useState("");
    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

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

    const selectedAddress = useMemo(
        () => addresses.find((item) => item.id === selectedAddressId) ?? null,
        [addresses, selectedAddressId],
    );

    const selectedDeliveryDate = useMemo(
        () => deliveryDates.find((item) => item.date === selectedDate) ?? null,
        [deliveryDates, selectedDate],
    );

    const selectedDeliverySlot = useMemo(() => {
        return (
            selectedDeliveryDate?.slots?.find((item) => item.id === selectedSlot) ??
            null
        );
    }, [selectedDeliveryDate, selectedSlot]);

    const selectedDeliverySlotName = selectedDeliverySlot?.name ?? "";
    const selectedDeliverySlotTime = selectedDeliverySlot?.timeLabel ?? "";

    const discount = appliedVoucher?.discountAmount ?? 0;

    const checkoutItemsKey = useMemo(
        () =>
            checkoutItems
                .map((item) => `${item.id}:${item.quantity}`)
                .sort()
                .join("|"),
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
                    const { date, slotId } = findFirstAvailableDeliverySelection(dates);
                    setSelectedDate(date);
                    setSelectedSlot(slotId);
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

    useEffect(() => {
        if (!paths.slug) {
            setVouchersLoading(false);
            return;
        }

        let cancelled = false;

        buyerVoucherService
            .getAll({ dealer_slug: paths.slug })
            .then((data) => {
                if (cancelled) return;
                setAvailableVouchers(parseAvailableVouchers(data));
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error("Failed to load vouchers:", err);
                    setAvailableVouchers([]);
                }
            })
            .finally(() => {
                if (!cancelled) setVouchersLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [paths.slug]);

    useEffect(() => {
        setAppliedVoucher(null);
        setVoucherError("");
    }, [checkoutItemsKey]);

    const handleSelectDate = (date) => {
        setSelectedDate(date);
        const entry = deliveryDates.find((item) => item.date === date);
        const firstAvailable = entry?.slots.find((slot) => slot.available);
        setSelectedSlot(firstAvailable?.id ?? entry?.slots[0]?.id ?? "");
    };

    const handleCreateAddress = async (form) => createAddress(form);

    const handleVoucherCodeChange = (value) => {
        setVoucherCode(value);
        if (appliedVoucher && value.trim() !== appliedVoucher.code) {
            setAppliedVoucher(null);
        }
        if (voucherError) setVoucherError("");
    };

    const handleApplyVoucher = async (code = voucherCode) => {
        const trimmedCode = String(code ?? "").trim();
        if (!trimmedCode || applyingVoucher) return;

        const matchedVoucher = findVoucherByCode(availableVouchers, trimmedCode);
        if (matchedVoucher) {
            const eligibility = getVoucherEligibility(matchedVoucher, subtotal);
            if (!eligibility.eligible) {
                setVoucherError(eligibility.reason);
                return;
            }
        }

        setApplyingVoucher(true);
        setVoucherError("");

        try {
            const payload = buildVoucherApplyPayload(
                trimmedCode,
                checkoutItems,
                paths.slug,
            );
            const result = await buyerVoucherService.apply(payload);
            const parsed = parseVoucherApplyResult(result, trimmedCode);

            if (!parsed || parsed.valid === false) {
                throw new Error(parsed?.message || "Không thể xác thực voucher");
            }

            if (!parsed.code && !parsed.discountAmount) {
                throw new Error("Không thể xác thực voucher");
            }

            setVoucherCode(parsed.code || trimmedCode);
            setAppliedVoucher({
                ...parsed,
                code: parsed.code || trimmedCode,
            });
            appToast.success("Áp dụng voucher thành công");
        } catch (err) {
            const message = handleVoucherApiError(
                err,
                "Mã voucher không hợp lệ hoặc không áp dụng được",
            );
            setVoucherError(message);
            setAppliedVoucher(null);
            appToast.warning(message);
        } finally {
            setApplyingVoucher(false);
        }
    };

    const handleSelectVoucher = (voucher) => {
        if (!voucher?.code) return;

        const eligibility = getVoucherEligibility(voucher, subtotal);
        setVoucherCode(voucher.code);

        if (!eligibility.eligible) {
            setVoucherError(eligibility.reason);
            setAppliedVoucher(null);
            return;
        }

        setVoucherError("");
        handleApplyVoucher(voucher.code);
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherCode("");
        setVoucherError("");
    };

    const canSubmit =
        checkoutItems.length > 0 &&
        selectedAddressId != null &&
        selectedDate &&
        selectedSlot &&
        isDeliverySlotAvailable(deliveryDates, selectedDate, selectedSlot) &&
        !submitting;

    const handleOpenConfirm = () => {
        if (!canSubmit) return;
        setConfirmOpen(true);
    };

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
                voucherCode: appliedVoucher?.code ?? voucherCode,
            });

            const order = await buyerOrder.create(paths.slug, payload);

            checkoutItems.forEach((item) => {
                const inCart = cartItems.some(
                    (cartItem) => String(cartItem.id) === String(item.id),
                );
                if (inCart) removeItem(item.id);
            });

            setConfirmOpen(false);
            appToast.success("Đặt hàng thành công");
            navigate(paths.orderStatus, {
                replace: true,
                state: { newOrderId: order?.id, orderCode: order?.order_code },
            });
        } catch (err) {
            const message = handleOrderApiError(err, "Đặt hàng không thành công");
            setPageError(message);
            appToast.warning(message);
            throw err;
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
                    to={buyNowItem ? paths.product(buyNowItem.id) : paths.cart}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 no-underline hover:text-teal-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {buyNowItem ? "Quay lại sản phẩm" : "Quay lại giỏ hàng"}
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
                        onVoucherCodeChange={handleVoucherCodeChange}
                        appliedVoucher={appliedVoucher}
                        availableVouchers={availableVouchers}
                        subtotal={subtotal}
                        loading={vouchersLoading}
                        applying={applyingVoucher}
                        error={voucherError}
                        disabled={submitting}
                        onApply={() => handleApplyVoucher()}
                        onRemove={handleRemoveVoucher}
                        onSelectVoucher={handleSelectVoucher}
                    />
                    <PaymentSummaryCard
                        subtotal={subtotal}
                        shippingFee={CHECKOUT_SHIPPING_FEE}
                        discount={discount}
                        submitting={submitting}
                        disabled={!canSubmit}
                        onPay={handleOpenConfirm}
                    />
                </div>
            </div>

            <OrderConfirmModal
                open={confirmOpen}
                onClose={() => {
                    if (!submitting) setConfirmOpen(false);
                }}
                onConfirm={handlePlaceOrder}
                submitting={submitting}
                itemCount={checkoutItems.length}
                subtotal={subtotal}
                shippingFee={CHECKOUT_SHIPPING_FEE}
                discount={discount}
                deliveryLabel={selectedDeliveryDate?.label ?? ""}
                deliverySlotName={selectedDeliverySlotName}
                deliverySlotTime={selectedDeliverySlotTime}
                address={selectedAddress}
                note={note}
            />

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
