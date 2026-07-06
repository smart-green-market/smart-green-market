/**
 * AreaChartSVG — biểu đồ vùng/đường, dùng cho "Doanh thu theo thời gian".
 * Giữ nguyên thuật toán vẽ từ bản HTML gốc, chỉ chuyển sang JSX.
 */
export default function AreaChartSVG({ labels = [], values = [] }) {
  const W = 640;
  const H = 200;
  const padTop = 26;
  const padBottom = 26;
  const padX = 18;

  if (!values.length) return null;

  const max = Math.max(...values, 1) * 1.2;
  const n = values.length;
  const stepX = (W - padX * 2) / Math.max(n - 1, 1);

  const points = values.map((v, i) => [
    padX + i * stepX,
    H - padBottom - (v / max) * (H - padTop - padBottom),
  ]);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${H - padBottom} L${points[0][0].toFixed(1)},${H - padBottom} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
      <line x1={padX} y1={H - padBottom} x2={W - padX} y2={H - padBottom} className="chart-axis" />
      <path d={area} fill="var(--green0)" opacity="0.6" />
      <path d={line} fill="none" stroke="var(--green8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={labels[i] ?? i}>
          <circle
            cx={p[0].toFixed(1)}
            cy={p[1].toFixed(1)}
            r={i === points.length - 1 ? 4.5 : 3}
            fill={i === points.length - 1 ? 'var(--green7)' : 'var(--green8)'}
          >
            <title>{`${labels[i]}: ${values[i]}tr đ`}</title>
          </circle>
          <text x={p[0].toFixed(1)} y={(p[1] - 10).toFixed(1)} textAnchor="middle" className="chart-val">
            {values[i]}
          </text>
          <text x={p[0].toFixed(1)} y={H - 8} textAnchor="middle" className="chart-lbl">
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}
