import { orderService, parseOrderList } from './../orderService';

/**
 * revenueService – tổng hợp dữ liệu doanh thu & dòng tiền từ API đơn hàng.
 *
 * Params:
 *   startDate : 'YYYY-MM-DD' — ngày bắt đầu
 *   endDate   : 'YYYY-MM-DD' — ngày kết thúc
 *   groupBy   : 'day' | 'month' | 'year'
 *
 * Luồng gọi API:
 *   B1. GET /purchase-orders/ → danh sách đơn hàng
 *   B2. Lọc đơn cần tính dòng tiền (không phải cancelled/rejected)
 *   B3. GET /purchase-orders/{id}/ từng đơn (song song) → lấy payments[]
 *   B4. Tính doanh thu (chỉ completed/delivered) & dòng tiền (từ payments verified)
 *
 * Logic tính:
 *   ① Doanh thu — chỉ tính đơn COMPLETED hoặc DELIVERED
 *      - grossRevenue  : tổng total_amount, lọc theo updated_at
 *      - returnedAmount: giá trị hàng đã được duyệt trả lại
 *      - netRevenue    : grossRevenue - returnedAmount
 *
 *   ② Dòng tiền — tính từ payments[] của từng đơn (lấy từ detail API)
 *      - deposit verified       : payment_type='deposit' và status='verified'
 *      - final_payment verified : payment_type='final_payment' và status='verified'
 *      - totalCashIn = tổng deposit verified + final_payment verified
 *      - Lọc theo: verified_at (hoặc paid_at) của payment
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Trả về key ISO dùng để group theo thời gian */
function groupKey(date, groupBy) {
  const d = new Date(date);
  if (groupBy === 'year')
    return `${d.getFullYear()}`;
  if (groupBy === 'month')
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
  const [, mm, dd] = key.split('-');
  return `${parseInt(dd, 10)}/${parseInt(mm, 10)}`;
}

/** Kiểm tra một ngày có nằm trong khoảng [startDate, endDate] không */
function isInDateRange(dateStr, startDate, endDate) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d)) return false;
  const orderDate = d.toISOString().slice(0, 10);
  return orderDate >= startDate && orderDate <= endDate;
}

/** Đảm bảo timeMap[key] tồn tại */
function ensureKey(timeMap, key) {
  if (!timeMap[key]) {
    timeMap[key] = { cashIn: 0, depositIn: 0, finalIn: 0, refund: 0, gross: 0, returned: 0, orderCount: 0 };
  }
}

/** Tính tổng tiền hoàn trả từ returns / return_summary */
function sumRefundAmount(order) {
  if (order.return_summary?.approved_refund_total) {
    return Number(order.return_summary.approved_refund_total) || 0;
  }
  const returns = order.returns ?? order.return_requests ?? [];
  if (!Array.isArray(returns)) return 0;
  return returns
    .filter(r => r.approved === true || r.status === 'approved' || r.status === 'returned')
    .reduce((sum, r) => {
      if (r.refund_amount) return sum + (Number(r.refund_amount) || 0);
      const items = r.items ?? [];
      return sum + items.reduce((s, item) => {
        return s + (Number(item.quantity ?? 0) * Number(item.unit_price ?? 0));
      }, 0);
    }, 0);
}

// Trạng thái đơn được tính vào DOANH THU
const REVENUE_STATUSES = new Set(['completed', 'delivered']);
// Trạng thái đơn bị loại khỏi dòng tiền
const SKIP_STATUSES = new Set(['cancelled', 'rejected']);

// ── Service ───────────────────────────────────────────────────────────────────

