// Cộng tổng một mảng số
export function sum(arr = []) {
  return arr.reduce((a, b) => a + b, 0);
}

// Tính % tăng trưởng so với kỳ liền trước, trả về text + className cho pill màu tương ứng
export function growthBadge(curr, prev) {
  if (prev === undefined || prev === null || prev === 0) {
    return { text: '—', className: 'pill gr' };
  }
  const pct = ((curr - prev) / prev) * 100;
  const sign = pct > 0 ? '+' : '';
  const className = pct > 0 ? 'pill g' : pct < 0 ? 'pill r' : 'pill gr';
  return { text: `${sign}${pct.toFixed(1)}%`, className };
}

// Tính các chỉ số tổng hợp (metrics) từ dữ liệu 1 kỳ thống kê đơn hàng
export function computeOrderStatsSummary(data) {
  if (!data) return null;
  const totalSold = sum(data.sold);
  const totalCancelled = sum(data.cancelled);
  const completionRate = totalSold + totalCancelled > 0
    ? ((totalSold / (totalSold + totalCancelled)) * 100).toFixed(1)
    : '0.0';
  const avgPerPeriod = data.labels.length > 0
    ? (totalSold / data.labels.length).toFixed(1)
    : '0.0';

  return { totalSold, totalCancelled, completionRate, avgPerPeriod };
}

// Lấy top 5 kỳ có số đơn bán ra cao nhất
export function getTopPeriods(data, limit = 5) {
  if (!data) return [];
  return data.labels
    .map((lbl, i) => ({ label: lbl, sold: data.sold[i] }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, limit);
}
