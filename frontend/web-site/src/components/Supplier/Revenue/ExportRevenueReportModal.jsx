import { useState } from 'react';
import ExcelJS from 'exceljs';
import { fmtMoney } from './revenueHelpers';

const FORMATS = [
  { key: 'xlsx', icon: 'ti-file-spreadsheet', label: 'Excel (.xlsx)', hint: 'Định dạng Excel đẹp mắt' },
  { key: 'pdf', icon: 'ti-printer', label: 'In / PDF', hint: 'Bản in trình bày sẵn' },
];

/**
 * Tải file Excel trên trình duyệt
 */
const saveExcelFile = async (workbook, fileName) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor); // Bắt buộc append để hỗ trợ mọi trình duyệt
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

/**
 * Xuất báo cáo Excel từ dữ liệu revenue mới.
 */
async function exportExcel(revenueStats) {
  if (!revenueStats) return;

  const {
    startDate, endDate,
    totalCashIn, totalRefund, netCashFlow,
    grossRevenue, returnedAmount, netRevenue,
    chartData = [],
  } = revenueStats;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Doanh thu & Dòng tiền");

    // 1. Tiêu đề chính
    const titleRow = worksheet.addRow(["BÁO CÁO DOANH THU & DÒNG TIỀN"]);
    worksheet.mergeCells("A1:H1");
    titleRow.height = 35;
    const titleCell = titleRow.getCell(1);
    titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FF064E3B" } }; // Dark Emerald
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    // 2. Thông tin phụ
    const infoRow = worksheet.addRow([`Từ ngày: ${startDate}  đến ngày: ${endDate} | Ngày xuất: ${new Date().toLocaleDateString("vi-VN")} | GreenMarket`]);
    worksheet.mergeCells("A2:H2");
    infoRow.height = 20;
    const infoCell = infoRow.getCell(1);
    infoCell.font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "FF6B7280" } };
    infoCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.addRow([]); // Dòng trống

    // 3. Section 1: KPI Dòng Tiền & Doanh Thu
    const kpiHeaderRow = worksheet.addRow(["DÒNG TIỀN", "", "", "DOANH THU", "", ""]);
    worksheet.mergeCells("A4:C4");
    worksheet.mergeCells("D4:F4");
    kpiHeaderRow.height = 24;

    kpiHeaderRow.getCell(1).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    kpiHeaderRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF185FA5" } }; // Blue header
    kpiHeaderRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    kpiHeaderRow.getCell(4).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    kpiHeaderRow.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF534AB7" } }; // Purple header
    kpiHeaderRow.getCell(4).alignment = { horizontal: "center", vertical: "middle" };

    const labelRow = worksheet.addRow([
      "Tổng Tiền Vào", "Tổng Tiền Hoàn", "Dòng Tiền Ròng",
      "Doanh Thu Gộp", "Hàng Bị Trả Lại", "Doanh Thu Thuần"
    ]);
    labelRow.height = 20;
    labelRow.eachCell((cell) => {
      cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF565F6B" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
    });

    const valueRow = worksheet.addRow([
      totalCashIn, totalRefund, netCashFlow,
      grossRevenue, returnedAmount, netRevenue
    ]);
    valueRow.height = 28;
    valueRow.eachCell((cell, colNum) => {
      cell.font = { name: "Segoe UI", size: 12, bold: true };
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.numFmt = `#,##0"đ"`;

      if (colNum === 3) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F1FB" } };
        cell.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FF185FA5" } };
      } else if (colNum === 6) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEEDFE" } };
        cell.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FF534AB7" } };
      }
    });

    // Borders cho KPI card
    for (let r = 4; r <= 6; r++) {
      const row = worksheet.getRow(r);
      for (let c = 1; c <= 6; c++) {
        row.getCell(c).border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } }
        };
      }
    }

    worksheet.addRow([]); // Dòng trống
    worksheet.addRow([]); // Dòng trống

    // 4. Section 2: Chi tiết theo kỳ
    const tableTitleRow = worksheet.addRow(["CHI TIẾT THEO KỲ THỐNG KÊ"]);
    worksheet.mergeCells("A9:H9");
    tableTitleRow.height = 24;
    tableTitleRow.getCell(1).font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FF111827" } };
    tableTitleRow.getCell(1).alignment = { vertical: "middle" };

    const tableHeaders = [
      "Kỳ", "Tiền Vào (trđ)", "Tiền Hoàn (trđ)", "Dòng Tiền Ròng (trđ)",
      "DT Gộp (trđ)", "Hàng Trả (trđ)", "DT Thuần (trđ)", "Số đơn"
    ];
    const tableHeaderRow = worksheet.addRow(tableHeaders);
    tableHeaderRow.height = 26;
    tableHeaderRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F3D20" } }; // Emerald
      cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // Điền bảng data
    chartData.forEach((d, index) => {
      const rowData = [
        d.label,
        d.cashIn,
        d.refund,
        d.netCashFlow,
        d.grossRevenue,
        d.returnedAmount,
        d.netRevenue,
        d.orderCount
      ];
      const dataRow = worksheet.addRow(rowData);
      dataRow.height = 22;

      if (index % 2 === 1) {
        dataRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
        });
      }

      dataRow.eachCell((cell, colNum) => {
        cell.font = { name: "Segoe UI", size: 10 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } }
        };

        if (colNum === 1) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else if (colNum === 8) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = `#,##0`;
        } else {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = `#,##0.0`;
        }
      });
    });

    // Auto width
    worksheet.columns.forEach((column) => {
      let maxLength = 12;
      column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        if (rowNumber < 10) return;
        const valStr = cell.value ? String(cell.value) : "";
        if (valStr.length > maxLength) {
          maxLength = valStr.length;
        }
      });
      column.width = Math.min(maxLength + 6, 25);
    });

    await saveExcelFile(workbook, `Bao_Cao_Doanh_Thu_${startDate}_to_${endDate}.xlsx`);
  } catch (err) {
    console.error("Lỗi xuất file Excel:", err);
    alert("Không thể xuất file Excel. Vui lòng thử lại sau.");
  }
}

