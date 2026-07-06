import { useState } from 'react';
import { ORDER_STATS_PERIODS } from './orderStatsConstants';
import { buildOrderStatsReport, exportOrderStatsCSV, exportOrderStatsPDF } from './orderStatsExport';

const FORMATS = [
  { key: 'csv', icon: 'ti-table',   label: 'CSV (Excel)', hint: 'Mở bằng Excel/Sheets' },
  { key: 'pdf', icon: 'ti-printer', label: 'In / PDF',    hint: 'Bản in trình bày sẵn' },
];

/**
 * Modal xuất báo cáo thống kê đơn hàng.
 * Props:
 *   open       {boolean}  - hiện / ẩn modal
 *   period     {string}   - 'day' | 'month' | 'year'
 *   data       {object}   - { labels, sold, cancelled }
 *   onClose    {function}
 */
export default function ExportOrderStatsModal({ open, period, data, onClose }) {
  const [wantDetail,  setWantDetail]  = useState(true);
  const [wantSummary, setWantSummary] = useState(true);
  const [format, setFormat]           = useState('csv');

  if (!open) return null;

  const handleConfirm = () => {
    if (!wantDetail && !wantSummary) {
      alert('Vui lòng chọn ít nhất một nội dung để xuất báo cáo.');
      return;
    }
    const report = buildOrderStatsReport(data, period, { wantDetail, wantSummary });
    if (format === 'csv') exportOrderStatsCSV(report);
    else                  exportOrderStatsPDF(report);
    onClose();
  };

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: 440 }}>

        {/* HEAD */}
        <div className="modal-head">
          <div className="notif-ico" style={{ background: 'var(--green0)', color: 'var(--green8)' }}>
            <i className="ti ti-file-spreadsheet" />
          </div>
          <div className="modal-head-text">
            <div className="modal-title">Xuất báo cáo thống kê đơn hàng</div>
            <div className="modal-time">Tổng hợp dữ liệu để lưu trữ hoặc chia sẻ</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body">

          {/* Khoảng thời gian */}
          <div className="exp-group">
            <div className="exp-label">Khoảng thời gian</div>
            <div className="exp-chips">
              <div className="chip on">
                {{ day: 'Theo ngày', month: 'Theo tháng', year: 'Theo năm' }[period]}
              </div>
            </div>
          </div>

          {/* Nội dung báo cáo */}
          <div className="exp-group">
            <div className="exp-label">Nội dung báo cáo</div>
            <label className="exp-opt">
              <input
                type="checkbox"
                checked={wantDetail}
                onChange={(e) => setWantDetail(e.target.checked)}
              />
              <span>Chi tiết theo kỳ (đã bán, hủy / trả, tỷ lệ hoàn thành)</span>
            </label>
            <label className="exp-opt">
              <input
                type="checkbox"
                checked={wantSummary}
                onChange={(e) => setWantSummary(e.target.checked)}
              />
              <span>Tổng hợp (tổng đơn, tỷ lệ, trung bình / kỳ)</span>
            </label>
          </div>

          {/* Định dạng xuất */}
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

          {/* Ghi chú */}
          <div className="exp-hint">
            <i className="ti ti-info-circle" />
            <span>Báo cáo dùng dữ liệu đang hiển thị trên hệ thống, tương ứng với khoảng thời gian đã chọn.</span>
          </div>
        </div>

        {/* FOOT */}
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
