import { ShoppingCart } from "lucide-react";

export default function BestSellingProductCard({ name = "Rau", price = "45.000đ", unit = "/kg", image }) {
    return (
        <div className="w-64 shrink-0 bg-white rounded-2xl shadow-sm border border-stone-100 flex flex-col overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-200 relative">
            {/* Badge */}
            <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 bg-orange-400 text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
                Bán chạy
            </span>

            <div className="overflow-hidden">
                <img
                    src={image || "./public/images/rau.jpg"}
                    alt={name}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                />
            </div>

            <div className="p-4 flex flex-col gap-2">
                <span className="text-zinc-800 text-sm font-medium line-clamp-2">{name}</span>
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                        <span className="text-emerald-800 text-base font-bold">{price}</span>
                        <span className="text-neutral-400 text-xs">{unit}</span>
                    </div>
                    <button className="w-9 h-9 bg-emerald-900 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-colors">
                        <ShoppingCart className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}