export const revenueService = {
  /**
   * @param {{ startDate: string, endDate: string, groupBy: 'day'|'month'|'year' }} params
   * @param {AbortSignal} [signal]
   */
  getRevenueStats: async ({ startDate, endDate, groupBy = 'day' }, signal) => {

    // ═══════════════════════════════════════════════════════════════
    // BƯỚC 1: Lấy danh sách đơn hàng
    // ═══════════════════════════════════════════════════════════════
    const rawData = await orderService.getAll();
    const orders = parseOrderList(rawData);

    if (!orders.length) {
      return {
        data: {
          startDate, endDate, groupBy,
          totalCashIn: 0, totalDeposit: 0, totalFinalPayment: 0,
          totalRefund: 0, netCashFlow: 0,
          grossRevenue: 0, returnedAmount: 0, netRevenue: 0,
          totalOrders: 0, chartData: [],
        },
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // BƯỚC 2: Lọc đơn cần call detail (không phải cancelled/rejected)
    //         để lấy payments[]
    // ═══════════════════════════════════════════════════════════════
    const ordersNeedDetail = orders.filter(o => !SKIP_STATUSES.has(o.status || ''));

    // ═══════════════════════════════════════════════════════════════
    // BƯỚC 3: Call detail từng đơn song song để lấy payments[]
    //         Dùng Promise.allSettled để không bị lỗi nếu 1 đơn fail
    // ═══════════════════════════════════════════════════════════════
    const detailResults = await Promise.allSettled(
      ordersNeedDetail.map(order => orderService.getById(order.id))
    );

    // Map id → detail (có payments[])
    const detailMap = new Map();
    detailResults.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        const detail = result.value;
        const orderId = detail.id ?? ordersNeedDetail[idx].id;
        detailMap.set(String(orderId), detail);
      }
    });

    // ═══════════════════════════════════════════════════════════════
    // BƯỚC 4A: TÍNH DOANH THU
    //   - Chỉ đơn COMPLETED / DELIVERED
    //   - Lọc theo updated_at của đơn hàng
    // ═══════════════════════════════════════════════════════════════
    let grossRevenue = 0;
    let returnedAmount = 0;
    let totalOrders = 0;

    const timeMap = {};

    orders.forEach(order => {
      const st = order.status || '';
      if (!REVENUE_STATUSES.has(st)) return;

      // Lọc theo updated_at (ngày đơn hoàn thành), fallback về created_at
      const date = order.updated_at || order.created_at || order.order_date;
      if (!isInDateRange(date, startDate, endDate)) return;

      const key = groupKey(date, groupBy);
      ensureKey(timeMap, key);

      const orderAmount = Number(order.total_amount || order.total || order.amount || 0);

      totalOrders++;
      timeMap[key].orderCount++;

      grossRevenue += orderAmount;
      timeMap[key].gross += orderAmount;

      // Lấy return từ detail nếu có, fallback về list
      const detail = detailMap.get(String(order.id));
      const orderWithReturns = detail || order;
      const retAmt = sumRefundAmount(orderWithReturns);
      returnedAmount += retAmt;
      timeMap[key].returned += retAmt;
    });

    const netRevenue = grossRevenue - returnedAmount;

    // ═══════════════════════════════════════════════════════════════
    // BƯỚC 4B: TÍNH DÒNG TIỀN
    //   - Từ payments[] lấy được ở BƯỚC 3 (detail API)
    //   - Chỉ tính payment có status = 'verified'
    //   - deposit verified     → totalDeposit
    //   - final_payment verified → totalFinalPayment
    //   - Lọc theo verified_at (hoặc paid_at) của payment
    // ═══════════════════════════════════════════════════════════════
    let totalCashIn = 0;
    let totalDeposit = 0;
    let totalFinalPayment = 0;
    let totalRefund = 0;

    ordersNeedDetail.forEach(order => {
      const detail = detailMap.get(String(order.id));

      // Nếu không lấy được detail → fallback: dùng paid_amount từ list
      // (paid_amount = tổng tiền đã xác nhận, tương đương tổng payments verified)
      if (!detail) {
        // paid_amount có trong PurchaseOrderListSerializer
        const paidAmt = Number(order.paid_amount || 0);
        if (paidAmt > 0) {
          // Không biết ngày verified_at, dùng updated_at của đơn để group
          const date = order.updated_at || order.created_at;
          if (date && isInDateRange(date, startDate, endDate)) {
            const key = groupKey(date, groupBy);
            ensureKey(timeMap, key);
            totalCashIn += paidAmt;
            timeMap[key].cashIn += paidAmt;
          }
        }
        return;
      }

      const payments = detail.payments ?? [];

      payments.forEach(p => {
        // Chỉ tính payment đã được NCC xác nhận
        if (p.status !== 'verified') return;

        // Lọc theo ngày payment được xác nhận
        const paymentDate = p.verified_at || p.paid_at || p.created_at;
        if (!paymentDate || !isInDateRange(paymentDate, startDate, endDate)) return;

        const amt = Number(p.amount) || 0;
        if (amt <= 0) return;

        const key = groupKey(paymentDate, groupBy);
        ensureKey(timeMap, key);

        totalCashIn += amt;
        timeMap[key].cashIn += amt;

        if (p.payment_type === 'deposit') {
          totalDeposit += amt;
          timeMap[key].depositIn += amt;
        } else if (p.payment_type === 'final_payment') {
          totalFinalPayment += amt;
          timeMap[key].finalIn += amt;
        }
      });

      // Tiền hoàn: từ returns đã duyệt
      const refund = sumRefundAmount(detail);
      if (refund > 0) {
        totalRefund += refund;
        const refundDate = order.updated_at || order.created_at;
        if (refundDate && isInDateRange(refundDate, startDate, endDate)) {
          const key = groupKey(refundDate, groupBy);
          ensureKey(timeMap, key);
          timeMap[key].refund += refund;
        }
      }
    });

    const netCashFlow = totalCashIn - totalRefund;

    // ═══════════════════════════════════════════════════════════════
    // BƯỚC 5: Xây dựng chartData (đơn vị triệu đồng)
    // ═══════════════════════════════════════════════════════════════
    const chartData = Object.keys(timeMap)
      .sort()
      .map(key => ({
        label: keyToLabel(key, groupBy),
        key,
        cashIn: Math.round((timeMap[key].cashIn / 1_000_000) * 10) / 10,
        depositIn: Math.round((timeMap[key].depositIn / 1_000_000) * 10) / 10,
        finalIn: Math.round((timeMap[key].finalIn / 1_000_000) * 10) / 10,
        refund: Math.round((timeMap[key].refund / 1_000_000) * 10) / 10,
        netCashFlow: Math.round(((timeMap[key].cashIn - timeMap[key].refund) / 1_000_000) * 10) / 10,
        grossRevenue: Math.round((timeMap[key].gross / 1_000_000) * 10) / 10,
        returnedAmount: Math.round((timeMap[key].returned / 1_000_000) * 10) / 10,
        netRevenue: Math.round(((timeMap[key].gross - timeMap[key].returned) / 1_000_000) * 10) / 10,
        orderCount: timeMap[key].orderCount,
      }));

    // Trả kết quả
    return {
      data: {
        startDate, endDate, groupBy,

        // KPI - Dòng Tiền (VNĐ)
        totalCashIn,
        totalDeposit,         // Tiền cọc đã xác nhận
        totalFinalPayment,    // Thanh toán cuối đã xác nhận
        totalRefund,
        netCashFlow,

        // KPI - Doanh Thu (VNĐ) — chỉ đơn completed/delivered
        grossRevenue,
        returnedAmount,
        netRevenue,

        // Tổng đơn hàng (completed/delivered trong khoảng thời gian)
        totalOrders,

        // Chart data (đơn vị triệu đồng)
        chartData,
      },
    };
  },
};

export default revenueService;
