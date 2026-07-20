import { useEffect, useState } from "react";
import {
  buyerOrder,
  parseBuyerOrderList,
} from "../services/api/Buyer/buyerOrder";
import { useDealerSlug } from "./useStorefrontPaths";

// Module-level cache theo slug để tránh gọi API nhiều lần khi mount profile
const cache = {};

/**
 * Hook đếm số đơn hàng có status === "completed" của buyer trong cửa hàng hiện tại.
 * Dùng cùng API endpoint + parse logic với OrderHistoryPage để đảm bảo số liệu nhất quán.
 */
export function useBuyerCompletedOrderCount() {
  const slug = useDealerSlug();
  const [count, setCount] = useState(cache[slug] ?? null);
  const [loading, setLoading] = useState(cache[slug] == null);

  useEffect(() => {
    if (!slug) {
      setCount(0);
      setLoading(false);
      return;
    }

    // Nếu đã cache cho slug này thì dùng luôn
    if (cache[slug] != null) {
      setCount(cache[slug]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    buyerOrder
      .getAll(slug)
      .then((data) => {
        if (cancelled) return;
        const orders = parseBuyerOrderList(data);
        const completed = orders.filter((o) => o.status === "completed").length;
        cache[slug] = completed;
        setCount(completed);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { count, loading };
}
