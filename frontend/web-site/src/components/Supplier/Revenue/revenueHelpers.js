// Nhãn hiển thị & đơn vị theo từng loại kỳ thống kê
export const PERIOD_LABEL = {
  day: '7 ngày gần nhất',
  month: '6 tháng gần nhất',
  year: '5 năm gần nhất',
};

export const PERIOD_UNIT = {
  day: 'ngày',
  month: 'tháng',
  year: 'năm',
};

// Map color_key (string) trả về từ API -> CSS variable dùng trong UI.
// Nếu backend trả thẳng mã màu hex thì có thể bỏ qua map này và dùng trực tiếp.
export const COLOR_MAP = {
  green8: 'var(--green8)',
  green0: 'var(--green0)',
  blue8: 'var(--blue8)',
  blue0: 'var(--blue0)',
  amber8: 'var(--amber8)',
  amber0: 'var(--amber0)',
  purple8: 'var(--purple8)',
  purple0: 'var(--purple0)',
  red8: 'var(--red8)',
  red0: 'var(--red0)',
};

export function resolveColor(colorKey, fallback = 'var(--text3)') {
  return COLOR_MAP[colorKey] || colorKey || fallback;
}

export function sum(arr = []) {
  return arr.reduce((a, b) => a + b, 0);
}

/**
 * Format số tiền VNĐ thông minh.
 * Đầu vào luôn là giá trị VNĐ thô (không phải triệu).
 * Ví dụ: 5_000_000 -> "5tr" | 1_500_000_000 -> "1.5 tỷ" | 250_000 -> "250k"
 */
export function fmtMoney(value) {
  const n = Number(value) || 0;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')} tỷ`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}tr`;
  if (n >= 1_000)         return `${Math.round(n / 1_000)}k`;
  return n.toLocaleString('vi-VN');
}

/**
 * Format khi đầu vào là số triệu đồng (revenue[] trong revenueStats là đơn vị triệu).
 */
export function fmtMillion(million) {
  return fmtMoney((Number(million) || 0) * 1_000_000);
}

// Giữ lại để không break code cũ
export function fmtK(v) {
  return `${Math.round(v)}k`;
}

// Tính % tăng trưởng so với kỳ liền trước, trả về text + class pill màu tương ứng
export function growthBadge(curr, prev) {
  if (prev === undefined || prev === null || prev === 0) {
    return { text: '—', cls: 'pill gr' };
  }
  const pct = ((curr - prev) / prev) * 100;
  const sign = pct > 0 ? '+' : '';
  const cls = pct > 0 ? 'pill g' : pct < 0 ? 'pill r' : 'pill gr';
  return { text: `${sign}${pct.toFixed(1)}%`, cls };
}

/**
 * Tính toàn bộ số liệu tổng hợp (metrics) từ dữ liệu thô trả về từ API.
 * Tách riêng để component RevenueMetrics chỉ lo hiển thị, không lo tính toán.
 */
/**
 * Trả về:
 * - totalRevenueMillion : tổng doanh thu (đơn vị triệu đồng, để vẽ chart)
 * - totalRevenueVND     : tổng doanh thu (đơn vị VNĐ, để hiển thị)
 * - totalOrders         : tổng số đơn bán được
 * - avgPerOrderVND      : trung bình / đơn (VNĐ)
 * - commissionMillion   : phí hoa hồng sàn (triệu đồng)
 * - commissionVND       : phí hoa hồng sàn (VNĐ)
 * - netRevenueMillion   : thực nhận (triệu đồng)
 * - netRevenueVND       : thực nhận (VNĐ)
 */
export function computeRevenueMetrics(revenueStats) {
  const { revenue = [], orders_sold = [] } = revenueStats || {};
  // revenue[] là đơn vị triệu đồng
  const totalRevenueMillion = sum(revenue);
  const totalRevenueVND     = totalRevenueMillion * 1_000_000;
  const totalOrders         = sum(orders_sold);
  const avgPerOrderVND      = totalOrders ? totalRevenueVND / totalOrders : 0;
  const commissionMillion   = totalRevenueMillion * 0.05;
  const commissionVND       = commissionMillion * 1_000_000;
  const netRevenueMillion   = totalRevenueMillion - commissionMillion;
  const netRevenueVND       = netRevenueMillion * 1_000_000;

  return {
    totalRevenueMillion, totalRevenueVND,
    totalOrders,
    avgPerOrderVND,
    commissionMillion, commissionVND,
    netRevenueMillion, netRevenueVND,
    // Backwards-compat aliases
    totalRevenue: totalRevenueMillion,
    avgPerOrder:  avgPerOrderVND,
    commission:   commissionMillion,
    netRevenue:   netRevenueMillion,
  };
}
