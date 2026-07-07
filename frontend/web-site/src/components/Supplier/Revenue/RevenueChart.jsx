import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

/**
 * Custom Tooltip hiển thị đẹp khi hover vào bar.
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rev-chart-tooltip">
      <div className="rev-chart-tooltip-label">{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="rev-chart-tooltip-row">
          <span
            className="rev-chart-tooltip-dot"
            style={{ background: entry.color }}
          />
          <span className="rev-chart-tooltip-name">{entry.name}</span>
          <span className="rev-chart-tooltip-value">{entry.value}tr</span>
        </div>
      ))}
    </div>
  );
}

/**
 * RevenueChart — Grouped Bar Chart so sánh Dòng Tiền Ròng vs Doanh Thu Thuần.
 */
export default function RevenueChart({ chartData = [] }) {
  if (!chartData.length) {
    return (
      <div className="rev-chart-card">
        <div className="rev-chart-header">
          <div className="rev-chart-header-left">
            <div className="rev-chart-icon">
              <i className="ti ti-chart-bar" />
            </div>
            <span className="rev-chart-title">Biểu đồ so sánh Dòng Tiền Ròng & Doanh Thu Thuần</span>
          </div>
        </div>
        <div className="rev-chart-empty">
          <i className="ti ti-chart-bar-off" />
          <span>Không có dữ liệu trong khoảng thời gian đã chọn</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rev-chart-card">
      <div className="rev-chart-header">
        <div className="rev-chart-header-left">
          <div className="rev-chart-icon">
            <i className="ti ti-chart-bar" />
          </div>
          <span className="rev-chart-title">Biểu đồ so sánh Dòng Tiền Ròng & Doanh Thu Thuần</span>
        </div>
        <span className="rev-chart-subtitle">{chartData.length} kỳ</span>
      </div>

      <div className="rev-chart-body">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            barCategoryGap="20%"
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#80899a' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#80899a' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}tr`}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: '#565f6b', paddingTop: 8 }}
            />
            <Bar
              dataKey="netCashFlow"
              name="Dòng Tiền Ròng"
              fill="#1a5c2a"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="netRevenue"
              name="Doanh Thu Thuần"
              fill="#185FA5"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
