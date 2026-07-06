import { orderService, parseOrderList } from './../orderService';
import axiosClient from '../axiosClient';

// Helper to format date
const formatDate = (date, period) => {
  const d = new Date(date);
  if (period === 'day') return `${d.getDate()}/${d.getMonth() + 1}`;
  if (period === 'month') return `T${d.getMonth() + 1}/${d.getFullYear()}`;
  if (period === 'year') return `${d.getFullYear()}`;
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const orderStatsService = {
  /**
   * Lấy dữ liệu thống kê đơn hàng theo kỳ (day | month | year)
   * { labels: string[], sold: number[], cancelled: number[] }
   */
  getOrderStats: async (period) => {
    // Call the existing orders API
    const rawData = await orderService.getAll();
    const orders = parseOrderList(rawData);
    
    const statsMap = {};
    
    // Process orders
    orders.forEach(order => {
      const date = order.created_at || order.order_date;
      if (!date) return;
      
      const label = formatDate(date, period);
      if (!statsMap[label]) {
        statsMap[label] = { sold: 0, cancelled: 0 };
      }
      
      if (order.status === 'cancelled' || order.status === 'rejected') {
        statsMap[label].cancelled += 1;
      } else {
        statsMap[label].sold += 1;
      }
    });

    const labels = Object.keys(statsMap).sort();
    const sold = labels.map(l => statsMap[l].sold);
    const cancelled = labels.map(l => statsMap[l].cancelled);
    
    return { data: { labels, sold, cancelled } };
  },

  /**
   * Xuất báo cáo thống kê đơn hàng
   */
  exportOrderStats: (period, format) =>
    axiosClient.get(`/supplier/order-stats/export`, {
      params: { period, format },
      responseType: 'blob',
    }),
};

export default orderStatsService;
