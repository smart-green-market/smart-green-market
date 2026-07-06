import DonutChartSVG from './charts/DonutChartSVG';
import { resolveColor } from './revenueHelpers';

export default function RevenueStatusBreakdown({ revenueStats }) {
  const raw = revenueStats?.status_breakdown || [];
  const segments = raw.map((s) => ({ ...s, color: resolveColor(s.color_key) }));

  return (
    <div className="card">
      <div className="ch">
        <div className="ch-left">
          <div className="ch-ico p"><i className="ti ti-chart-pie" /></div>
          <span className="ch-title">Cơ cấu theo trạng thái đơn</span>
        </div>
      </div>

      <div className="donut-wrap">
        <DonutChartSVG segments={segments} />
        <div className="donut-legend">
          {segments.map((s) => (
            <div className="legend-row" key={s.label}>
              <span className="legend-dot" style={{ background: s.color }} />
              <span className="legend-name">{s.label}</span>
              <span className="legend-val">{s.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
