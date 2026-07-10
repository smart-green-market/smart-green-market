export const VND_FORMATTER = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
});

export function formatCurrency(val) {
    if (val == null || Number.isNaN(Number(val))) return "0 đ";
    return `${VND_FORMATTER.format(Math.round(Number(val)))} đ`;
}

export function formatCurrencyShort(val) {
    if (val == null || Number.isNaN(Number(val))) return "0 đ";
    const num = Math.round(Number(val));
    if (num >= 1_000_000_000) return `${Math.round(num / 1_000_000_000)} tỷ`;
    if (num >= 1_000_000) return `${Math.round(num / 1_000_000)} tr`;
    if (num >= 1_000) return `${Math.round(num / 1_000)} k`;
    return `${VND_FORMATTER.format(num)} đ`;
}

export function computeTrend(current, previous) {
    const curr = Number(current);
    const prev = Number(previous);

    if (Number.isNaN(curr) || Number.isNaN(prev) || prev === 0) {
        return { changePercent: null, direction: "flat" };
    }

    const changePercent = ((curr - prev) / prev) * 100;

    return {
        changePercent,
        direction: changePercent > 0 ? "up" : changePercent < 0 ? "down" : "flat",
    };
}

export function getPreviousMonthRevenue(chartData = []) {
    if (!Array.isArray(chartData) || chartData.length < 2) return null;
    return Number(chartData[chartData.length - 2]?.revenue ?? 0);
}

export function truncateLabel(value, maxLength = 18) {
    const text = String(value ?? "");
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}…`;
}
