import { useRef } from "react";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { useRecentlyViewed } from "../../../hooks/useRecentlyViewed";
import SuggestProductCard from "./SuggestProductCard";

export default function RecentlyViewedProducts() {
    const scrollRef = useRef(null);
    const { items } = useRecentlyViewed();

    if (!items.length) {
        return null;
    }

    const scroll = (dir) => {
        const container = scrollRef.current;
        if (!container) return;

        container.scrollBy({
            left: dir === "left" ? -400 : 400,
            behavior: "smooth",
        });
    };

    return (
        <section className="mx-auto w-full max-w-[1280px] px-10 pt-10">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="h-6 w-6 text-emerald-800" />
                    <h2 className="font-playfair text-2xl font-bold text-emerald-950">
                        Xem gần đây
                    </h2>
                </div>
            </div>

            <div className="group relative">
                {items.length > 3 ? (
                    <>
                        <button
                            type="button"
                            onClick={() => scroll("left")}
                            className="absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-x-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-zinc-600 opacity-0 shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50 group-hover:opacity-100"
                            aria-label="Cuộn trái"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>

                        <button
                            type="button"
                            onClick={() => scroll("right")}
                            className="absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 translate-x-5 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-zinc-600 opacity-0 shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50 group-hover:opacity-100"
                            aria-label="Cuộn phải"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </>
                ) : null}

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {items.map((product) => (
                        <SuggestProductCard key={product.id} {...product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
