import { PERIOD_UNIT } from './orderStatsConstants';

/**
 * 4 thẻ chỉ số tổng hợp: tổng đơn bán, tỷ lệ hoàn thành, đơn hủy/trả, TB đơn/kỳ
 */
export default function OrderStatsMetrics({ period, summary }) {
  if (!summary) return null;
  const { totalSold, completionRate, totalCancelled, avgPerPeriod } = summary;

  return (
    <div className="metrics">
      <div className="mc">
        <div className="mc-top">
          <div className="mc-icon b"><i className="ti ti-clipboard-list" /></div>
        </div>
        <div className="mc-val">{totalSold}</div>
        <div className="mc-label">Tổng đơn đã bán</div>
      </div>

      <div className="mc">
        <div className="mc-top">
          <div className="mc-icon g"><i className="ti ti-circle-check" /></div>
        </div>
        <div className="mc-val">{completionRate}%</div>
        <div className="mc-label">Tỷ lệ hoàn thành</div>
      </div>

      <div className="mc">
        <div className="mc-top">
          <div className="mc-icon a"><i className="ti ti-rotate" /></div>
        </div>
        <div className="mc-val">{totalCancelled}</div>
        <div className="mc-label">Đơn hủy / trả hàng</div>
      </div>

      <div className="mc">
        <div className="mc-top">
          <div className="mc-icon p"><i className="ti ti-chart-bar" /></div>
        </div>
        <div className="mc-val">{avgPerPeriod}</div>
        <div className="mc-label">TB đơn / {PERIOD_UNIT[period]}</div>
      </div>
    </div>
  );
}
