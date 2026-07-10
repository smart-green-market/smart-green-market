import { useMemo, useState } from "react";
import { formatCurrency, formatCurrencyShort } from "../../../utils/adminStatisticsUtils";

export default function StatisticsChart({
    data = [],
    labelKey = "label",
    valueKey = "value",
    valueFormatter = formatCurrencyShort,
    height = 280,
    emptyMessage = "Không có dữ liệu biểu đồ",
    chartType: chartTypeProp,
    onChartTypeChange,
    showChartTypeToggle = true,
    compact = false,
    hideXLabels = false,
    fitContainer = false,
}) {
    const [internalChartType, setInternalChartType] = useState("line");
    const chartType = chartTypeProp ?? internalChartType;
    const setChartType = onChartTypeChange ?? setInternalChartType;
    const isDense = data.length > 6;

    const points = useMemo(() => {
        const paddingLeft = isDense ? 72 : 60;
        const paddingRight = isDense ? 16 : 20;
        const paddingTop = 28;
        const paddingBottom = hideXLabels ? 24 : isDense ? 58 : 40;
        const width = chartType === "bar" && isDense && !fitContainer ? Math.max(640, data.length * 56) : 600;
        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;
        const maxVal = Math.max(...data.map((item) => Number(item[valueKey] || 0)), 1);

        const mapped = data.map((item, index) => {
            const x =
                chartType === "bar"
                    ? paddingLeft + (index + 0.5) * (chartWidth / Math.max(data.length, 1))
                    : paddingLeft + index * (chartWidth / Math.max(data.length - 1, 1));
            const value = Number(item[valueKey] || 0);
            const y = paddingTop + chartHeight - (value / maxVal) * chartHeight;

            return {
                x,
                y,
                value,
                label: item[labelKey],
                raw: item,
            };
        });

        const linePath = mapped.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
        const areaPath =
            mapped.length > 0
                ? `${linePath} L ${mapped[mapped.length - 1].x} ${paddingTop + chartHeight} L ${mapped[0].x} ${paddingTop + chartHeight} Z`
                : "";

        return {
            width,
            height,
            paddingLeft,
            paddingRight,
            paddingTop,
            paddingBottom,
            chartWidth,
            chartHeight,
            maxVal,
            mapped,
            linePath,
            areaPath,
        };
    }, [chartType, data, fitContainer, height, hideXLabels, isDense, labelKey, valueKey]);

    const [hoveredIndex, setHoveredIndex] = useState(null);

    if (!data.length) {
        return (
            <div
                className={`flex items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 ${
                    compact ? "h-[180px]" : "h-[220px]"
                }`}
            >
                <p className="text-sm text-neutral-400">{emptyMessage}</p>
            </div>
        );
    }

    const {
        width,
        paddingLeft,
        paddingRight,
        paddingTop,
        chartHeight,
        maxVal,
        mapped,
        linePath,
        areaPath,
    } = points;

    const gridLevels = [0, 0.25, 0.5, 0.75, 1];
    const hoveredPoint = hoveredIndex != null ? mapped[hoveredIndex] : null;
    const axisFontSize = isDense ? 8 : 10;
    const labelFontSize = isDense ? 8 : 10;
    const xLabelY = points.paddingTop + points.chartHeight + (isDense ? 14 : 20);

    return (
        <div className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
            {showChartTypeToggle ? (
                <div className="flex justify-end">
                    <div className="flex rounded-xl border border-stone-200/50 bg-stone-100 p-0.5">
                        <button
                            type="button"
                            onClick={() => setChartType("line")}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                chartType === "line"
                                    ? "bg-white text-emerald-800 shadow-sm"
                                    : "text-neutral-500 hover:text-neutral-800"
                            }`}
                        >
                            Đường
                        </button>
                        <button
                            type="button"
                            onClick={() => setChartType("bar")}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                chartType === "bar"
                                    ? "bg-white text-emerald-800 shadow-sm"
                                    : "text-neutral-500 hover:text-neutral-800"
                            }`}
                        >
                            Cột
                        </button>
                    </div>
                </div>
            ) : null}

            <div className={`relative ${isDense && !fitContainer ? "overflow-x-auto pb-1" : ""}`}>
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    width={isDense && !fitContainer ? width : undefined}
                    height={isDense && !fitContainer ? height : undefined}
                    className={
                        isDense && !fitContainer
                            ? "max-w-none select-none"
                            : "h-auto w-full select-none overflow-visible"
                    }
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        <linearGradient id="statsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="statsBarGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#059669" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                    </defs>

                    {gridLevels.map((level, index) => {
                        const y = paddingTop + chartHeight - level * chartHeight;
                        const val = level * maxVal;

                        return (
                            <g key={index}>
                                <line
                                    x1={paddingLeft}
                                    y1={y}
                                    x2={width - paddingRight}
                                    y2={y}
                                    stroke="#f1f5f9"
                                    strokeWidth={1}
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={paddingLeft - 12}
                                    y={y + 3}
                                    textAnchor="end"
                                    fill="#94a3b8"
                                    fontSize={axisFontSize}
                                    className="font-mono font-semibold"
                                >
                                    {valueFormatter(val)}
                                </text>
                            </g>
                        );
                    })}

                    {hideXLabels
                        ? null
                        : mapped.map((point, index) => {
                              const labelY = xLabelY;

                              if (isDense) {
                                  return (
                                      <text
                                          key={`label-${index}`}
                                          x={point.x}
                                          y={labelY}
                                          textAnchor="end"
                                          fill="#64748b"
                                          fontSize={labelFontSize}
                                          className="font-medium"
                                          transform={`rotate(-38, ${point.x}, ${labelY})`}
                                      >
                                          {point.label}
                                      </text>
                                  );
                              }

                              return (
                                  <text
                                      key={`label-${index}`}
                                      x={point.x}
                                      y={labelY}
                                      textAnchor="middle"
                                      fill="#64748b"
                                      fontSize={labelFontSize}
                                      className="font-semibold"
                                  >
                                      {point.label}
                                  </text>
                              );
                          })}

                    {chartType === "line" && areaPath ? (
                        <path d={areaPath} fill="url(#statsAreaGradient)" />
                    ) : null}

                    {chartType === "line" && linePath ? (
                        <path d={linePath} fill="none" stroke="#10b981" strokeWidth={3} strokeLinecap="round" />
                    ) : null}

                    {chartType === "bar"
                        ? mapped.map((point, index) => {
                              const slotWidth = points.chartWidth / Math.max(data.length, 1);
                              const barWidth = Math.min(
                                  isDense ? 28 : 40,
                                  Math.max(isDense ? 14 : 18, slotWidth - (isDense ? 10 : 8)),
                              );
                              const barHeight = paddingTop + chartHeight - point.y;
                              const isHovered = hoveredIndex === index;

                              return (
                                  <rect
                                      key={`bar-${index}`}
                                      x={point.x - barWidth / 2}
                                      y={point.y}
                                      width={barWidth}
                                      height={barHeight}
                                      fill={isHovered ? "#047857" : "url(#statsBarGradient)"}
                                      rx={4}
                                      className="cursor-pointer transition-all duration-200"
                                  />
                              );
                          })
                        : null}

                    {chartType === "line"
                        ? mapped.map((point, index) => (
                              <circle
                                  key={`dot-${index}`}
                                  cx={point.x}
                                  cy={point.y}
                                  r={hoveredIndex === index ? 6 : 4}
                                  fill={hoveredIndex === index ? "#059669" : "#10b981"}
                                  stroke="#ffffff"
                                  strokeWidth={2}
                              />
                          ))
                        : null}

                    {mapped.map((point, index) => {
                        const slotWidth =
                            chartType === "bar"
                                ? points.chartWidth / Math.max(data.length, 1)
                                : points.chartWidth / Math.max(data.length - 1, 1);
                        const xStart =
                            chartType === "bar"
                                ? point.x - slotWidth / 2
                                : index === 0
                                  ? point.x
                                  : point.x - slotWidth / 2;
                        const xWidth =
                            chartType === "bar"
                                ? slotWidth
                                : index === 0 || index === data.length - 1
                                  ? slotWidth / 2
                                  : slotWidth;

                        return (
                            <rect
                                key={`hover-${index}`}
                                x={xStart}
                                y={paddingTop}
                                width={xWidth}
                                height={chartHeight}
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            />
                        );
                    })}
                </svg>

                {hoveredPoint ? (
                    <div
                        className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl border border-neutral-800 bg-neutral-900/95 px-3 py-2 text-[11px] text-white shadow-lg transition-all duration-150"
                        style={{
                            left: `${(hoveredPoint.x / width) * 100}%`,
                            top: `${(hoveredPoint.y / height) * 100 - 8}%`,
                        }}
                    >
                        <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                            {hoveredPoint.label}
                        </div>
                        <div className="mt-0.5 text-xs font-black text-emerald-400">
                            {formatCurrency(hoveredPoint.value)}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
