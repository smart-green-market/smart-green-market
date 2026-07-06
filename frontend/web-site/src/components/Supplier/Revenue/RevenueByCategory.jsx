import { resolveColor } from './revenueHelpers';

export default function RevenueByCategory({ revenueStats }) {
  const cats = revenueStats?.by_category || [];

  return (
    <div className="card">
      <div className="ch">
        <div className="ch-left">
          <div className="ch-ico a"><i className="ti ti-category-2" /></div>
          <span className="ch-title">Doanh thu theo danh mục sản phẩm</span>
        </div>
      </div>
      <div className="cb">
        {cats.map((c) => {
          const color = resolveColor(c.color_key);
          return (
            <div className="pr" key={c.label}>
              <span className="pr-name">{c.label}</span>
              <div className="pr-track">
                <div className="pr-fill" style={{ width: `${c.value}%`, background: color }} />
              </div>
              <span className="pr-pct">{c.value}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
