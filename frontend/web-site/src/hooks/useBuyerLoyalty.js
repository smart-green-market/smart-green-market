import { useCallback, useEffect, useState } from "react";
import { useDealerSlug } from "./useStorefrontPaths";
import {
  buyerLoyaltyService,
  handleLoyaltyApiError,
  normalizeLoyaltyTiers,
} from "../services/api/Buyer/buyerLoyaltyService";

export function useBuyerLoyalty() {
  const dealerSlug = useDealerSlug();
  const [score, setScore] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [scoreLoading, setScoreLoading] = useState(true);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [tiersError, setTiersError] = useState("");

  const loadScore = useCallback(async () => {
    if (!dealerSlug) {
      setScore(null);
      setScoreError("Chưa xác định cửa hàng.");
      setScoreLoading(false);
      return;
    }

    setScoreLoading(true);
    setScoreError("");
    try {
      setScore(await buyerLoyaltyService.getMyScore(dealerSlug));
    } catch (error) {
      setScoreError(
        handleLoyaltyApiError(error, "Không thể tải điểm thành viên."),
      );
    } finally {
      setScoreLoading(false);
    }
  }, [dealerSlug]);

  const loadTiers = useCallback(
    async ({ force = false } = {}) => {
      if (!dealerSlug || (tiers.length > 0 && !force)) return;

      setTiersLoading(true);
      setTiersError("");
      try {
        const data = await buyerLoyaltyService.getTier(dealerSlug);
        setTiers(normalizeLoyaltyTiers(data));
      } catch (error) {
        setTiersError(
          handleLoyaltyApiError(
            error,
            "Không thể tải danh sách hạng thành viên.",
          ),
        );
      } finally {
        setTiersLoading(false);
      }
    },
    [dealerSlug, tiers.length],
  );

  useEffect(() => {
    // Đồng bộ dữ liệu từ API khi storefront thay đổi.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadScore();
  }, [loadScore]);

  return {
    score,
    tiers,
    scoreLoading,
    tiersLoading,
    scoreError,
    tiersError,
    loadScore,
    loadTiers,
  };
}
