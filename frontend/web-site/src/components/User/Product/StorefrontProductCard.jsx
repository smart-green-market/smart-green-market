import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import AddToCartButton from "../Cart/AddToCartButton";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import ProductImage from "./ProductImage";
import ProductCardMeta from "./ProductCardMeta";

export default function StorefrontProductCard({
    id,
    name = "Sản phẩm",
    price = "0đ",
    unit = "",
    unitKey = "kg",
    priceValue = 0,
    image,
    availableQuantity = 0,
    inStock = true,
    rating,
    badge,
    showAddToCart = false,
    layout = "grid",
    className = "",
}) {
    const paths = useStorefrontPaths();

    const card = (
        <article
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-stone-100/90 bg-white shadow-[0_1px_3px_rgba(6,78,59,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_12px_40px_rgba(6,78,59,0.1)] ${
                layout === "carousel" ? "w-[260px] shrink-0" : "h-full w-full"
            } ${className}`}
        >
            <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-stone-50 p-4">
                <ProductImage
                    src={image}
                    alt={name}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
                />

                {badge ? (
                    <span className="absolute left-3 top-3 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
                        {badge}
                    </span>
                ) : null}

                {!inStock ? (
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/25 to-transparent p-3">
                        <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-stone-600 shadow-sm">
                            Tạm hết hàng
                        </span>
                    </div>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                <h3 className="line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-snug text-emerald-950">
                    {name}
                </h3>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <ProductCardMeta
                        availableQuantity={availableQuantity}
                        unit={unit}
                        inStock={inStock}
                    />
                    {rating != null && Number(rating) > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-600">
                            <Star className="h-3 w-3 fill-current" />
                            {Number(rating).toFixed(1)}
                        </span>
                    ) : null}
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-stone-100 pt-3">
                    <div className="min-w-0">
                        <p className="text-lg font-bold tracking-tight text-emerald-700">
                            {price}
                        </p>
                        {unit ? (
                            <p className="text-[11px] font-medium text-stone-400">
                                {unit}
                            </p>
                        ) : null}
                    </div>

                    {showAddToCart ? (
                        <AddToCartButton
                            product={{
                                id,
                                name,
                                priceValue,
                                unit: unitKey,
                                image,
                            }}
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white shadow-md transition-all hover:bg-emerald-800 hover:shadow-lg active:scale-95 ${
                                inStock ? "" : "pointer-events-none opacity-40"
                            }`}
                            iconClassName="h-4 w-4"
                        />
                    ) : null}
                </div>
            </div>
        </article>
    );

    if (id) {
        return (
            <Link to={paths.product(id)} className="block h-full no-underline">
                {card}
            </Link>
        );
    }

    return card;
}
