import { useCallback, useEffect, useState } from "react";
import { PRODUCT_IMAGE_FALLBACK } from "../../../utils/userProductUtils";

const UPSCALE_THRESHOLD = 1.08;

export default function ProductImage({
    src,
    alt = "",
    className = "",
    eager = false,
    fallback = PRODUCT_IMAGE_FALLBACK,
}) {
    const resolvedSrc = src || fallback;
    const [currentSrc, setCurrentSrc] = useState(resolvedSrc);
    const [objectFit, setObjectFit] = useState("cover");

    useEffect(() => {
        setCurrentSrc(resolvedSrc);
        setObjectFit("cover");
    }, [resolvedSrc]);

    const handleLoad = useCallback((event) => {
        const img = event.currentTarget;
        const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;

        if (!naturalWidth || !naturalHeight || !clientWidth || !clientHeight) return;

        const scaleX = clientWidth / naturalWidth;
        const scaleY = clientHeight / naturalHeight;
        const upscale = Math.max(scaleX, scaleY);

        setObjectFit(upscale > UPSCALE_THRESHOLD ? "contain" : "cover");
    }, []);

    const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";

    return (
        <img
            src={currentSrc || fallback}
            alt={alt}
            className={`product-img ${fitClass} ${className}`}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={eager ? "high" : "auto"}
            onLoad={handleLoad}
            onError={() => {
                setCurrentSrc(fallback);
                setObjectFit("cover");
            }}
        />
    );
}
