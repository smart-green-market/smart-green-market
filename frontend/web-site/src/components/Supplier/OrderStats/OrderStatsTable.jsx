import { growthBadge } from './orderStatsHelpers';

/**
 * Card bảng "Danh sách thống kê đơn hàng" — chi tiết từng kỳ
 */
export default function OrderStatsTable({ data }) {
  if (!data) return null;
  const { labels, sold, cancelled } = data;

  return (
    <div className="card">
      <div className="ch">
        <div className="ch-left">
          <div className="ch-ico a"><i className="ti ti-list-details" /></div>
          <span className="ch-title">Danh sách thống kê đơn hàng</span>
        </div>
        <span className="ch-link">{labels.length} kỳ</span>
      </div>
      <div className="pl-wrap">
        <div className="plh">
          <div className="st-period">Kỳ</div>
          <div className="st-num">Đã bán</div>
          <div className="st-num">Hủy / trả</div>
          <div className="st-num strong">Tổng</div>
          <div className="st-growth">Tăng trưởng</div>
        </div>
        <div>
          {labels.map((lbl, i) => {
            const g = growthBadge(sold[i], sold[i - 1]);
            const total = sold[i] + cancelled[i];
            return (
              <div className="plr" key={lbl}>
                <div className="st-period">{lbl}</div>
                <div className="st-num">{sold[i]}</div>
                <div className="st-num">{cancelled[i]}</div>
                <div className="st-num strong">{total}</div>
                <div className="st-growth"><span className={g.className}>{g.text}</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
