import { useCallback, useEffect, useRef, useState } from "react";
import {
  ADMIN_LIST_PAGE_SIZE,
  getAdminPageRange,
} from "../utils/adminPaginationUtils";

export function useAdminPaginatedList({
  fetchList,
  mapRows = (rows) => rows,
  buildQuery = () => ({}),
  pageSize = ADMIN_LIST_PAGE_SIZE,
  queryDeps = [],
  onFetchError,
}) {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [countStatus, setCountStatus] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const hasLoadedRef = useRef(false);
  const prevQueryKeyRef = useRef(null);

  const fetchListRef = useRef(fetchList);
  const mapRowsRef = useRef(mapRows);
  const buildQueryRef = useRef(buildQuery);
  const onFetchErrorRef = useRef(onFetchError);

  fetchListRef.current = fetchList;
  mapRowsRef.current = mapRows;
  buildQueryRef.current = buildQuery;
  onFetchErrorRef.current = onFetchError;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageRange = getAdminPageRange(currentPage, pageSize, totalCount);
  const queryKey = JSON.stringify(queryDeps);

  const fetchData = useCallback(async ({ page = 1, initial = false } = {}) => {
    try {
      if (initial) {
        setIsFetching(true);
        setLoadError("");
      } else {
        setLoading(true);
      }
      setError("");

      const listData = await fetchListRef.current({
        page,
        ...buildQueryRef.current(),
      });

      setData(mapRowsRef.current(listData.results ?? []));
      setTotalCount(listData.count ?? 0);
      if (listData.countStatus != null) {
        setCountStatus(listData.countStatus);
      }
    } catch (err) {
      const message = onFetchErrorRef.current?.(err) ?? "Không thể tải dữ liệu";

      if (initial) {
        setLoadError(message);
      } else {
        setError(message);
      }
    } finally {
      if (initial) {
        setIsFetching(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setCountStatus(null);
  }, [queryKey]);

  useEffect(() => {
    const queryChanged =
      prevQueryKeyRef.current !== null && prevQueryKeyRef.current !== queryKey;
    prevQueryKeyRef.current = queryKey;

    const page = queryChanged ? 1 : currentPage;
    if (queryChanged && currentPage !== 1) {
      setCurrentPage(1);
    }

    fetchData({
      page,
      initial: !hasLoadedRef.current,
    });
    hasLoadedRef.current = true;
  }, [currentPage, queryKey, fetchData]);

  const refresh = useCallback(
    () => fetchData({ page: currentPage }),
    [currentPage, fetchData],
  );

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return {
    data,
    totalCount,
    countStatus,
    isFetching,
    loadError,
    loading,
    error,
    currentPage,
    totalPages,
    pageRange,
    pageSize,
    fetchData,
    refresh,
    handlePageChange,
    setCurrentPage,
  };
}
