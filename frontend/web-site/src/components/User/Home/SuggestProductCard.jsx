import { Link } from "react-router-dom";
import AddToCartButton from "../Cart/AddToCartButton";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import ProductImage from "../Product/ProductImage";
import ProductCardMeta from "../Product/ProductCardMeta";
import ProductCardCategoryLabel from "../Product/ProductCardCategoryLabel";

export default function SuggestProductCard({
    id,
    name = "Rau",
    price = "45.000đ",
    unit = "/kg",
    image,
    priceValue = 0,
    unitKey = "kg",
    category_name = "",
    available_quantity = 0,
    in_stock = true,
}) {
    const paths = useStorefrontPaths();
    const content = (
        <div className="mt-5 mb-5 relative flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="overflow-hidden bg-zinc-50">
                <ProductImage
                    src={image}
                    alt={name}
                    className="h-60 w-full transition-transform duration-300 hover:scale-[1.03]"
                />
            </div>

            <div className="flex flex-col gap-2 p-4">
                <ProductCardCategoryLabel label={category_name} />
                <span className="line-clamp-2 text-sm font-medium text-zinc-800">{name}</span>
                <ProductCardMeta
                    availableQuantity={available_quantity}
                    unit={unit}
                    inStock={in_stock}
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-emerald-800">{price}</span>
                        <span className="text-xs text-neutral-400">{unit}</span>
                    </div>
                    <AddToCartButton
                        product={{ id, name, priceValue, unit: unitKey, image }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-900 text-white transition-colors hover:bg-emerald-700"
                    />
                </div>
            </div>
        </div>
    );

    if (id) {
        return (
            <Link to={paths.product(id)} className="no-underline">
                {content}
            </Link>
        );
    }

    return content;
}
