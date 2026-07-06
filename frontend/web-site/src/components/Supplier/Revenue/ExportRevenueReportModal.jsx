import { useState } from 'react';
import { buildReportSections, exportCSV, exportPDF } from './revenueExport';

const FORMATS = [
  { key: 'csv', icon: 'ti-table', label: 'CSV (Excel)', hint: 'Mở bằng Excel/Sheets' },
  { key: 'pdf', icon: 'ti-printer', label: 'In / PDF', hint: 'Bản in trình bày sẵn' },
];

export default function ExportRevenueReportModal({ open, period, revenueStats, onClose }) {
  const [wantRevenue, setWantRevenue] = useState(true);
  const [wantOrders, setWantOrders] = useState(true);
  const [wantCategory, setWantCategory] = useState(true);
  const [wantTop, setWantTop] = useState(true);
  const [format, setFormat] = useState('csv');

  if (!open) return null;

  const handleConfirm = () => {
    if (!wantRevenue && !wantOrders && !wantCategory && !wantTop) {
      alert('Vui lòng chọn ít nhất một nội dung để xuất báo cáo.');
      return;
    }
    const report = buildReportSections(revenueStats, period, {
      wantRevenue,
      wantOrders,
      wantCategory,
      wantTop,
    });
    if (format === 'csv') exportCSV(report);
    else exportPDF(report);
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
            <div className="modal-title">Xuất báo cáo doanh thu &amp; đơn hàng</div>
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
              <div className="chip on">{{ day: 'Theo ngày', month: 'Theo tháng', year: 'Theo năm' }[period]}</div>
            </div>
          </div>

          <div className="exp-group">
            <div className="exp-label">Nội dung báo cáo</div>
            <label className="exp-opt">
              <input type="checkbox" checked={wantRevenue} onChange={(e) => setWantRevenue(e.target.checked)} />
              <span>Doanh thu theo thời gian (tổng, TB/đơn, hoa hồng, thực nhận)</span>
            </label>
            <label className="exp-opt">
              <input type="checkbox" checked={wantOrders} onChange={(e) => setWantOrders(e.target.checked)} />
              <span>Thống kê đơn hàng (đã bán, hủy/trả, tỷ lệ hoàn thành)</span>
            </label>
            <label className="exp-opt">
              <input type="checkbox" checked={wantCategory} onChange={(e) => setWantCategory(e.target.checked)} />
              <span>Doanh thu theo danh mục sản phẩm</span>
            </label>
            <label className="exp-opt">
              <input type="checkbox" checked={wantTop} onChange={(e) => setWantTop(e.target.checked)} />
              <span>Top sản phẩm doanh thu cao nhất</span>
            </label>
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
            <span>Báo cáo dùng dữ liệu đang hiển thị trên hệ thống, tương ứng với khoảng thời gian đã chọn ở trên.</span>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn-primary" onClick={handleConfirm}>
            <i className="ti ti-download" />
            Xuất báo cáo
          </button>
        </div>
      </div>
    </div>
  );
}
