import { useCallback, useEffect, useState } from 'react';
import orderStatsService from '../services/api/Supplier/orderStatsService';
import { FALLBACK_ORDER_STATS } from '../components/Supplier/OrderStats/orderStatsConstants';

/**
 * Hook fetch dữ liệu thống kê đơn hàng cho supplier theo kỳ (day | month | year)
 * Trả về { data, loading, error, refetch }
 */
export default function useOrderStats(period) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderStatsService.getOrderStats(period);
      // Chỉnh lại theo đúng shape response thực tế của BE, ví dụ res.data.data
      setData(res.data);
    } catch (err) {
      setError(err);
      // Fallback dữ liệu mẫu để không vỡ giao diện khi API chưa sẵn sàng
      setData(FALLBACK_ORDER_STATS[period]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchOrderStats();
  }, [fetchOrderStats]);

  return { data, loading, error, refetch: fetchOrderStats };
}
