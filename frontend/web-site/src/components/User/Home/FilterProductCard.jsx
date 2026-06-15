import { Heart } from "lucide-react";

export default function FilterProductCard({
    brand = "GreenMarket",
    name = "Sản phẩm",
    price = "0đ",
    rating = 4.5,
    sold = 0,
    image,
}) {
    return (
        <article className="flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                <img
                    src={image || "./public/images/rau.jpg"}
                    alt={name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                    {brand}
                </p>
                <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-zinc-800">
                    {name}
                </h3>

                <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span>{rating} ★</span>
                    <span>Đã bán {sold}</span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="text-lg font-bold text-emerald-700">{price}</span>
                    <button
                        type="button"
                        className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label="Yêu thích"
                    >
                        <Heart className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </article>
    );
}
