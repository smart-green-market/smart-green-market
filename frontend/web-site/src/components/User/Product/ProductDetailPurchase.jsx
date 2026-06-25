import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BadgeCheck,
    Building2,
    Clock3,
    Heart,
    Leaf,
    Loader2,
    Minus,
    Package,
    Plus,
    ShoppingCart,
    Zap,
} from "lucide-react";
import { useCart } from "../../../contexts/cartProvider";
import { useAuth } from "../../../contexts/authProvider";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import { showAddToCartFeedback } from "../../../utils/cartAddFeedback";
import { isBuyerUser } from "../../../utils/buyerAuthUtils";
import { buildCartItemFromProduct } from "../../../utils/cartUtils";
import {
    formatProductPrice,
    formatStorageDuration,
    formatUnitLabel,
    getProductPrice,
    getStockLabel,
    isProductInStock,
} from "../../../utils/userProductUtils";
import StarRating from "./StarRating";

function MetaRow({ icon: Icon, label, value }) {
    if (!value) return null;

    return (
        <div className="flex items-center justify-between gap-4 border-b border-stone-100 py-3 last:border-b-0">
            <div className="flex items-center gap-2 text-neutral-500">
                <Icon className="h-4 w-4 shrink-0 text-emerald-700" />
                <span className="text-sm">{label}</span>
            </div>
            <span className="text-right text-sm font-medium text-zinc-800">{value}</span>
        </div>
    );
}

