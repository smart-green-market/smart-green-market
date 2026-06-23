import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addRecentlyViewed,
  getRecentlyViewed,
  mergeRecentlyViewedWithCatalog,
  RECENTLY_VIEWED_UPDATED_EVENT,
} from "../utils/recentlyViewedUtils";
import { useBuyerCatalog } from "./useBuyerCatalog";
import { useDealerSlug } from "./useStorefrontPaths";

export function useRecentlyViewed() {
  const slug = useDealerSlug();
  const { products } = useBuyerCatalog();
  const [storedItems, setStoredItems] = useState([]);

  const refresh = useCallback(() => {
    setStoredItems(getRecentlyViewed(slug));
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

  const items = useMemo(
    () => mergeRecentlyViewedWithCatalog(storedItems, products),
    [storedItems, products],
  );

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
