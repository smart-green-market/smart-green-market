import { orderService, parseOrderList, extractOrderItems } from './../orderService';
import { dashBoardSupplierService } from './dashBoardService';

/**
 * revenueService – tổng hợp dữ liệu doanh thu & dòng tiền từ API đơn hàng.
 *
 * Params:
 *   startDate : 'YYYY-MM-DD' — ngày bắt đầu
 *   endDate   : 'YYYY-MM-DD' — ngày kết thúc
 *   groupBy   : 'day' | 'month' | 'year'
 *
 * Trả về 2 cụm chỉ số:
 *   ① Dòng tiền  — totalCashIn, totalRefund, netCashFlow
 *   ② Doanh thu  — grossRevenue, returnedAmount, netRevenue
 *   + chartData[]  cho biểu đồ cột ghép (Grouped Bar Chart)
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Trả về key ISO dùng để group theo thời gian */
function groupKey(date, groupBy) {
  const d = new Date(date);
  if (groupBy === 'year')
    return `${d.getFullYear()}`;
  if (groupBy === 'month')
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  // day → yyyy-MM-dd
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, '0')}-` +
    `${String(d.getDate()).padStart(2, '0')}`
  );
}

/** Chuyển ISO key thành nhãn hiển thị */
function keyToLabel(key, groupBy) {
  if (groupBy === 'year') return key;
  if (groupBy === 'month') {
    const [yy, mm] = key.split('-');
    return `T${parseInt(mm, 10)}/${yy}`;
  }
  // day: yyyy-MM-dd → dd/MM
  const [, mm, dd] = key.split('-');
  return `${parseInt(dd, 10)}/${parseInt(mm, 10)}`;
}

/** Lọc đơn hàng trong khoảng startDate → endDate */
function isInDateRange(dateStr, startDate, endDate) {
  const d = new Date(dateStr);
  if (isNaN(d)) return false;

  // So sánh theo ngày (bỏ qua giờ)
  const orderDate = d.toISOString().slice(0, 10);
  return orderDate >= startDate && orderDate <= endDate;
}

/** Tính tổng tiền đã thanh toán (verified/approved) từ payments[] */
function sumVerifiedPayments(payments) {
  if (!Array.isArray(payments) || payments.length === 0) return 0;
  return payments
    .filter(p => p.status === 'verified' || p.status === 'approved' || p.status === 'completed')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}

/** Tính tổng tiền hoàn trả từ returns / return_summary */
function sumRefundAmount(order) {
  // Ưu tiên return_summary nếu có
  if (order.return_summary?.approved_refund_total) {
    return Number(order.return_summary.approved_refund_total) || 0;
  }

  // Fallback: duyệt từng return request
  const returns = order.returns ?? order.return_requests ?? [];
  if (!Array.isArray(returns)) return 0;

  return returns
    .filter(r => r.approved === true || r.status === 'approved' || r.status === 'returned')
    .reduce((sum, r) => {
      // Nếu return có refund_amount
      if (r.refund_amount) return sum + (Number(r.refund_amount) || 0);
      // Fallback: tính từ items
      const items = r.items ?? [];
      const itemTotal = items.reduce((s, item) => {
        const qty = Number(item.quantity ?? 0);
        const price = Number(item.unit_price ?? 0);
        return s + (qty * price);
      }, 0);
      return sum + itemTotal;
    }, 0);
}

// ── Service ───────────────────────────────────────────────────────────────────

export const revenueService = {
  /**
   * @param {{ startDate: string, endDate: string, groupBy: 'day'|'month'|'year' }} params
   * @param {AbortSignal} [signal]
   */
  getRevenueStats: async ({ startDate, endDate, groupBy = 'day' }, signal) => {
    // 1. Lấy danh sách đơn hàng
    const rawData = await orderService.getAll();
    const orders = parseOrderList(rawData);

    // 2. Lọc đơn hàng theo khoảng thời gian
    const filteredOrders = orders.filter(order => {
      const date = order.created_at || order.order_date;
      if (!date) return false;
      return isInDateRange(date, startDate, endDate);
    });

    // 3. Tính toán tổng quan (KPI)
    let totalCashIn = 0;       // Tổng tiền vào (từ payments đã xác nhận)
    let totalRefund = 0;       // Tổng tiền hoàn (từ returns đã duyệt)
    let grossRevenue = 0;      // Doanh thu gộp (total_amount các đơn không hủy)
    let returnedAmount = 0;    // Hàng bị trả lại (giá trị)
    let totalOrders = 0;       // Tổng số đơn

    // Dữ liệu group theo thời gian
    const timeMap = {};

    filteredOrders.forEach(order => {
      const date = order.created_at || order.order_date;
      const key = groupKey(date, groupBy);
      const st = order.status || 'pending';
      const orderAmount = Number(order.total_amount || order.total || order.amount || 0);

      // Khởi tạo entry nếu chưa có
      if (!timeMap[key]) {
        timeMap[key] = {
          cashIn: 0,
          refund: 0,
          gross: 0,
          returned: 0,
          orderCount: 0,
        };
      }

      // Bỏ qua đơn hủy/từ chối cho doanh thu
      if (st === 'cancelled' || st === 'rejected') {
        return;
      }

      totalOrders++;
      timeMap[key].orderCount++;

      // ── CỤM DÒNG TIỀN ──
      // Tiền vào: từ payments đã verified, hoặc fallback là total_amount của đơn hoàn thành
      const payments = order.payments ?? [];
      let cashIn = sumVerifiedPayments(payments);
      if (cashIn === 0 && (st === 'completed' || st === 'shipping' || st === 'processing')) {
        // Fallback: nếu không có payments[], coi total_amount là tiền đã nhận
        cashIn = orderAmount;
      }
      totalCashIn += cashIn;
      timeMap[key].cashIn += cashIn;

      // Tiền hoàn: từ returns đã duyệt
      const refund = sumRefundAmount(order);
      totalRefund += refund;
      timeMap[key].refund += refund;

      // ── CỤM DOANH THU ──
      // Doanh thu gộp: total_amount (bất kể trạng thái, miễn không hủy)
      grossRevenue += orderAmount;
      timeMap[key].gross += orderAmount;

      // Hàng bị trả lại: giá trị đã trả hàng thành công
      const retAmt = sumRefundAmount(order);
      returnedAmount += retAmt;
      timeMap[key].returned += retAmt;
    });

    const netCashFlow = totalCashIn - totalRefund;
    const netRevenue = grossRevenue - returnedAmount;

    // 4. Xây dựng chartData cho biểu đồ (sort theo thời gian)
    const chartData = Object.keys(timeMap)
      .sort()
      .map(key => ({
        label: keyToLabel(key, groupBy),
        key,
        netCashFlow: Math.round(((timeMap[key].cashIn - timeMap[key].refund) / 1_000_000) * 10) / 10,
        netRevenue: Math.round(((timeMap[key].gross - timeMap[key].returned) / 1_000_000) * 10) / 10,
        cashIn: Math.round((timeMap[key].cashIn / 1_000_000) * 10) / 10,
        refund: Math.round((timeMap[key].refund / 1_000_000) * 10) / 10,
        grossRevenue: Math.round((timeMap[key].gross / 1_000_000) * 10) / 10,
        returnedAmount: Math.round((timeMap[key].returned / 1_000_000) * 10) / 10,
        orderCount: timeMap[key].orderCount,
      }));

    // 5. Trả kết quả
    return {
      data: {
        // Filters
        startDate,
        endDate,
        groupBy,

        // KPI - Dòng Tiền (VNĐ)
        totalCashIn,
        totalRefund,
        netCashFlow,

        // KPI - Doanh Thu (VNĐ)
        grossRevenue,
        returnedAmount,
        netRevenue,

        // Tổng đơn hàng
        totalOrders,

        // Chart data (đơn vị triệu đồng)
        chartData,
      },
    };
  },
};

export default revenueService;