export default function ProductDetailPurchase({
    product,
    averageRating = 0,
    reviewCount = 0,
    ratingLoading = false,
}) {
    const [quantity, setQuantity] = useState(1);
    const navigate = useNavigate();
    const paths = useStorefrontPaths();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const inStock = isProductInStock(product);
    const storageLabel = formatStorageDuration(product.storage_duration_days);
    const unitLabel = formatUnitLabel(product.unit);
    const stockLabel = getStockLabel(product.status, product.in_stock);
    const supplierName = product.dealer_name || product.supplier_name;
    const stockValue =
        product.available_quantity != null
            ? `${product.available_quantity} ${product.unit || ""}`.trim()
            : null;

    const maxQuantity =
        product.available_quantity != null && Number(product.available_quantity) > 0
            ? Number(product.available_quantity)
            : null;

    const normalizeQuantity = (value) => {
        const parsed = Number.parseInt(String(value).replace(/\D/g, ""), 10);
        let next = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
        if (maxQuantity != null) next = Math.min(next, maxQuantity);
        return next;
    };

    const adjustQuantity = (delta) => {
        setQuantity((prev) => normalizeQuantity(normalizeQuantity(prev) + delta));
    };

    const handleQuantityChange = (event) => {
        const raw = event.target.value;
        if (raw === "") {
            setQuantity("");
            return;
        }

        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) return;

        if (maxQuantity != null) {
            setQuantity(Math.min(parsed, maxQuantity));
            return;
        }

        setQuantity(Math.max(1, parsed));
    };

    const handleQuantityBlur = () => {
        setQuantity((prev) => normalizeQuantity(prev));
    };

    const effectiveQuantity = normalizeQuantity(quantity);

    const handleBuyNow = () => {
        if (!inStock) return;

        const buyNowItem = buildCartItemFromProduct(product, effectiveQuantity);

        if (!isBuyerUser(user)) {
            showAddToCartFeedback({
                added: false,
                reason: "auth_required",
                showToast: true,
            });
            navigate(paths.login, {
                state: { from: paths.checkout, buyNow: buyNowItem },
            });
            return;
        }

        navigate(paths.checkout, { state: { buyNow: buyNowItem } });
    };

    const handleAddToCart = () => {
        if (!inStock) return;

        const result = addToCart(product, effectiveQuantity);
        showAddToCartFeedback(result);

        if (result.added) {
            navigate(paths.cart);
        }
    };

    const hasReviews = reviewCount > 0;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {product.category_name ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            <Leaf className="h-3 w-3" />
                            {product.category_name}
                        </span>
                    ) : null}
                    {product.verified_at ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                            <BadgeCheck className="h-3 w-3" />
                            Đã kiểm duyệt
                        </span>
                    ) : null}
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            inStock
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
                        {stockLabel}
                    </span>
                </div>

                <h1 className="text-3xl font-bold leading-tight text-emerald-950 lg:text-4xl">
                    {product.name}
                </h1>
            </div>

            {/* Price & rating */}
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white px-5 py-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                            Giá bán
                        </p>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-emerald-900">
                                {formatProductPrice(getProductPrice(product))}
                            </span>
                            {unitLabel ? (
                                <span className="text-base text-neutral-500">{unitLabel}</span>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex flex-col items-start gap-1 sm:items-end">
                        {ratingLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
                        ) : hasReviews ? (
                            <>
                                <StarRating value={averageRating} size="md" />
                                <span className="text-sm text-neutral-600">
                                    {Number(averageRating).toFixed(1)} · {reviewCount}{" "}
                                    đánh giá
                                </span>
                            </>
                        ) : (
                            <span className="text-sm text-neutral-500">
                                Chưa có đánh giá
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Key facts */}
            <div className="rounded-xl border border-stone-200 bg-white px-5 py-1">
                <MetaRow icon={Building2} label="Nhà cung cấp" value={supplierName} />
                <MetaRow icon={Clock3} label="Hạn bảo quản" value={storageLabel} />
                <MetaRow icon={Package} label="Tồn kho" value={stockValue} />
            </div>

            {product.description ? (
                <p className="line-clamp-3 text-sm leading-6 text-neutral-600">
                    {product.description}
                </p>
            ) : null}

            {/* Purchase */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-emerald-950">Đặt hàng</p>

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-neutral-600">Số lượng</span>
                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50">
                            <button
                                type="button"
                                onClick={() => adjustQuantity(-1)}
                                disabled={
                                    !inStock ||
                                    normalizeQuantity(quantity) <= 1
                                }
                                className="cursor-pointer rounded-l-xl p-2.5 text-emerald-900 transition-colors hover:bg-stone-100 disabled:opacity-40"
                                aria-label="Giảm số lượng"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <input
                                type="number"
                                min={1}
                                max={maxQuantity ?? undefined}
                                value={quantity}
                                onChange={handleQuantityChange}
                                onBlur={handleQuantityBlur}
                                disabled={!inStock}
                                inputMode="numeric"
                                aria-label="Số lượng sản phẩm"
                                className="min-w-14 max-w-20 border-x border-stone-200 bg-white px-2 py-2 text-center text-base font-medium text-zinc-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <button
                                type="button"
                                onClick={() => adjustQuantity(1)}
                                disabled={
                                    !inStock ||
                                    (maxQuantity != null &&
                                        normalizeQuantity(quantity) >= maxQuantity)
                                }
                                className="cursor-pointer rounded-r-xl p-2.5 text-emerald-900 transition-colors hover:bg-stone-100 disabled:opacity-40"
                                aria-label="Tăng số lượng"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleBuyNow}
                            disabled={!inStock}
                            className={`cursor-pointer flex flex-1 items-center justify-center gap-3 rounded-lg bg-orange-500 px-4 py-4 text-base text-white transition-colors ${
                                inStock
                                    ? "hover:bg-orange-600"
                                    : "cursor-not-allowed opacity-50"
                            }`}
                        >
                            <Zap className="h-4 w-4" />
                            MUA NGAY
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!inStock}
                        className={`cursor-pointer flex items-center justify-center gap-3 rounded-lg bg-emerald-950 px-4 py-4 text-base text-white transition-colors ${inStock ? "hover:bg-emerald-900" : "cursor-not-allowed opacity-50"
                            }`}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        THÊM VÀO GIỎ HÀNG
                    </button>
                </div>
            </div>
        </div>
    );
}
