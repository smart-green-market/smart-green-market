import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/authProvider";
import {
  buyerOrder,
  parseBuyerOrderList,
} from "../services/api/Buyer/buyerOrder";
import { isBuyerUser } from "../utils/buyerAuthUtils";
import { getBuyerCartId } from "../utils/cartUtils";
import {
  detectOrderStatusUpdates,
  markOrderStatusesSeen,
  ORDER_STATUS_NOTIFICATION_EVENT,
} from "../utils/orderStatusNotificationUtils";
import { useDealerSlug } from "./useStorefrontPaths";

const POLL_INTERVAL_MS = 45_000;

export function useOrderStatusNotifications({ enabled = true } = {}) {
  const { user } = useAuth();
  const dealerSlug = useDealerSlug();
  const buyerId = getBuyerCartId(user);
  const isLoggedIn = isBuyerUser(user);
  const [updateCount, setUpdateCount] = useState(0);
  const isMountedRef = useRef(true);

  const refresh = useCallback(
    async ({ baseline = false } = {}) => {
      if (!enabled || !isLoggedIn || !dealerSlug) {
        if (isMountedRef.current) setUpdateCount(0);
        return [];
      }

      try {
        const data = await buyerOrder.getAll(dealerSlug);
        const orders = parseBuyerOrderList(data);

        if (baseline) {
          markOrderStatusesSeen(dealerSlug, buyerId, orders);
          if (isMountedRef.current) setUpdateCount(0);
          return orders;
        }

        const { updateCount: count } = detectOrderStatusUpdates(
          dealerSlug,
          buyerId,
          orders,
        );

        if (isMountedRef.current) setUpdateCount(count);
        return orders;
      } catch {
        return [];
      }
    },
    [enabled, isLoggedIn, dealerSlug, buyerId],
  );

  const markAsSeen = useCallback(
    async (orders) => {
      if (!dealerSlug) return;

      if (Array.isArray(orders)) {
        markOrderStatusesSeen(dealerSlug, buyerId, orders);
        setUpdateCount(0);
        return;
      }

      await refresh({ baseline: true });
    },
    [dealerSlug, buyerId, refresh],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !isLoggedIn || !dealerSlug) {
      setUpdateCount(0);
      return undefined;
    }

    refresh();

    const intervalId = window.setInterval(() => refresh(), POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    const handleNotificationEvent = () => {
      setUpdateCount(0);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener(
      ORDER_STATUS_NOTIFICATION_EVENT,
      handleNotificationEvent,
    );

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener(
        ORDER_STATUS_NOTIFICATION_EVENT,
        handleNotificationEvent,
      );
    };
  }, [enabled, isLoggedIn, dealerSlug, refresh]);

  return {
    updateCount,
    hasUpdates: updateCount > 0,
    refresh,
    markAsSeen,
  };
}
