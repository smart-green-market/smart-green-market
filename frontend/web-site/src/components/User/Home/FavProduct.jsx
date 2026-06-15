import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FavProductCard from "./FavProductCard";

const PRODUCTS = [
    { id: 1, name: "Rau muống sạch", price: "15.000đ", unit: "/bó" },
    { id: 2, name: "Cải xanh hữu cơ", price: "20.000đ", unit: "/bó" },
    { id: 3, name: "Xà lách lô lô", price: "25.000đ", unit: "/kg" },
    { id: 4, name: "Cà chua bi đà lạt", price: "35.000đ", unit: "/kg" },
    { id: 5, name: "Bắp cải trắng", price: "18.000đ", unit: "/kg" },
    { id: 6, name: "Súp lơ xanh", price: "30.000đ", unit: "/cây" },
    { id: 7, name: "Xà lách lô lô", price: "25.000đ", unit: "/kg" },
    { id: 8, name: "Cà chua bi đà lạt", price: "35.000đ", unit: "/kg" },
    { id: 9, name: "Bắp cải trắng", price: "18.000đ", unit: "/kg" },
    { id: 10, name: "Súp lơ xanh", price: "30.000đ", unit: "/cây" },
];

export default function FavProduct() {
    const scrollRef = useRef(null);

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
                <a
                    href="#"
                    className="text-sm font-medium text-emerald-700 hover:underline"
                >
                    Xem tất cả →
                </a>
            </div>

            <div className="group relative">
                <button
                    type="button"
                    onClick={() => scroll("left")}
                    className="cursor-pointerabsolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-x-5 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-zinc-600 opacity-0 shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50 group-hover:opacity-100"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {PRODUCTS.map((product) => (
                        <FavProductCard
                            key={product.id}
                            name={product.name}
                            price={product.price}
                            unit={product.unit}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => scroll("right")}
                    className="cursor-pointer absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 translate-x-5 items-center justify-center rounded-full border border-stone-200 bg-white text-zinc-600 opacity-0 shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50 group-hover:opacity-100"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            </div>
        </section>
    );
}
