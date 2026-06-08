import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SuggestProductCard from "./SuggestProductCard";

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

export default function SuggestProduct() {
    const scrollRef = useRef(null);

    const scroll = (dir) => {
        const container = scrollRef.current;
        if (container) {
            const scrollAmount = dir === "left" ? -400 : 400;
            container.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };
    return (
        <section className="w-full max-w-[1280px] mx-auto px-10 pt-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-emerald-950 text-2xl font-bold font-playfair">Gợi Ý Hôm Nay</h2>
                <a href="#" className="text-emerald-700 text-sm font-medium hover:underline">
                    Xem tất cả →
                </a>
            </div>

            {/* Carousel với 2 nút ở 2 đầu */}
            <div className="relative group">
                {/* Nút Chevron Left - bên trái */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-stone-200 hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center text-zinc-600 transition-all opacity-0 group-hover:opacity-100"
                    style={{ left: '-20px' }}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Khu vực scroll */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {PRODUCTS.map((p) => (
                        <SuggestProductCard key={p.id} name={p.name} price={p.price} unit={p.unit} />
                    ))}
                </div>

                {/* Nút Chevron Right - bên phải */}
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-stone-200 hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center text-zinc-600 transition-all opacity-0 group-hover:opacity-100"
                    style={{ right: '-20px' }}
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </section>
    );
}