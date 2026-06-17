import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { useCart } from "../../../contexts/cartProvider";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import { showAddToCartFeedback } from "../../../utils/cartAddFeedback";
import {
    formatProductPrice,
    formatStorageDuration,
    formatUnitLabel,
    getProductPrice,
    isProductInStock,
} from "../../../utils/userProductUtils";
import StarRating from "./StarRating";

export default function ProductDetailPurchase({
    product,
    rating = 4.8,
    reviewCount = 124,
}) {
    const [quantity, setQuantity] = useState(1);
    const navigate = useNavigate();
    const paths = useStorefrontPaths();
    const { addToCart } = useCart();
    const inStock = isProductInStock(product);
    const storageLabel = formatStorageDuration(product.storage_duration_days);
    const unitLabel = formatUnitLabel(product.unit);

    const adjustQuantity = (delta) => {
        setQuantity((prev) => Math.max(1, prev + delta));
    };

    const weightHint =
        product.unit === "kg"
            ? `Khoảng ${quantity * 2}-${quantity * 3} kg`
            : `Số lượng: ${quantity} ${product.unit || "đơn vị"}`;

    const handleAddToCart = () => {
        if (!inStock) return;

        const result = addToCart(product, quantity);
        showAddToCartFeedback(result);

        if (result.added) {
            navigate(paths.cart);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
                {product.verified_at ? (
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-800">
                            Đã kiểm duyệt
                        </span>
                        {product.category_name ? (
                            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                                {product.category_name}
                            </span>
                        ) : null}
                    </div>
                ) : null}

                <h1 className="font-['Noto_Serif',serif] text-4xl font-bold leading-tight text-emerald-950 lg:text-5xl">
                    {product.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4">
                    <span className="font-['Noto_Serif',serif] text-2xl font-semibold text-teal-800">
                        {formatProductPrice(getProductPrice(product))}
                    </span>
                    {unitLabel ? (
                        <span className="font-['Noto_Serif',serif] text-sm text-neutral-700">
                            {unitLabel}
                        </span>
                    ) : null}
                    <div className="flex items-center gap-2">
                        <StarRating value={rating} />
                        <span className="text-xs font-medium text-neutral-700">
                            ({reviewCount} đánh giá)
                        </span>
                    </div>
                </div>

                {(product.dealer_name || product.supplier_name) ? (
                    <div className="flex flex-wrap items-center gap-3 text-lg text-neutral-400 sm:text-2xl">
                        <span className="font-['Noto_Serif',serif] font-semibold">
                            Đơn vị cung cấp:
                        </span>
                        <span className="font-['Noto_Serif',serif] font-semibold text-neutral-500">
                            {product.dealer_name || product.supplier_name}
                        </span>
                    </div>
                ) : null}

                {storageLabel ? (
                    <div className="flex flex-wrap items-center gap-3 text-lg text-gray-600 sm:text-2xl">
                        <span className="font-['Noto_Serif',serif] font-semibold">
                            Hạn sử dụng:
                        </span>
                        <span className="font-['Noto_Serif',serif] font-semibold">
                            {storageLabel}
                        </span>
                    </div>
                ) : null}

                {product.description ? (
                    <p className="line-clamp-4 text-lg leading-7 text-neutral-700">
                        {product.description}
                    </p>
                ) : null}
            </div>

            <div className="rounded-xl border border-stone-300 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <span className="text-base text-emerald-950">Chọn số lượng</span>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="inline-flex items-center rounded-lg border border-stone-300 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={() => adjustQuantity(-1)}
                                    disabled={!inStock || quantity <= 1}
                                    className="p-3 text-emerald-950 disabled:opacity-40"
                                    aria-label="Giảm số lượng"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="min-w-12 px-3 py-2 text-center text-base text-zinc-900">
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => adjustQuantity(1)}
                                    disabled={!inStock}
                                    className="p-3 text-emerald-950 disabled:opacity-40"
                                    aria-label="Tăng số lượng"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <span className="text-sm text-neutral-700">{weightHint}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/dat-hang"
                            className={`flex flex-1 items-center justify-center gap-3 rounded-lg bg-orange-500 px-4 py-4 text-base text-white no-underline transition-colors ${
                                inStock ? "hover:bg-orange-600" : "pointer-events-none opacity-50"
                            }`}
                        >
                            <Zap className="h-4 w-4" />
                            MUA NGAY
                        </Link>
                        <button
                            type="button"
                            disabled={!inStock}
                            className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-stone-300 bg-gray-50 text-emerald-950 transition-colors hover:bg-stone-100 disabled:opacity-50"
                            aria-label="Yêu thích"
                        >
                            <Heart className="h-5 w-5" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!inStock}
                        className={`flex items-center justify-center gap-3 rounded-lg bg-emerald-950 px-4 py-4 text-base text-white transition-colors ${
                            inStock ? "hover:bg-emerald-900" : "cursor-not-allowed opacity-50"
                        }`}
                    >
                        <ShoppingCart className="h-5 w-5" />
                        THÊM VÀO GIỎ HÀNG
                    </button>
                </div>
            </div>
        </div>
    );
}
