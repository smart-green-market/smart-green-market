import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import { toCardProduct } from "../../../utils/userProductUtils";
import DragScrollCarousel from "../Ui/DragScrollCarousel";
import SuggestProductCard from "../Home/SuggestProductCard";

export default function RelatedProducts({ products = [] }) {
    const paths = useStorefrontPaths();

    const items = useMemo(() => products.map(toCardProduct), [products]);

    if (!items.length) return null;

    return (
        <section className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-12 sm:px-10">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-emerald-950">
                    Sản phẩm liên quan
                </h2>
                <Link
                    to={paths.search()}
                    className="text-sm font-medium text-emerald-700 no-underline hover:underline"
                >
                    Xem tất cả →
                </Link>
            </div>

            <DragScrollCarousel navOffset="compact">
                {items.map((product) => (
                    <SuggestProductCard key={product.id} {...product} />
                ))}
            </DragScrollCarousel>
        </section>
    );
}
