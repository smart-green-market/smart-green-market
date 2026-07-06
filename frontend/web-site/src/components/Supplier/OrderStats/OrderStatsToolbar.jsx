import { ORDER_STATS_PERIODS } from './orderStatsConstants';

/**
 * Thanh công cụ trên cùng của trang Thống kê đơn hàng
 * - Chọn kỳ thống kê: ngày / tháng / năm
 * - Nút xuất báo cáo
 */
export default function OrderStatsToolbar({ period, onChangePeriod, onExport }) {
  return (
    <div className="toolbar">
      <div className="chip-group">
        {ORDER_STATS_PERIODS.map((p) => (
          <div
            key={p.key}
            className={`chip${period === p.key ? ' on' : ''}`}
            onClick={() => onChangePeriod(p.key)}
          >
            {p.label}
          </div>
        ))}
      </div>
      <button className="btn-ghost" onClick={onExport}>
        <i className="ti ti-download" />
        Xuất báo cáo
      </button>
    </div>
  );
}
