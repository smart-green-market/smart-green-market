import { fmtMoney } from './revenueHelpers';

export default function RevenueTopProducts({ period, revenueStats }) {
  const tops = revenueStats?.top_products || [];

  return (
    <div className="card">
      <div className="ch">
        <div className="ch-left">
          <div className="ch-ico g"><i className="ti ti-trophy" /></div>
          <span className="ch-title">Top sản phẩm doanh thu cao nhất</span>
        </div>
      </div>
      <div className="pl-wrap">
        <div className="plh compact">
          <div className="st-period">Sản phẩm</div>
          <div className="st-num">Đã bán</div>
          <div className="st-num strong">Doanh thu</div>
        </div>
        {tops.map((p) => (
          <div className="plr compact" key={p.name}>
            <div className="st-period">{p.name}</div>
            <div className="st-num">{p.qty}</div>
            <div className="st-num strong">{fmtMoney(p.revenue)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
