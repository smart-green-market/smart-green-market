/**
 * Generic ProductCard used across multiple sections.
 * Variant "suggest" → green "Thêm vào giỏ" button (FavProduct style)
 * Variant "bestsell" → dark add button + badge (BestSelling style)
 */
export default function ProductCard({
    name = "Sản phẩm",
    price = "0đ",
    unit = "/kg",
    image,
    badge,
    variant = "suggest",
    onAddToCart,
}) {
    return (
        <div className="relative bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col justify-start items-start overflow-hidden">
            <div className="relative flex flex-col justify-center items-start overflow-hidden w-full">
                <img
                    className="w-full h-52 object-cover"
                    src={image || "https://placehold.co/282x212"}
                    alt={name}
                />
            </div>

            <div className="self-stretch p-4 flex flex-col justify-between items-start gap-2">
                <span className="text-zinc-900 text-base font-normal font-['Inter'] leading-6">{name}</span>

                <div className="self-stretch inline-flex justify-between items-center">
                    <div className="flex items-baseline gap-1">
                        <span className="text-emerald-950 text-base font-bold font-['Inter'] leading-6">{price}</span>
                        <span className="text-neutral-700 text-sm font-normal font-['Inter'] leading-5">{unit}</span>
                    </div>
                    {variant === "bestsell" && (
                        <button
                            onClick={onAddToCart}
                            className="p-2 bg-emerald-950 rounded-lg inline-flex justify-center items-center hover:bg-emerald-800 transition-colors"
                        >
                            <div className="size-5 bg-white" />
                        </button>
                    )}
                </div>

                {variant === "suggest" && (
                    <button
                        onClick={onAddToCart}
                        className="self-stretch py-2 bg-green-200 rounded-lg flex justify-center items-center hover:bg-green-300 transition-colors"
                    >
                        <span className="text-center text-green-950 text-base font-normal font-['Inter'] leading-6">
                            Thêm vào giỏ
                        </span>
                    </button>
                )}
            </div>

            {badge && (
                <div className="px-3 py-1 left-4 top-4 absolute bg-orange-400 rounded-full">
                    <span className="text-white text-[10px] font-bold font-['Inter'] uppercase leading-4 tracking-wide">
                        {badge}
                    </span>
                </div>
            )}
        </div>
    );
}