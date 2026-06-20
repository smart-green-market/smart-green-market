import { useCallback, useEffect, useState } from "react";
import {
    addRecentlyViewed,
    getRecentlyViewed,
    RECENTLY_VIEWED_UPDATED_EVENT,
} from "../utils/recentlyViewedUtils";
import { useDealerSlug } from "./useStorefrontPaths";

export function useRecentlyViewed() {
    const slug = useDealerSlug();
    const [items, setItems] = useState([]);

    const refresh = useCallback(() => {
        setItems(getRecentlyViewed(slug));
    }, [slug]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        const handleUpdate = () => refresh();

        window.addEventListener(RECENTLY_VIEWED_UPDATED_EVENT, handleUpdate);
        window.addEventListener("storage", handleUpdate);

        return () => {
            window.removeEventListener(RECENTLY_VIEWED_UPDATED_EVENT, handleUpdate);
            window.removeEventListener("storage", handleUpdate);
        };
    }, [refresh]);

    const trackView = useCallback(
        (product) => {
            if (!slug || !product?.id) return;
            addRecentlyViewed(slug, product);
            refresh();
        },
        [slug, refresh],
    );

    return {
        items,
        trackView,
        refresh,
    };
}
