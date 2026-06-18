import { useMemo, useState } from "react";
import { ImageOff } from "lucide-react";
import { getStockLabel } from "../../../utils/userProductUtils";

const VISIBLE_THUMBS = 3;

export default function ProductDetailGallery({ images = [], name = "", status, inStock }) {
    const sorted = useMemo(
        () =>
            [...images].sort((a, b) => {
                if (a.is_thumbnail && !b.is_thumbnail) return -1;
                if (!a.is_thumbnail && b.is_thumbnail) return 1;
                return (a.sort_order ?? 0) - (b.sort_order ?? 0);
            }),
        [images],
    );

    const [activeIndex, setActiveIndex] = useState(0);
    const activeImage = sorted[activeIndex]?.image_url;
    const extraCount = Math.max(0, sorted.length - VISIBLE_THUMBS);

    if (!sorted.length) {
        return (
            <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-xl bg-zinc-100 text-neutral-400">
                <ImageOff className="h-10 w-10" />
                <span className="text-sm">Chưa có hình ảnh</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-xl bg-zinc-100 shadow-sm">
                <img
                    src={activeImage}
                    alt={name}
                    className="aspect-[4/5] w-full object-cover lg:max-h-[560px]"
                />
                <div className="absolute left-4 top-3 rounded-full bg-teal-800 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white shadow-sm">
                    {getStockLabel(status, inStock)}
                </div>
            </div>

            {sorted.length > 1 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {sorted.slice(0, VISIBLE_THUMBS).map((img, index) => (
                        <button
                            key={img.id ?? index}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={`relative shrink-0 overflow-hidden rounded-lg bg-zinc-100 transition-all ${activeIndex === index
                                ? "outline outline-2 outline-offset-[-2px] outline-emerald-950"
                                : "outline outline-1 outline-offset-[-1px] outline-transparent hover:outline-stone-300"
                                }`}
                        >
                            <img
                                src={img.image_url}
                                alt=""
                                className="h-28 w-28 object-cover sm:h-36 sm:w-full sm:max-w-none sm:flex-1"
                            />
                        </button>
                    ))}

                    {extraCount > 0 ? (
                        <button
                            type="button"
                            onClick={() => setActiveIndex(VISIBLE_THUMBS)}
                            className="relative shrink-0 overflow-hidden rounded-lg bg-zinc-100"
                        >
                            <img
                                src={sorted[VISIBLE_THUMBS]?.image_url}
                                alt=""
                                className="h-28 w-28 object-cover blur-[2px] sm:h-36 sm:w-36"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/35 px-2 text-center text-sm font-medium text-white">
                                +{extraCount} ảnh khác
                            </div>
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
