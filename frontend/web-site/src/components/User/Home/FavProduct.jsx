import { useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useDealerProducts } from "../../../hooks/useDealerProducts";
import { toCardProduct } from "../../../utils/userProductUtils";
import FavProductCard from "./FavProductCard";

export default function FavProduct() {
    const scrollRef = useRef(null);
    const { products, loading } = useDealerProducts();
    const items = products.slice(0, 10).map(toCardProduct);

    const scroll = (dir) => {
        const container = scrollRef.current;
        if (container) {
            const scrollAmount = dir === "left" ? -400 : 400;
            container.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    return (
        <section className="mx-auto w-full max-w-[1280px] px-10 pt-10">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="font-playfair text-2xl font-bold text-emerald-950">
                    Sản phẩm được yêu thích
                </h2>
                <a href="#" className="text-sm font-medium text-emerald-700 hover:underline">
                    Xem tất cả →
                </a>
            </div>

            {loading ? (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
                </div>
            ) : (
                <div className="group relative">
                    <button
                        type="button"
                        onClick={() => scroll("left")}
                        className="absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-x-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-zinc-600 opacity-0 shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50 group-hover:opacity-100"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    <div
                        ref={scrollRef}
                        className="flex gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {items.map((product) => (
                            <FavProductCard key={product.id} {...product} />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => scroll("right")}
                        className="absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 translate-x-5 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-zinc-600 opacity-0 shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50 group-hover:opacity-100"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>
            )}
        </section>
    );
}