/**
 * Xuất báo cáo PDF (print).
 */
function exportPDF(revenueStats) {
  if (!revenueStats) return;

  const {
    startDate, endDate,
    totalCashIn, totalRefund, netCashFlow,
    grossRevenue, returnedAmount, netRevenue,
    chartData = [],
  } = revenueStats;

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Báo cáo Doanh thu</title>
      <style>
        body { font-family: system-ui, sans-serif; font-size: 13px; color: #111; padding: 24px; }
        h1 { font-size: 18px; margin-bottom: 4px; color: #1a5c2a; }
        .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
        h2 { font-size: 14px; margin: 18px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        .kpi-row { display: flex; gap: 16px; margin-bottom: 8px; }
        .kpi { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
        .kpi-label { font-size: 10px; color: #888; text-transform: uppercase; }
        .kpi-val { font-size: 16px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th, td { padding: 6px 8px; border: 1px solid #ddd; text-align: right; }
        th { background: #f5f5f5; text-align: center; font-weight: 600; }
        td:first-child { text-align: left; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>Báo cáo Doanh thu & Dòng tiền — GreenMarket</h1>
      <div class="subtitle">Từ ${startDate} đến ${endDate}</div>

      <h2>Dòng Tiền</h2>
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-label">Tổng Tiền Vào</div><div class="kpi-val">${fmtMoney(totalCashIn)}</div></div>
        <div class="kpi"><div class="kpi-label">Tổng Tiền Hoàn</div><div class="kpi-val">${fmtMoney(totalRefund)}</div></div>
        <div class="kpi"><div class="kpi-label">Dòng Tiền Ròng</div><div class="kpi-val">${fmtMoney(netCashFlow)}</div></div>
      </div>

      <h2>Doanh Thu</h2>
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-label">Doanh Thu Gộp</div><div class="kpi-val">${fmtMoney(grossRevenue)}</div></div>
        <div class="kpi"><div class="kpi-label">Hàng Bị Trả Lại</div><div class="kpi-val">${fmtMoney(returnedAmount)}</div></div>
        <div class="kpi"><div class="kpi-label">Doanh Thu Thuần</div><div class="kpi-val">${fmtMoney(netRevenue)}</div></div>
      </div>

      ${chartData.length ? `
        <h2>Chi tiết theo kỳ</h2>
        <table>
          <thead>
            <tr>
              <th>Kỳ</th>
              <th>Tiền Vào (trđ)</th>
              <th>Tiền Hoàn (trđ)</th>
              <th>DT Ròng (trđ)</th>
              <th>DT Gộp (trđ)</th>
              <th>Hàng Trả (trđ)</th>
              <th>DT Thuần (trđ)</th>
              <th>Số đơn</th>
            </tr>
          </thead>
          <tbody>
            ${chartData.map(d => `
              <tr>
                <td>${d.label}</td>
                <td>${d.cashIn}</td>
                <td>${d.refund}</td>
                <td>${d.netCashFlow}</td>
                <td>${d.grossRevenue}</td>
                <td>${d.returnedAmount}</td>
                <td>${d.netRevenue}</td>
                <td>${d.orderCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Trình duyệt chặn mở cửa sổ mới. Vui lòng cho phép cửa sổ bật lên để xem bản in.');
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

export default function ExportRevenueReportModal({ open, revenueStats, onClose }) {
  const [format, setFormat] = useState('xlsx');

  if (!open) return null;

  const handleConfirm = () => {
    if (!revenueStats) {
      alert('Chưa có dữ liệu để xuất báo cáo.');
      return;
    }
    if (format === 'xlsx') exportExcel(revenueStats);
    else exportPDF(revenueStats);
    onClose();
  };

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-head">
          <div className="notif-ico" style={{ background: 'var(--green0)', color: 'var(--green8)' }}>
            <i className="ti ti-file-spreadsheet" />
          </div>
          <div className="modal-head-text">
            <div className="modal-title">Xuất báo cáo doanh thu & dòng tiền</div>
            <div className="modal-time">Tổng hợp dữ liệu để lưu trữ hoặc chia sẻ</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div className="modal-body">
          <div className="exp-group">
            <div className="exp-label">Khoảng thời gian</div>
            <div className="exp-chips">
              <div className="chip on">
                {revenueStats?.startDate ?? '—'} → {revenueStats?.endDate ?? '—'}
              </div>
            </div>
          </div>

          <div className="exp-group">
            <div className="exp-label">Định dạng xuất</div>
            <div className="exp-fmt">
              {FORMATS.map((f) => (
                <div
                  key={f.key}
                  className={`exp-fmt-opt${format === f.key ? ' on' : ''}`}
                  onClick={() => setFormat(f.key)}
                >
                  <i className={`ti ${f.icon}`} />
                  <span>{f.label}</span>
                  <small>{f.hint}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="exp-hint">
            <i className="ti ti-info-circle" />
            <span>Báo cáo dùng dữ liệu đang hiển thị trên hệ thống, tương ứng với khoảng thời gian đã chọn.</span>
          </div>
        </div>

        <div className="modal-foot">
          <button className="rev-btn-export" onClick={onClose}>Hủy</button>
          <button className="rev-btn-apply" onClick={handleConfirm}>
            <i className="ti ti-download" />
            Xuất báo cáo
          </button>
        </div>
      </div>
    </div>
  );
}
