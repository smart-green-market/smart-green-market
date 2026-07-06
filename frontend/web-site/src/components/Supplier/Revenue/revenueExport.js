import { PERIOD_LABEL, fmtK, sum } from './revenueHelpers';

// Chuỗi CSV cần bọc dấu ngoặc kép để tránh vỡ cột khi có dấu phẩy/tiếng Việt
function csvCell(v) {
  return `"${String(v).replace(/"/g, '""')}"`;
}
function csvRow(cells) {
  return cells.map(csvCell).join(',') + '\r\n';
}

/**
 * Gộp số liệu cần thiết để xuất báo cáo, dựa trên dữ liệu revenueStats
 * đang hiển thị trên trang (đã fetch theo period hiện tại) + các option
 * người dùng chọn trong modal.
 */
export function buildReportSections(revenueStats, period, options) {
  const { labels = [], revenue = [], orders_sold = [], orders_cancelled = [] } = revenueStats || {};
  const cats = revenueStats?.by_category || [];
  const tops = revenueStats?.top_products || [];
  const unit = period === 'day' ? 'k' : 'tr';

  const totalRevenue = sum(revenue);
  const totalOrders = sum(orders_sold);
  const totalCancelled = sum(orders_cancelled);
  const commission = totalRevenue * 0.05;
  const netRevenue = totalRevenue - commission;
  const completionRate = totalOrders + totalCancelled
    ? ((totalOrders / (totalOrders + totalCancelled)) * 100).toFixed(1)
    : '0.0';

  return {
    period,
    labels,
    revenue,
    orders_sold,
    orders_cancelled,
    cats,
    tops,
    unit,
    totalRevenue,
    totalOrders,
    totalCancelled,
    commission,
    netRevenue,
    completionRate,
    ...options, // { wantRevenue, wantOrders, wantCategory, wantTop }
  };
}

export function exportCSV(r) {
  let csv = '\uFEFF'; // BOM để Excel hiển thị đúng tiếng Việt
  csv += csvRow(['BÁO CÁO DOANH THU & ĐƠN HÀNG']);
  csv += csvRow(['Khoảng thời gian', PERIOD_LABEL[r.period]]);
  csv += csvRow(['Ngày xuất', new Date().toLocaleDateString('vi-VN')]);
  csv += '\r\n';

  if (r.wantRevenue) {
    csv += csvRow(['DOANH THU THEO THỜI GIAN']);
    csv += csvRow(['Kỳ', 'Số đơn', 'Doanh thu (triệu đồng)', 'TB / đơn']);
    r.labels.forEach((lbl, i) => {
      const ord = r.orders_sold[i] || 0;
      const avg = ord ? (r.revenue[i] * 1_000_000) / ord : 0;
      csv += csvRow([lbl, ord, r.revenue[i].toFixed(1), fmtK(avg / 1000)]);
    });
    csv += csvRow(['Tổng', r.totalOrders, r.totalRevenue.toFixed(1), '']);
    csv += csvRow(['Phí hoa hồng sàn (5%)', '', r.commission.toFixed(1), '']);
    csv += csvRow(['Thực nhận', '', r.netRevenue.toFixed(1), '']);
    csv += '\r\n';
  }

  if (r.wantOrders) {
    csv += csvRow(['THỐNG KÊ ĐƠN HÀNG']);
    csv += csvRow(['Kỳ', 'Đã bán', 'Hủy / trả', 'Tổng', 'Tỷ lệ hoàn thành']);
    r.labels.forEach((lbl, i) => {
      const soldI = r.orders_sold[i] || 0;
      const cancelledI = r.orders_cancelled[i] || 0;
      const total = soldI + cancelledI;
      const rate = total ? ((soldI / total) * 100).toFixed(1) : '0.0';
      csv += csvRow([lbl, soldI, cancelledI, total, `${rate}%`]);
    });
    csv += csvRow(['Tổng', r.totalOrders, r.totalCancelled, r.totalOrders + r.totalCancelled, `${r.completionRate}%`]);
    csv += '\r\n';
  }

  if (r.wantCategory) {
    csv += csvRow(['DOANH THU THEO DANH MỤC SẢN PHẨM']);
    csv += csvRow(['Danh mục', 'Tỷ trọng']);
    r.cats.forEach((c) => (csv += csvRow([c.label, `${c.value}%`])));
    csv += '\r\n';
  }

  if (r.wantTop) {
    csv += csvRow(['TOP SẢN PHẨM DOANH THU CAO NHẤT']);
    csv += csvRow(['Sản phẩm', 'Đã bán', `Doanh thu (${r.unit})`]);
    r.tops.forEach((p) => (csv += csvRow([p.name, p.qty, p.revenue])));
    csv += '\r\n';
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bao-cao-doanh-thu-${r.period}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportPDF(r) {
  const rowsHtml = (headers, rows) => `
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;

  let sections = '';

  if (r.wantRevenue) {
    const rows = r.labels.map((lbl, i) => {
      const ord = r.orders_sold[i] || 0;
      const avg = ord ? (r.revenue[i] * 1_000_000) / ord : 0;
      return [lbl, ord, `${r.revenue[i].toFixed(1)}tr`, fmtK(avg / 1000)];
    });
    sections += `<h2>Doanh thu theo thời gian</h2>
      ${rowsHtml(['Kỳ', 'Số đơn', 'Doanh thu', 'TB / đơn'], rows)}
      <div class="sum-line"><span>Tổng doanh thu: <b>${r.totalRevenue.toFixed(1)}tr</b></span>
      <span>Phí hoa hồng (5%): <b>${r.commission.toFixed(1)}tr</b></span>
      <span>Thực nhận: <b>${r.netRevenue.toFixed(1)}tr</b></span></div>`;
  }

  if (r.wantOrders) {
    const rows = r.labels.map((lbl, i) => {
      const soldI = r.orders_sold[i] || 0;
      const cancelledI = r.orders_cancelled[i] || 0;
      const total = soldI + cancelledI;
      const rate = total ? ((soldI / total) * 100).toFixed(1) : '0.0';
      return [lbl, soldI, cancelledI, total, `${rate}%`];
    });
    sections += `<h2>Thống kê đơn hàng</h2>
      ${rowsHtml(['Kỳ', 'Đã bán', 'Hủy / trả', 'Tổng', 'Tỷ lệ hoàn thành'], rows)}
      <div class="sum-line"><span>Tổng đơn đã bán: <b>${r.totalOrders}</b></span>
      <span>Hủy / trả: <b>${r.totalCancelled}</b></span>
      <span>Tỷ lệ hoàn thành: <b>${r.completionRate}%</b></span></div>`;
  }

  if (r.wantCategory) {
    sections += `<h2>Doanh thu theo danh mục sản phẩm</h2>
      ${rowsHtml(['Danh mục', 'Tỷ trọng'], r.cats.map((c) => [c.label, `${c.value}%`]))}`;
  }

  if (r.wantTop) {
    sections += `<h2>Top sản phẩm doanh thu cao nhất</h2>
      ${rowsHtml(['Sản phẩm', 'Đã bán', 'Doanh thu'], r.tops.map((p) => [p.name, p.qty, `${p.revenue}${r.unit}`]))}`;
  }

  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">
    <title>Báo cáo doanh thu & đơn hàng</title>
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
      <h1>Báo cáo doanh thu &amp; đơn hàng — GreenMarket</h1>
      <div class="meta">Khoảng thời gian: ${PERIOD_LABEL[r.period]} · Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</div>
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
