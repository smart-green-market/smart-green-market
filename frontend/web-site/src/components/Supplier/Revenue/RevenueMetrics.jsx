import { computeRevenueMetrics, fmtMillion, fmtMoney } from './revenueHelpers';

export default function RevenueMetrics({ revenueStats }) {
  const {
    totalRevenueVND,
    avgPerOrderVND,
    commissionVND,
    netRevenueVND,
  } = computeRevenueMetrics(revenueStats);

  return (
    <div className="metrics">
      <div className="mc">
        <div className="mc-top">
          <div className="mc-icon g"><i className="ti ti-coin" /></div>
        </div>
        <div className="mc-val">{fmtMoney(totalRevenueVND)}</div>
        <div className="mc-label">Tổng doanh thu</div>
      </div>

      <div className="mc">
        <div className="mc-top">
          <div className="mc-icon b"><i className="ti ti-receipt" /></div>
        </div>
        <div className="mc-val">{fmtMoney(avgPerOrderVND)}</div>
        <div className="mc-label">Trung bình / đơn</div>
      </div>

      <div className="mc">
        <div className="mc-top">
          <div className="mc-icon a"><i className="ti ti-percentage" /></div>
        </div>
        <div className="mc-val">{fmtMoney(commissionVND)}</div>
        <div className="mc-label">Phí hoa hồng sàn (5%)</div>
      </div>

      <div className="mc">
        <div className="mc-top">
          <div className="mc-icon p"><i className="ti ti-wallet" /></div>
        </div>
        <div className="mc-val">{fmtMoney(netRevenueVND)}</div>
        <div className="mc-label">Thực nhận</div>
      </div>
    </div>
  );
}
