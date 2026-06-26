import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useBestSellerProducts } from "../../../hooks/useBuyerCatalog";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import DragScrollCarousel from "../Ui/DragScrollCarousel";
import BestSellingProductCard from "./BestSellingProductCard";

export default function BestSellingProduct() {
    const paths = useStorefrontPaths();
    const { products, loading, error } = useBestSellerProducts();

    return (
        <section className="mx-auto w-full max-w-[1280px] px-10 pt-10">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-emerald-950">
                    Bán Chạy Nhất
                </h2>
                <Link
                    to={paths.products}
                    className="text-sm font-medium text-emerald-700 no-underline hover:underline"
                >
                    Xem tất cả →
                </Link>
            </div>

            {loading ? (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
                </div>
            ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
            ) : products.length === 0 ? (
                <p className="text-sm text-neutral-500">
                    Chưa có sản phẩm bán chạy.
                </p>
            ) : (
                <DragScrollCarousel
                    scrollAmount={220}
                    navOffset="compact"
                    trackClassName="gap-3"
                >
                    {products.map((product) => (
                        <BestSellingProductCard key={product.id} {...product} />
                    ))}
                </DragScrollCarousel>
            )}
        </section>
    );
}
