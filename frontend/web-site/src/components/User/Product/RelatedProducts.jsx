import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import { toCardProduct } from "../../../utils/userProductUtils";
import SuggestProductCard from "../Home/SuggestProductCard";

export default function RelatedProducts({ products = [], categoryName = "" }) {
    const scrollRef = useRef(null);
    const paths = useStorefrontPaths();

    const items = useMemo(() => products.map(toCardProduct), [products]);

    const scroll = (dir) => {
        const container = scrollRef.current;
        if (container) {
            const scrollAmount = dir === "left" ? -400 : 400;
            container.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    if (!items.length) return null;

    return (
        <section className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-12 sm:px-10">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="font-playfair text-2xl font-bold text-emerald-950">
                    Sản phẩm liên quan
                </h2>
                <Link
                    to={paths.search()}
                    className="text-sm font-medium text-emerald-700 no-underline hover:underline"
                >
                    Xem tất cả →
                </Link>
            </div>

            <div className="group relative">
                <button
                    type="button"
                    onClick={() => scroll("left")}
                    aria-label="Cuộn trái"
                    className="absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-x-2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-zinc-600 opacity-0 shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50 group-hover:opacity-100 sm:-translate-x-5"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {items.map((product) => (
                        <SuggestProductCard key={product.id} {...product} />
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => scroll("right")}
                    aria-label="Cuộn phải"
                    className="absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 translate-x-2 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-zinc-600 opacity-0 shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50 group-hover:opacity-100 sm:translate-x-5"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            </div>

            {categoryName ? (
                <p className="mt-4 text-sm text-neutral-500">
                    Cùng danh mục: {categoryName}
                </p>
            ) : null}
        </section>
    );
}
