import { orderService, parseOrderList } from './../orderService';
import { dashBoardSupplierService } from './dashBoardService';

/**
 * revenueService – tổng hợp dữ liệu doanh thu từ các API có sẵn.
 *
 * period:
 *   'day'   → 30 ngày gần nhất, nhãn "dd/MM"
 *   'month' → 12 tháng gần nhất, nhãn "T{MM}"
 *   'year'  → toàn bộ lịch sử, nhãn "{YYYY}"
 *
 * Tất cả revenue[] đơn vị triệu đồng.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Trả về key ISO dùng để group và sort đúng thứ tự thời gian */
function groupKey(date, period) {
  const d = new Date(date);
  if (period === 'year')
    return `${d.getFullYear()}`;
  if (period === 'month')
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  // day → yyyy-MM-dd
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, '0')}-` +
    `${String(d.getDate()).padStart(2, '0')}`
  );
}

/** Chuyển ISO key thành nhãn đẹp hiển thị */
function keyToLabel(key, period) {
  if (period === 'year') return key;               // "2025"
  if (period === 'month') {
    const [, mm] = key.split('-');
    return `T${parseInt(mm, 10)}`;                // "T6"
  }
  // day: yyyy-MM-dd → dd/MM
  const [, mm, dd] = key.split('-');
  return `${parseInt(dd, 10)}/${parseInt(mm, 10)}`; // "6/7"
}

/** Chỉ lấy đơn hàng trong khoảng thời gian của period */
function isInPeriodWindow(dateStr, period) {
  const d = new Date(dateStr);
  if (isNaN(d)) return false;
  const now = new Date();

  if (period === 'day') {
    // 30 ngày gần nhất
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);
    return d >= cutoff;
  }
  if (period === 'month') {
    // 12 tháng gần nhất (tính từ đầu tháng cách đây 11 tháng)
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    return d >= cutoff;
  }
  // year: toàn bộ lịch sử
  return true;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const revenueService = {
  /**
   * @param {'day'|'month'|'year'} period
   * @param {AbortSignal} [signal]
   */
  getRevenueStats: async (period = 'day', signal) => {
    // 1. Lấy danh sách đơn hàng
    const rawData = await orderService.getAll();
    const orders  = parseOrderList(rawData);

    // 2. Lấy top products & biểu đồ doanh thu dashboard
    const topProductsRaw = await dashBoardSupplierService.getTopProducts().catch(() => []);
    const revenueChart   = await dashBoardSupplierService.getRevenueChart().catch(() => []);

    // 3. Tổng hợp theo period (chỉ tính đơn trong cửa sổ thời gian phù hợp)
    const statsMap = {};
    const statusMap = {
      pending: 0, confirmed: 0, processing: 0, shipping: 0,
      completed: 0, cancelled: 0, rejected: 0,
      pending_supplier_confirmation: 0,
    };

    orders.forEach(order => {
      const date = order.created_at || order.order_date;
      if (!date) return;
      if (!isInPeriodWindow(date, period)) return; // ← lọc đúng kỳ

      const key = groupKey(date, period);
      if (!statsMap[key]) statsMap[key] = { sold: 0, cancelled: 0, revenue: 0 };

      const st = order.status || 'pending';
      statusMap[st] = (statusMap[st] || 0) + 1;

      if (st === 'cancelled' || st === 'rejected') {
        statsMap[key].cancelled += 1;
      } else {
        statsMap[key].sold += 1;
        statsMap[key].revenue +=
          Number(order.total_amount || order.total || order.amount || 0) / 1_000_000;
      }
    });

    // 4. Xây dựng mảng labels / data, sort tăng dần theo thời gian
    const labels          = [];
    const revenue         = [];
    const orders_sold     = [];
    const orders_cancelled = [];

    if (period === 'month' && revenueChart.length > 0) {
      // Ưu tiên dùng doanh thu từ dashboard (backend đã tính chính xác)
      // Lấy tối đa 12 tháng gần nhất, sort tăng dần
      const chartSorted = [...revenueChart]
        .sort((a, b) => (a.month || '').localeCompare(b.month || ''))
        .slice(-12);

      chartSorted.forEach(d => {
        const key = d.month;                        // "2026-06"
        const lbl = keyToLabel(key, 'month');       // "T6"
        labels.push(lbl);
        revenue.push(Math.round(((d.revenue || 0) / 1_000_000) * 10) / 10);
        orders_sold.push(statsMap[key]?.sold || 0);
        orders_cancelled.push(statsMap[key]?.cancelled || 0);
      });
    } else {
      // day / year: dùng dữ liệu từ orders
      Object.keys(statsMap)
        .sort()                                     // sort ISO key → đúng thứ tự thời gian
        .forEach(key => {
          labels.push(keyToLabel(key, period));
          revenue.push(Math.round(statsMap[key].revenue * 10) / 10);
          orders_sold.push(statsMap[key].sold);
          orders_cancelled.push(statsMap[key].cancelled);
        });
    }

    // 5. Breakdown trạng thái đơn hàng (toàn bộ, không lọc theo period)
    const status_breakdown = [
      { label: 'Hoàn thành', value: statusMap.completed || 0,                                                   color_key: 'green8'  },
      { label: 'Đang giao',  value: statusMap.shipping  || 0,                                                   color_key: 'blue8'   },
      { label: 'Chờ duyệt',  value: (statusMap.pending || 0) + (statusMap.pending_supplier_confirmation || 0),  color_key: 'amber8'  },
      { label: 'Đã hủy',     value: (statusMap.cancelled || 0) + (statusMap.rejected || 0),                     color_key: 'red8'    },
      { label: 'Đang xử lý', value: (statusMap.processing || 0) + (statusMap.confirmed || 0),                   color_key: 'purple8' },
    ].filter(item => item.value > 0);

    // 6. Doanh thu theo danh mục (tỷ trọng %)
    const catMap = {};
    topProductsRaw.forEach(p => {
      const cat = p.category || 'Khác';
      catMap[cat] = (catMap[cat] || 0) + (p.revenue || 0);
    });
    const totalCatRevenue = Object.values(catMap).reduce((a, b) => a + b, 0) || 1;
    const COLORS = ['green8', 'blue8', 'amber8', 'purple8', 'red8'];
    const by_category = Object.keys(catMap).map((k, i) => ({
      label:     k,
      value:     Math.round((catMap[k] / totalCatRevenue) * 1000) / 10, // % tỷ trọng
      color_key: COLORS[i % COLORS.length],
    }));

    // 7. Top sản phẩm
    const top_products = topProductsRaw.slice(0, 5).map(p => ({
      name:    p.name,
      qty:     p.quantity || p.total_sold || 0,
      revenue: p.revenue  || 0,
    }));

    return {
      data: {
        period,
        labels,
        revenue,
        orders_sold,
        orders_cancelled,
        status_breakdown,
        by_category,
        top_products,
      },
    };
  },
};

export default revenueService;
