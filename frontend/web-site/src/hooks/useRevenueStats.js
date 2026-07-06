import { useCallback, useEffect, useRef, useState } from 'react';
import revenueService from '../services/api/Supplier/revenueService';

/**
 * useRevenueStats
 * ─────────────────────────────────────────────────────────────
 * Fetch dữ liệu thống kê doanh thu theo period ('day' | 'month' | 'year').
 * Tự động refetch mỗi khi period đổi, tự hủy request cũ (tránh
 * race-condition khi user bấm đổi period liên tục).
 *
 * Trả về:
 *  - data      : dữ liệu trả về từ API (hoặc null khi chưa có)
 *  - loading   : trạng thái đang tải
 *  - error     : lỗi (nếu có)
 *  - refetch   : hàm gọi lại API thủ công
 */
export default function useRevenueStats(period) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    // Hủy request trước đó nếu còn đang chạy
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await revenueService.getRevenueStats(period, controller.signal);
      setData(res.data ?? res); // tùy interceptor của axiosClient trả res.data hay res
    } catch (err) {
      if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
