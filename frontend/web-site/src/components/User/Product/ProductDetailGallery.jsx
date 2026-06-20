import { useEffect, useMemo, useRef, useState } from "react";
import {
    getProductImageUrl,
    getStockLabel,
    PRODUCT_IMAGE_FALLBACK,
    resolveMediaUrl,
} from "../../../utils/userProductUtils";
import ProductImage from "./ProductImage";

const AUTO_PLAY_MS = 3000;

function normalizeGalleryImages(images = [], thumbnail = null) {
    const normalized = [...images]
        .map((img, index) => ({
            ...img,
            image_url:
                getProductImageUrl(img, null) ||
                resolveMediaUrl(thumbnail) ||
                null,
            sort_order: img.sort_order ?? index,
        }))
        .filter((img) => img.image_url);

    if (normalized.length) {
        return normalized.sort((a, b) => {
            if (a.is_thumbnail && !b.is_thumbnail) return -1;
            if (!a.is_thumbnail && b.is_thumbnail) return 1;
            return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        });
    }

    const fallbackUrl = resolveMediaUrl(thumbnail) || PRODUCT_IMAGE_FALLBACK;
    return [
        {
            id: "fallback",
            image_url: fallbackUrl,
            is_thumbnail: true,
            sort_order: 0,
        },
    ];
}

export default function ProductDetailGallery({
    images = [],
    thumbnail = null,
    name = "",
    status,
    inStock,
}) {
    const sorted = useMemo(
        () => normalizeGalleryImages(images, thumbnail),
        [images, thumbnail],
    );

    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef(null);

    const activeImage =
        sorted[activeIndex]?.image_url ||
        resolveMediaUrl(thumbnail) ||
        PRODUCT_IMAGE_FALLBACK;

    useEffect(() => {
        setActiveIndex(0);
    }, [sorted.length, thumbnail]);

    useEffect(() => {
        if (sorted.length <= 1 || isPaused) return undefined;

        intervalRef.current = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % sorted.length);
        }, AUTO_PLAY_MS);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [sorted.length, isPaused]);

    const handleSelect = (index) => {
        setActiveIndex(index);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), AUTO_PLAY_MS * 2);
    };

    return (
        <div
            className="flex flex-col gap-4"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="relative overflow-hidden rounded-xl bg-zinc-100 shadow-sm">
                <ProductImage
                    src={activeImage}
                    alt={name}
                    eager
                    className="aspect-[4/5] w-full lg:max-h-[560px]"
                />
                <div className="absolute left-4 top-3 rounded-full bg-teal-800 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white shadow-sm">
                    {getStockLabel(status, inStock)}
                </div>

                {sorted.length > 1 ? (
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                        {sorted.map((img, index) => (
                            <button
                                key={img.id ?? index}
                                type="button"
                                onClick={() => handleSelect(index)}
                                aria-label={`Ảnh ${index + 1}`}
                                className={`h-2 rounded-full transition-all ${
                                    activeIndex === index
                                        ? "w-6 bg-white"
                                        : "w-2 bg-white/50 hover:bg-white/80"
                                }`}
                            />
                        ))}
                    </div>
                ) : null}
            </div>

            {sorted.length > 1 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {sorted.map((img, index) => (
                        <button
                            key={img.id ?? index}
                            type="button"
                            onClick={() => handleSelect(index)}
                            className={`relative shrink-0 overflow-hidden rounded-lg bg-zinc-100 transition-all ${
                                activeIndex === index
                                    ? "outline outline-2 outline-offset-[-2px] outline-emerald-950"
                                    : "outline outline-1 outline-offset-[-1px] outline-transparent hover:outline-stone-300"
                            }`}
                        >
                            <ProductImage
                                src={img.image_url}
                                alt=""
                                className="h-28 w-28 sm:h-36 sm:w-36"
                            />
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
