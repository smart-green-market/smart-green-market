import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useBuyerCatalog } from "../../../hooks/useBuyerCatalog";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import { toCardProduct } from "../../../utils/userProductUtils";
import DragScrollCarousel from "../Ui/DragScrollCarousel";
import FavProductCard from "./FavProductCard";

export default function FavProduct() {
    const paths = useStorefrontPaths();
    const { products, loading } = useBuyerCatalog();

    const items = useMemo(
        () =>
            [...products]
                .filter((item) => item.in_stock)
                .slice(0, 10)
                .map(toCardProduct),
        [products],
    );

    return (
        <section className="mx-auto w-full max-w-[1280px] px-10 pt-10">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-emerald-950">
                    Sản phẩm còn hàng
                </h2>
                <Link
                    to={paths.search()}
                    className="text-sm font-medium text-emerald-700 no-underline hover:underline"
                >
                    Xem tất cả →
                </Link>
            </div>

            {loading ? (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
                </div>
            ) : items.length === 0 ? (
                <p className="text-sm text-neutral-500">Chưa có sản phẩm còn hàng.</p>
            ) : (
                <DragScrollCarousel>
                    {items.map((product) => (
                        <FavProductCard key={product.id} {...product} />
                    ))}
                </DragScrollCarousel>
            )}
        </section>
    );
}
