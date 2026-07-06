/**
 * Vẽ svg donut chart từ danh sách segment { label, value, color }
 */
function buildDonutArcs(segments, size = 132, thickness = 20) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let acc = 0;

  return segments.map((s) => {
    const frac = s.value / total;
    const dash = frac * circumference;
    const rotate = (acc / total) * 360 - 90;
    acc += s.value;
    return { ...s, r, cx, cy, dash, circumference, rotate };
  });
}

/**
 * Card "Tỷ lệ hoàn thành / hủy" — donut chart + chú thích
 */
export default function OrderStatsDonut({ summary }) {
  if (!summary) return null;
  const { totalSold, totalCancelled, completionRate } = summary;

  const segments = [
    { label: 'Hoàn thành', value: totalSold, color: 'var(--green8)' },
    { label: 'Hủy / trả', value: totalCancelled, color: 'var(--red8)' },
  ];
  const arcs = buildDonutArcs(segments);
  const size = 132;

  return (
    <div className="card">
      <div className="ch">
        <div className="ch-left">
          <div className="ch-ico p"><i className="ti ti-chart-donut-3" /></div>
          <span className="ch-title">Tỷ lệ hoàn thành / hủy</span>
        </div>
      </div>
      <div className="donut-wrap">
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink: 0 }}>
          {arcs.map((s) => (
            <circle
              key={s.label}
              cx={s.cx} cy={s.cy} r={s.r} fill="none" stroke={s.color} strokeWidth={20}
              strokeDasharray={`${s.dash.toFixed(1)} ${(s.circumference - s.dash).toFixed(1)}`}
              transform={`rotate(${s.rotate.toFixed(1)} ${s.cx} ${s.cy})`}
            >
              <title>{s.label}: {s.value}</title>
            </circle>
          ))}
        </svg>
        <div className="donut-legend">
          <div className="legend-row">
            <span className="legend-dot" style={{ background: 'var(--green8)' }} />
            <span className="legend-name">Đã bán thành công</span>
            <span className="legend-val">{totalSold}</span>
          </div>
          <div className="legend-row">
            <span className="legend-dot" style={{ background: 'var(--red8)' }} />
            <span className="legend-name">Hủy / trả hàng</span>
            <span className="legend-val">{totalCancelled}</span>
          </div>
          <div className="legend-row">
            <span className="legend-dot" style={{ background: 'transparent' }} />
            <span className="legend-name">Tỷ lệ hoàn thành</span>
            <span className="legend-val">{completionRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
