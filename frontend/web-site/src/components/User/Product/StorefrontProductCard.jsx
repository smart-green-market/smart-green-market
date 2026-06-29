import { Link, useNavigate } from "react-router-dom";
import AddToCartButton from "../Cart/AddToCartButton";
import { useAuth } from "../../../contexts/authProvider";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import { isBuyerUser } from "../../../utils/buyerAuthUtils";
import { buildCartItemFromProduct } from "../../../utils/cartUtils";
import { showAddToCartFeedback } from "../../../utils/cartAddFeedback";
import ProductImage from "./ProductImage";
import ProductDiscountRibbon from "./ProductDiscountRibbon";
import { formatAvailableQuantityLabel } from "../../../utils/userProductUtils";

export default function StorefrontProductCard({
    id,
    name = "Sản phẩm",
    price = "0đ",
    originalPrice = null,
    unit = "",
    unitKey = "kg",
    priceValue = 0,
    discountPercent = 0,
    hasDiscount = false,
    image,
    availableQuantity = 0,
    inStock = true,
    badge,
    showAddToCart = true,
    layout = "grid",
    className = "",
}) {
    const navigate = useNavigate();
    const paths = useStorefrontPaths();
    const { user } = useAuth();
    const productPath = id ? paths.product(id) : null;
    const isCarousel = layout === "carousel";

    const stockLabel = formatAvailableQuantityLabel(
        availableQuantity,
        unit,
        inStock,
    );

    const unitSuffix = unit
        ? unit.startsWith("/")
            ? unit
            : `/${unit}`
        : "";

    const cartProduct = {
        id,
        name,
        priceValue,
        unitKey,
        unit: unitKey,
        image,
        availableQuantity,
        available_quantity: availableQuantity,
    };

    const handleBuyNow = () => {
        if (!inStock) return;

        const buyNowItem = buildCartItemFromProduct(cartProduct, 1);

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

    const imageBlock = (
        <div
            className={`relative overflow-hidden bg-stone-100 ${
                isCarousel
                    ? "aspect-square rounded-t-xl"
                    : "aspect-[4/5] rounded-t-2xl"
            }`}
        >
            <ProductImage
                src={image}
                alt={name}
                alwaysCover
                className="h-full w-full transition-transform duration-500 group-hover/card:scale-[1.04]"
            />

            <ProductDiscountRibbon percent={discountPercent} />

            {badge ? (
                <span
                    className={`absolute rounded-full bg-amber-500/95 font-semibold uppercase tracking-wider text-white shadow-sm ${
                        isCarousel
                            ? "right-2 top-2 px-2 py-0.5 text-[9px]"
                            : "right-3 top-3 px-2.5 py-1 text-[10px]"
                    }`}
                >
                    {badge}
                </span>
            ) : null}

            {!inStock ? (
                <span
                    className={`absolute rounded-full bg-white/95 font-semibold text-red-700 shadow-sm ${
                        isCarousel
                            ? "bottom-2 left-2 px-2 py-0.5 text-[10px]"
                            : "bottom-3 left-3 px-2.5 py-1 text-[11px]"
                    }`}
                >
                    Hết hàng
                </span>
            ) : (
                <span
                    className={`absolute rounded-full bg-white/95 font-semibold text-emerald-700 shadow-sm ${
                        isCarousel
                            ? "bottom-2 left-2 px-2 py-0.5 text-[10px]"
                            : "bottom-3 left-3 px-2.5 py-1 text-[11px]"
                    }`}
                >
                    {stockLabel}
                </span>
            )}
        </div>
    );

    const titleClass = isCarousel
        ? "line-clamp-2 px-3 pt-2 text-[13px] font-semibold leading-snug text-emerald-950"
        : "line-clamp-2 px-4 pt-3 text-[15px] font-semibold leading-snug text-emerald-950";

    return (
        <article
            className={`group/card relative flex flex-col overflow-hidden border border-stone-100/90 bg-white shadow-[0_1px_3px_rgba(6,78,59,0.04)] transition-all duration-300 hover:border-emerald-100 ${
                isCarousel
                    ? "w-[188px] shrink-0 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(6,78,59,0.08)] sm:w-[200px]"
                    : "h-full w-full rounded-2xl hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(6,78,59,0.1)]"
            } ${className}`}
        >
            {productPath ? (
                <Link
                    to={productPath}
                    className="block no-underline"
                    draggable={false}
                >
                    {imageBlock}
                    <h3 className={titleClass}>{name}</h3>
                </Link>
            ) : (
                <>
                    {imageBlock}
                    <h3 className={titleClass}>{name}</h3>
                </>
            )}

            <div
                className={`flex flex-1 flex-col ${
                    isCarousel ? "mt-1 px-3 pb-3" : "mt-2 px-4 pb-4"
                }`}
            >
                <div className={`flex items-center justify-between ${isCarousel ? "gap-1.5" : "gap-2"}`}>
                <div className={`flex min-w-0 flex-col ${isCarousel ? "gap-0" : "gap-0.5"}`}>
                    {hasDiscount && originalPrice ? (
                        <span
                            className={`font-medium text-stone-400 line-through ${
                                isCarousel ? "text-[11px]" : "text-xs"
                            }`}
                        >
                            {originalPrice}
                            {unitSuffix ? (
                                <span className="text-stone-300">{unitSuffix}</span>
                            ) : null}
                        </span>
                    ) : null}
                    <p
                        className={`min-w-0 font-bold tracking-tight ${
                            hasDiscount ? "text-red-600" : "text-emerald-700"
                        } ${isCarousel ? "text-sm" : "text-lg"}`}
                    >
                        {price}
                        {unitSuffix ? (
                            <span
                                className={`ml-0.5 font-medium text-stone-400 ${
                                    isCarousel ? "text-xs" : "text-sm"
                                }`}
                            >
                                {unitSuffix}
                            </span>
                        ) : null}
                    </p>
                </div>

                    {showAddToCart ? (
                        <AddToCartButton
                            product={cartProduct}
                            className={`flex shrink-0 items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100 active:scale-95 ${
                                isCarousel
                                    ? "h-7 w-7 rounded-md"
                                    : "h-9 w-9 rounded-lg"
                            } ${inStock ? "" : "pointer-events-none opacity-40"}`}
                            iconClassName={isCarousel ? "h-3.5 w-3.5" : "h-4 w-4"}
                        />
                    ) : null}
                </div>

                <div className={`border-t border-stone-100 ${isCarousel ? "my-2" : "my-3"}`} />

                <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={!inStock}
                    className={`w-full cursor-pointer border-2 border-emerald-700 font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 disabled:pointer-events-none disabled:opacity-40 ${
                        isCarousel
                            ? "rounded-lg py-1.5 text-xs"
                            : "rounded-xl py-2.5 text-sm"
                    }`}
                >
                    Mua ngay
                </button>
            </div>
        </article>
    );
}
