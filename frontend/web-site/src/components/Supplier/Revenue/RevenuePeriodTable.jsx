import { fmtMillion, fmtMoney, growthBadge } from './revenueHelpers';

export default function RevenuePeriodTable({ revenueStats }) {
  const { labels = [], revenue = [], orders_sold = [] } = revenueStats || {};

  return (
    <div className="card">
      <div className="ch">
        <div className="ch-left">
          <div className="ch-ico b"><i className="ti ti-list-details" /></div>
          <span className="ch-title">Danh sách doanh thu theo kỳ</span>
        </div>
        <span className="ch-link">{labels.length} kỳ</span>
      </div>

      <div className="pl-wrap">
        <div className="plh">
          <div className="st-period">Kỳ</div>
          <div className="st-num">Số đơn</div>
          <div className="st-num strong">Doanh thu</div>
          <div className="st-num">TB / đơn</div>
          <div className="st-growth">Tăng trưởng</div>
        </div>

        {labels.map((lbl, i) => {
          const g = growthBadge(revenue[i], revenue[i - 1]);
          const ord = orders_sold[i] || 0;
          // revenue[i] là triệu đồng → nhân lại để tính avg
          const avgVND = ord ? (revenue[i] * 1_000_000) / ord : 0;
          return (
            <div className="plr" key={lbl}>
              <div className="st-period">{lbl}</div>
              <div className="st-num">{ord}</div>
              <div className="st-num strong">{fmtMillion(revenue[i])}</div>
              <div className="st-num">{fmtMoney(avgVND)}</div>
              <div className="st-growth">
                <span className={g.cls}>{g.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
