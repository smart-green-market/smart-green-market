import { PERIOD_LABEL } from './orderStatsConstants';

/**
 * Card biểu đồ cột nhóm 2 series: "Đã bán" (xanh) và "Hủy / trả" (đỏ)
 */
export default function OrderStatsChart({ period, data }) {
  if (!data) return null;
  const { labels, sold, cancelled } = data;

  const W = 640;
  const H = 200;
  const padTop = 26;
  const padBottom = 26;
  const padX = 10;
  const gap = 14;
  const barGap = 3;

  const max = Math.max(...sold, ...cancelled, 1) * 1.2;
  const n = labels.length;
  const groupW = (W - padX * 2 - gap * (n - 1)) / n;
  const barW = (groupW - barGap) / 2;

  return (
    <div className="card">
      <div className="ch">
        <div className="ch-left">
          <div className="ch-ico b"><i className="ti ti-chart-bar" /></div>
          <span className="ch-title">Số đơn hàng đã bán</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="chart-legend">
            <span className="legend-chip"><i style={{ background: 'var(--green8)' }} />Đã bán</span>
            <span className="legend-chip"><i style={{ background: 'var(--red8)' }} />Hủy / trả</span>
          </div>
          <span className="ch-link">{PERIOD_LABEL[period]}</span>
        </div>
      </div>

      <div className="chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
          <line x1={padX} y1={H - padBottom} x2={W - padX} y2={H - padBottom} className="chart-axis" />
          {labels.map((lbl, i) => {
            const gx = padX + i * (groupW + gap);
            const hA = (sold[i] / max) * (H - padTop - padBottom);
            const hB = (cancelled[i] / max) * (H - padTop - padBottom);
            const yA = H - padBottom - hA;
            const yB = H - padBottom - hB;
            return (
              <g key={lbl}>
                <rect
                  x={gx.toFixed(1)} y={yA.toFixed(1)}
                  width={barW.toFixed(1)} height={hA.toFixed(1)}
                  rx="3" fill="var(--green8)"
                >
                  <title>{lbl} — Đã bán: {sold[i]}</title>
                </rect>
                <rect
                  x={(gx + barW + barGap).toFixed(1)} y={yB.toFixed(1)}
                  width={barW.toFixed(1)} height={Math.max(hB, 1.5).toFixed(1)}
                  rx="3" fill="var(--red8)"
                >
                  <title>{lbl} — Hủy/trả: {cancelled[i]}</title>
                </rect>
                <text
                  x={(gx + groupW / 2).toFixed(1)} y={(Math.min(yA, yB) - 7).toFixed(1)}
                  textAnchor="middle" className="chart-val"
                >
                  {sold[i]}
                </text>
                <text x={(gx + groupW / 2).toFixed(1)} y={H - 8} textAnchor="middle" className="chart-lbl">
                  {lbl}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
