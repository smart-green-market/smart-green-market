import { useMemo } from "react";
import {
  buildCountsFromCards,
  buildCountsFromStatusMap,
  hasAdminCountStatus,
} from "../utils/adminFilterStatsUtils";

export function useAdminFilterStats({
  countStatus,
  data,
  cards,
  field = "status",
}) {
  return useMemo(() => {
    if (hasAdminCountStatus(countStatus)) {
      return buildCountsFromStatusMap(countStatus, cards);
    }
    return buildCountsFromCards(data, cards, { field });
  }, [countStatus, data, cards, field]);
}

export function useAdminStatsLoading(isFetching, countStatus) {
  return isFetching && !hasAdminCountStatus(countStatus);
}
