import AreaChartSVG from './charts/AreaChartSVG';
import { PERIOD_LABEL } from './revenueHelpers';

export default function RevenueTimeChart({ period, revenueStats }) {
  const { labels = [], revenue = [] } = revenueStats || {};

  return (
    <div className="card">
      <div className="ch">
        <div className="ch-left">
          <div className="ch-ico g"><i className="ti ti-chart-area-line" /></div>
          <span className="ch-title">Doanh thu theo thời gian</span>
        </div>
        <span className="ch-link">{PERIOD_LABEL[period]}</span>
      </div>
      <div className="chart-wrap">
        <AreaChartSVG labels={labels} values={revenue} />
      </div>
    </div>
  );
}
