// ── Format helpers ────────────────────────────────────────────────────────────

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
  if (n === 0)            return '0';
  return n.toLocaleString('vi-VN');
}

/**
 * Format khi đầu vào là số triệu đồng.
 */
export function fmtMillion(million) {
  return fmtMoney((Number(million) || 0) * 1_000_000);
}

// ── Color helpers ─────────────────────────────────────────────────────────────

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

// ── Utilities ─────────────────────────────────────────────────────────────────

export function sum(arr = []) {
  return arr.reduce((a, b) => a + b, 0);
}

/**
 * Tính % tăng trưởng so với kỳ liền trước.
 */
export function growthBadge(curr, prev) {
  if (prev === undefined || prev === null || prev === 0) {
    return { text: '—', cls: 'pill gr' };
  }
  const pct = ((curr - prev) / prev) * 100;
  const sign = pct > 0 ? '+' : '';
  const cls = pct > 0 ? 'pill g' : pct < 0 ? 'pill r' : 'pill gr';
  return { text: `${sign}${pct.toFixed(1)}%`, cls };
}

// Giữ lại để không break code cũ
export function fmtK(v) {
  return `${Math.round(v)}k`;
}

/**
 * Trả về ngày đầu tháng hiện tại dạng 'YYYY-MM-DD'.
 */
export function getFirstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Trả về ngày hôm nay dạng 'YYYY-MM-DD'.
 */
export function getToday() {
  const d = new Date();
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, '0')}-` +
    `${String(d.getDate()).padStart(2, '0')}`
  );
}

// ── Nhãn group by ─────────────────────────────────────────────────────────────

export const GROUP_BY_OPTIONS = [
  { key: 'day',   label: 'Theo ngày' },
  { key: 'month', label: 'Theo tháng' },
  { key: 'year',  label: 'Theo năm' },
];
