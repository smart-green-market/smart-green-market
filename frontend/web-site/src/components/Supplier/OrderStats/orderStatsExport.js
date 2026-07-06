import { PERIOD_LABEL } from './orderStatsConstants';
import { sum } from './orderStatsHelpers';

// ── CSV helpers ───────────────────────────────────────────────────────────────
function csvCell(v) {
  return `"${String(v).replace(/"/g, '""')}"`;
}
function csvRow(cells) {
  return cells.map(csvCell).join(',') + '\r\n';
}

/**
 * Gộp số liệu cần thiết để xuất báo cáo thống kê đơn hàng.
 * @param {object} data   - dữ liệu { labels, sold, cancelled } từ useOrderStats
 * @param {string} period - 'day' | 'month' | 'year'
 * @param {object} opts   - { wantDetail, wantSummary }
 */
export function buildOrderStatsReport(data, period, opts) {
  const { labels = [], sold = [], cancelled = [] } = data || {};
  const totalSold      = sum(sold);
  const totalCancelled = sum(cancelled);
  const totalOrders    = totalSold + totalCancelled;
  const completionRate = totalOrders
    ? ((totalSold / totalOrders) * 100).toFixed(1)
    : '0.0';
  const avgPerPeriod   = labels.length
    ? (totalSold / labels.length).toFixed(1)
    : '0.0';

  return {
    period,
    labels,
    sold,
    cancelled,
    totalSold,
    totalCancelled,
    totalOrders,
    completionRate,
    avgPerPeriod,
    ...opts,
  };
}

// ── CSV export ────────────────────────────────────────────────────────────────
export function exportOrderStatsCSV(r) {
  let csv = '\uFEFF'; // BOM — Excel đọc đúng tiếng Việt
  csv += csvRow(['BÁO CÁO THỐNG KÊ ĐƠN HÀNG']);
  csv += csvRow(['Khoảng thời gian', PERIOD_LABEL[r.period] ?? r.period]);
  csv += csvRow(['Ngày xuất', new Date().toLocaleDateString('vi-VN')]);
  csv += '\r\n';

  if (r.wantDetail) {
    csv += csvRow(['CHI TIẾT THEO KỲ']);
    csv += csvRow(['Kỳ', 'Đã bán', 'Hủy / trả', 'Tổng', 'Tỷ lệ hoàn thành']);
    r.labels.forEach((lbl, i) => {
      const s = r.sold[i] || 0;
      const c = r.cancelled[i] || 0;
      const t = s + c;
      const rate = t ? ((s / t) * 100).toFixed(1) : '0.0';
      csv += csvRow([lbl, s, c, t, `${rate}%`]);
    });
    csv += csvRow(['Tổng', r.totalSold, r.totalCancelled, r.totalOrders, `${r.completionRate}%`]);
    csv += '\r\n';
  }

  if (r.wantSummary) {
    csv += csvRow(['TỔNG HỢP']);
    csv += csvRow(['Chỉ số', 'Giá trị']);
    csv += csvRow(['Tổng đơn đã bán', r.totalSold]);
    csv += csvRow(['Tổng đơn hủy / trả', r.totalCancelled]);
    csv += csvRow(['Tổng đơn xử lý', r.totalOrders]);
    csv += csvRow(['Tỷ lệ hoàn thành', `${r.completionRate}%`]);
    csv += csvRow([`TB đơn / ${PERIOD_LABEL[r.period] ?? r.period}`, r.avgPerPeriod]);
    csv += '\r\n';
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `thong-ke-don-hang-${r.period}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PDF export (print) ────────────────────────────────────────────────────────
export function exportOrderStatsPDF(r) {
  const rowsHtml = (headers, rows) => `
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;

  let sections = '';

  if (r.wantDetail) {
    const rows = r.labels.map((lbl, i) => {
      const s = r.sold[i] || 0;
      const c = r.cancelled[i] || 0;
      const t = s + c;
      const rate = t ? ((s / t) * 100).toFixed(1) : '0.0';
      return [lbl, s, c, t, `${rate}%`];
    });
    sections += `<h2>Chi tiết theo kỳ</h2>
      ${rowsHtml(['Kỳ', 'Đã bán', 'Hủy / trả', 'Tổng', 'Tỷ lệ hoàn thành'], rows)}
      <div class="sum-line">
        <span>Tổng đơn đã bán: <b>${r.totalSold}</b></span>
        <span>Hủy / trả: <b>${r.totalCancelled}</b></span>
        <span>Tỷ lệ hoàn thành: <b>${r.completionRate}%</b></span>
      </div>`;
  }

  if (r.wantSummary) {
    sections += `<h2>Tổng hợp</h2>
      ${rowsHtml(['Chỉ số', 'Giá trị'], [
        ['Tổng đơn đã bán',    r.totalSold],
        ['Tổng đơn hủy / trả', r.totalCancelled],
        ['Tổng đơn xử lý',     r.totalOrders],
        ['Tỷ lệ hoàn thành',   `${r.completionRate}%`],
        [`TB đơn / ${PERIOD_LABEL[r.period] ?? r.period}`, r.avgPerPeriod],
      ])}`;
  }

  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">
    <title>Báo cáo thống kê đơn hàng</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'Be Vietnam Pro', Arial, sans-serif; color: #111827; padding: 32px; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      .meta { font-size: 12px; color: #6b7280; margin-bottom: 24px; }
      h2 { font-size: 14px; margin: 22px 0 8px; color: #1a5c2a; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 6px; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
      th { background: #f3f4f6; font-weight: 600; }
      td:not(:first-child), th:not(:first-child) { text-align: right; }
      .sum-line { display: flex; gap: 20px; font-size: 12px; color: #374151; margin: 6px 0 4px; flex-wrap: wrap; }
      @media print { body { padding: 0 16px; } }
    </style></head>
    <body>
      <h1>Báo cáo thống kê đơn hàng — GreenMarket</h1>
      <div class="meta">Khoảng thời gian: ${PERIOD_LABEL[r.period] ?? r.period} · Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</div>
      ${sections}
      <script>window.onload = () => setTimeout(() => window.print(), 200);<\/script>
    </body></html>`;

  const w = window.open('', '_blank');
  if (!w) {
    alert('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup để xuất PDF.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
