import { useState } from "react";
import { ImageOff } from "lucide-react";

export default function ProductImageGallery({ images = [], alt = "" }) {
    const sorted = [...images].sort(
        (a, b) => (b.is_thumbnail ? 1 : 0) - (a.is_thumbnail ? 1 : 0),
    );

    const [active, setActive] = useState(sorted[0]?.image_url ?? null);

    if (!images.length) {
        return (
            <div className="w-full aspect-square rounded-xl border border-dashed border-neutral-200 bg-stone-50 flex flex-col items-center justify-center gap-2 text-neutral-400">
                <ImageOff className="w-8 h-8" />
                <span className="text-xs font-medium">Chưa có hình ảnh</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Ảnh chính */}
            <div className="w-full aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-stone-50">
                <img
                    src={active}
                    alt={alt}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {sorted.map((img) => (
                        <button
                            key={img.id}
                            type="button"
                            onClick={() => setActive(img.image_url)}
                            className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                                active === img.image_url
                                    ? "border-emerald-600"
                                    : "border-transparent hover:border-neutral-300"
                            }`}
                        >
                            <img
                                src={img.image_url}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
