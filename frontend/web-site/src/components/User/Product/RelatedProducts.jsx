import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import {
    formatProductPrice,
    formatUnitLabel,
    getProductPrice,
} from "../../../utils/userProductUtils";

function RelatedProductCard({ product }) {
    const paths = useStorefrontPaths();

    return (
        <Link
            to={paths.product(product.id)}
            className="group flex flex-col gap-4 no-underline"
        >
            <div className="relative overflow-hidden rounded-2xl bg-zinc-100 shadow-sm">
                <img
                    src={product.thumbnail || "https://placehold.co/282x282"}
                    alt={product.name}
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="absolute bottom-3 right-3 rounded-full bg-white/90 p-2 opacity-0 shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-100"
                    aria-label="Yêu thích"
                >
                    <Heart className="h-4 w-4 text-zinc-900" />
                </button>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wide text-teal-800">
                    {product.category_name || "Nông sản"}
                </span>
                <span className="line-clamp-2 text-base text-emerald-950">{product.name}</span>
                <span className="text-sm font-semibold text-teal-800">
                    {formatProductPrice(getProductPrice(product))}
                    {formatUnitLabel(product.unit)}
                </span>
            </div>
        </Link>
    );
}

export default function RelatedProducts({ products = [] }) {
    if (!products.length) return null;

    return (
        <section className="pt-12">
            <h2 className="mb-8 font-['Noto_Serif',serif] text-3xl font-semibold text-emerald-950">
                Sản phẩm liên quan
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                    <RelatedProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
}
