import { Link } from "react-router-dom";
import AddToCartButton from "../Cart/AddToCartButton";

export default function BestSellingProductCard({
    id,
    name = "Rau",
    price = "45.000đ",
    unit = "/kg",
    image,
    priceValue = 0,
    unitKey = "kg",
}) {
    const content = (
        <div className="mt-5 mb-5 relative flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <span className="absolute left-3 top-3 z-10 rounded-full bg-orange-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Bán chạy
            </span>

            <div className="overflow-hidden">
                <img
                    src={image || "https://placehold.co/282x212"}
                    alt={name}
                    className="h-60 w-full object-cover transition-transform duration-300 hover:scale-105"
                />
            </div>

            <div className="flex flex-col gap-2 p-4">
                <span className="line-clamp-2 text-sm font-medium text-zinc-800">{name}</span>
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-emerald-800">{price}</span>
                        <span className="text-xs text-neutral-400">{unit}</span>
                    </div>
                    <AddToCartButton
                        product={{ id, name, priceValue, unit: unitKey, image }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-900 text-white transition-colors hover:bg-emerald-700"
                    />
                </div>
            </div>
        </div>
    );

    if (id) {
        return (
            <Link to={`/san-pham/${id}`} className="no-underline">
                {content}
            </Link>
        );
    }

    return content;
}
