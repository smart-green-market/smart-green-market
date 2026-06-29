// ─── FORMAT HELPERS ──────────────────────────────────────────────────────────
export const fmtPrice = (n) => {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return isNaN(num) ? "—" : num.toLocaleString("vi-VN") + "₫";
};

export const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export const fmtDateShort = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

// ─── API ERROR HELPER ────────────────────────────────────────────────────────
export const getApiErrorMessage = (err, fallback) => {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.detail)  return String(data.detail);
  if (data?.message) return String(data.message);
  if (data && typeof data === "object") {
    const key = Object.keys(data)[0];
    if (key) {
      const val = data[key];
      return Array.isArray(val) ? String(val[0]) : String(val);
    }
  }
  return fallback;
};

// ─── PRINT HELPER ────────────────────────────────────────────────────────────
const STATUS_LABEL_PRINT = {
  pending_supplier_confirmation: "Chờ xác nhận",
  confirmed:   "Đã xác nhận",
  shipping:    "Đang giao hàng",
  completed:   "Hoàn thành",
};

export const buildPrintHtml = ({ order, supplier }) => {
  const printTotal = order.items.reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
  const depPct = order.deposit_percent ? parseFloat(order.deposit_percent) : null;
  const depAmt = depPct ? Math.round(printTotal * depPct / 100) : null;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>Đơn hàng ${order.order_code}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #166534; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { font-size: 20px; font-weight: 800; color: #166534; }
    .brand small { display: block; font-size: 11px; font-weight: 400; color: #666; margin-top: 2px; }
    .order-code { text-align: right; }
    .order-code h2 { font-size: 15px; font-weight: 700; }
    .order-code .status { display: inline-block; margin-top: 4px; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
    .info-block { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; }
    .info-block .block-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888; margin-bottom: 8px; }
    .info-row { display: flex; flex-direction: column; margin-bottom: 5px; }
    .info-row .lbl { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: .04em; }
    .info-row .val { font-size: 13px; font-weight: 500; color: #111; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #666; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #166534; color: #fff; }
    thead th { padding: 8px 10px; text-align: left; font-size: 12px; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f0fdf4; }
    tbody td { padding: 8px 10px; font-size: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    .tag-approved { display: inline-block; padding: 1px 8px; border-radius: 20px; background: #dcfce7; color: #166534; font-size: 10px; font-weight: 700; }
    .tag-rejected { display: inline-block; padding: 1px 8px; border-radius: 20px; background: #fee2e2; color: #dc2626; font-size: 10px; font-weight: 700; }
    .tag-pending  { display: inline-block; padding: 1px 8px; border-radius: 20px; background: #fef9c3; color: #92400e; font-size: 10px; font-weight: 700; }
    .summary-box { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; max-width: 320px; margin-left: auto; margin-bottom: 24px; }
    .summary-row { display: flex; justify-content: space-between; padding: 7px 14px; font-size: 12px; }
    .summary-row:nth-child(even) { background: #f9fafb; }
    .summary-row.total { background: #166534; color: #fff; font-weight: 700; font-size: 14px; padding: 10px 14px; }
    .summary-row.deposit { background: #dcfce7; color: #166534; font-weight: 700; }
    .note-box { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; font-size: 12px; color: #78350f; margin-bottom: 18px; }
    .footer { border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: #999; }
    .sig-row { display: flex; justify-content: space-between; margin-top: 32px; }
    .sig-box { text-align: center; width: 200px; }
    .sig-box .sig-title { font-size: 12px; font-weight: 700; margin-bottom: 48px; }
    .sig-box .sig-line { border-top: 1px solid #ccc; padding-top: 6px; font-size: 11px; color: #999; }
    @media print { body { padding: 16px 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">🌿 Smart Green Market<small>Phiếu xác nhận đơn hàng</small></div>
    <div class="order-code">
      <h2>#${order.order_code}</h2>
      <span class="status">${STATUS_LABEL_PRINT[order.status] ?? order.status}</span><br/>
      <small style="color:#888">Ngày đặt: ${fmtDate(order.created_at)}</small>
    </div>
  </div>

  <div class="two-col">
    <div class="info-block">
      <div class="block-title">👤 Thông tin Đại lý</div>
      <div class="info-row"><span class="lbl">Người nhận</span><span class="val">${order.receiver_name}</span></div>
      <div class="info-row"><span class="lbl">Điện thoại</span><span class="val">${order.receiver_phone}</span></div>
      <div class="info-row"><span class="lbl">Địa chỉ giao</span><span class="val">${order.delivery_address}</span></div>
      <div class="info-row"><span class="lbl">Ngày giao dự kiến</span><span class="val">${fmtDateShort(order.requested_delivery_time)}</span></div>
    </div>
    <div class="info-block">
      <div class="block-title">🏪 Thông tin Nhà cung cấp</div>
      <div class="info-row"><span class="lbl">Nhà cung cấp</span><span class="val" style="font-weight:700">${order.supplier_name}</span></div>
      ${order.supplier_bank && supplier?.[0] ? `
      <div class="info-row"><span class="lbl">Người đại diện</span><span class="val">${supplier[0].account_name}</span></div>
      <div class="info-row"><span class="lbl">Số điện thoại</span><span class="val">${supplier[0].phone}</span></div>
      <div class="info-row"><span class="lbl">Địa chỉ</span><span class="val">${supplier[0].address}</span></div>
      ` : ""}
    </div>
  </div>

  ${order.note ? `<div class="note-box">📝 Ghi chú: ${order.note}</div>` : ""}

  <div class="section-title">Danh sách sản phẩm</div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Sản phẩm</th><th>Đơn vị</th>
        <th style="text-align:right">Số lượng</th>
        <th style="text-align:right">Đơn giá</th>
        <th style="text-align:right">Thành tiền</th>
        <th style="text-align:center">Trạng thái</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((item, i) => `
      <tr>
        <td style="color:#999">${i + 1}</td>
        <td><strong>${item.product_name}</strong>${item.note ? `<br/><small style="color:#999">${item.note}</small>` : ""}</td>
        <td>${item.product_unit}</td>
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">${fmtPrice(item.unit_price)}</td>
        <td style="text-align:right;font-weight:700">${fmtPrice(item.subtotal)}</td>
        <td style="text-align:center">
          ${item.item_status === "approved"
            ? '<span class="tag-approved">✓ Duyệt</span>'
            : item.item_status === "rejected"
            ? `<span class="tag-rejected">✗ Từ chối</span>${item.reject_reason ? `<br/><small style="color:#dc2626;font-size:10px">${item.reject_reason}</small>` : ""}`
            : '<span class="tag-pending">Chờ duyệt</span>'}
        </td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div class="summary-box">
    <div class="summary-row"><span>Tạm tính (${order.items.length} sản phẩm)</span><span>${fmtPrice(printTotal)}</span></div>
    ${depPct ? `<div class="summary-row deposit"><span>Tiền cọc (${depPct}%)</span><span>${fmtPrice(depAmt)}</span></div>` : ""}
    ${order.paid_amount ? `<div class="summary-row"><span>Đã thanh toán</span><span style="color:#166534;font-weight:700">${fmtPrice(order.paid_amount)}</span></div>` : ""}
    ${order.debt_amount ? `<div class="summary-row"><span>Còn lại</span><span style="color:#dc2626;font-weight:700">${fmtPrice(order.debt_amount)}</span></div>` : ""}
    <div class="summary-row total"><span>Tổng đơn hàng</span><span>${fmtPrice(printTotal)}</span></div>
  </div>

  <div class="sig-row">
    <div class="sig-box"><div class="sig-title">Người mua</div><div class="sig-line">${order.receiver_name}</div></div>
    <div class="sig-box"><div class="sig-title">Nhà cung cấp</div><div class="sig-line">${order.supplier_name}</div></div>
  </div>

  <div class="footer">
    <span>Mã đơn: #${order.order_code}</span>
    <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
  </div>
</body>
</html>`;
};
