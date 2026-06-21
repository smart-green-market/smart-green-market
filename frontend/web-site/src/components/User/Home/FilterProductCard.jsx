import { Link } from "react-router-dom";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import ProductImage from "../Product/ProductImage";
import ProductCardMeta from "../Product/ProductCardMeta";
import ProductCardCategoryLabel from "../Product/ProductCardCategoryLabel";

export default function FilterProductCard({
    id,
    brand = "GreenMarket",
    categoryName = "",
    name = "Sản phẩm",
    price = "0đ",
    rating = 4.5,
    availableQuantity = 0,
    unit = "",
    inStock = true,
    image,
}) {
    const paths = useStorefrontPaths();
    const categoryLabel = categoryName || brand;

    const content = (
        <article className="flex h-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                <ProductImage
                    src={image}
                    alt={name}
                    className="h-full w-full transition-transform duration-300 hover:scale-[1.03]"
                />
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
                <ProductCardCategoryLabel label={categoryLabel} />
                <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-zinc-800">
                    {name}
                </h3>

                <ProductCardMeta
                    availableQuantity={availableQuantity}
                    unit={unit}
                    inStock={inStock}
                />

                <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span>{rating} ★</span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="text-lg font-bold text-emerald-700">{price}</span>
                </div>
            </div>
        </article>
    );

    if (id) {
        return (
            <Link to={paths.product(id)} className="block h-full no-underline">
                {content}
            </Link>
        );
    }

    return content;
}
