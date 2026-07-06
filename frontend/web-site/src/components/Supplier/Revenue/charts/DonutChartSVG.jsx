import { sum } from '../revenueHelpers';

/**
 * DonutChartSVG — biểu đồ tròn, dùng cho "Cơ cấu theo trạng thái đơn".
 * segments: [{ label, value, color }]  (color đã resolve ra CSS var/hex)
 */
export default function DonutChartSVG({ segments = [], size = 132, thickness = 20 }) {
  const total = sum(segments.map((s) => s.value)) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let acc = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink: 0 }}>
      {segments.map((s) => {
        const frac = s.value / total;
        const dash = frac * circumference;
        const rotate = (acc / total) * 360 - 90;
        acc += s.value;
        return (
          <circle
            key={s.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash.toFixed(1)} ${(circumference - dash).toFixed(1)}`}
            transform={`rotate(${rotate.toFixed(1)} ${cx} ${cy})`}
          >
            <title>{`${s.label}: ${s.value}%`}</title>
          </circle>
        );
      })}
    </svg>
  );
}
