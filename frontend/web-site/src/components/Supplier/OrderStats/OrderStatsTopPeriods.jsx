import { getTopPeriods } from './orderStatsHelpers';

/**
 * Card "Top kỳ bán chạy nhất" — top 5 kỳ có số đơn bán ra cao nhất
 */
export default function OrderStatsTopPeriods({ data }) {
  if (!data) return null;
  const topPeriods = getTopPeriods(data, 5);
  const topMax = Math.max(...topPeriods.map((t) => t.sold), 1);

  return (
    <div className="card">
      <div className="ch">
        <div className="ch-left">
          <div className="ch-ico g"><i className="ti ti-trophy" /></div>
          <span className="ch-title">Top kỳ bán chạy nhất</span>
        </div>
      </div>
      <div className="cb">
        {topPeriods.map((t) => (
          <div className="pr" key={t.label}>
            <span className="pr-name">{t.label}</span>
            <div className="pr-track">
              <div className="pr-fill" style={{ width: `${((t.sold / topMax) * 100).toFixed(0)}%` }} />
            </div>
            <span className="pr-pct">{t.sold}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
