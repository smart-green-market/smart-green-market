export const SEASON_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
};

/** Tên mùa có sẵn — dùng khi thêm mùa mới */
export const SEASON_NAME_PRESETS = [
    {
        key: "spring",
        code: "spring",
        name: "Mùa xuân",
        start_month: 1,
        end_month: 3,
        description: "Mùa xuân (tháng 1 - 3)",
        sort_order: 1,
    },
    {
        key: "summer",
        code: "summer",
        name: "Mùa hè",
        start_month: 4,
        end_month: 6,
        description: "Mùa hè (tháng 4 - 6)",
        sort_order: 2,
    },
    {
        key: "autumn",
        code: "autumn",
        name: "Mùa thu",
        start_month: 7,
        end_month: 9,
        description: "Mùa thu (tháng 7 - 9)",
        sort_order: 3,
    },
    {
        key: "winter",
        code: "winter",
        name: "Mùa đông",
        start_month: 10,
        end_month: 12,
        description: "Mùa đông (tháng 10 - 12)",
        sort_order: 4,
    },
];

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: `Tháng ${index + 1}`,
}));

export function extractSeasonList(response) {
    if (Array.isArray(response)) return response;
    if (!response?.results) return [];

    const first = response.results[0];
    if (first?.results) {
        return response.results.flatMap((page) => page.results ?? []);
    }

    return response.results;
}

export function formatMonthRange(startMonth, endMonth) {
    const start = Number(startMonth);
    const end = Number(endMonth);
    if (Number.isNaN(start) || Number.isNaN(end)) return "—";
    if (start === end) return `Tháng ${start}`;
    return `Tháng ${start} - ${end}`;
}

export function formatSeasonRow(item) {
    return {
        id: item.id,
        code: item.code ?? "",
        name: item.name ?? "",
        description: item.description ?? "",
        start_month: item.start_month ?? null,
        end_month: item.end_month ?? null,
        month_label: formatMonthRange(item.start_month, item.end_month),
        sort_order: item.sort_order ?? 0,
        status: item.status ?? SEASON_STATUS.ACTIVE,
    };
}

export function formatSeasonDetail(detail) {
    return formatSeasonRow(detail);
}

export function buildSeasonPayload({
    code,
    name,
    description,
    start_month,
    end_month,
    sort_order,
    status,
}) {
    const payload = {
        code: String(code ?? "").trim(),
        name: String(name ?? "").trim(),
        description: String(description ?? "").trim(),
        start_month: Number(start_month),
        end_month: Number(end_month),
        sort_order: Number(sort_order) || 0,
    };

    if (status) {
        payload.status = status;
    }

    return payload;
}

export function getAvailableSeasonPresets(existingSeasons = []) {
    const usedNames = new Set(
        existingSeasons.map((season) => String(season.name ?? "").trim().toLowerCase()),
    );

    return SEASON_NAME_PRESETS.filter(
        (preset) => !usedNames.has(preset.name.trim().toLowerCase()),
    );
}

export function getSeasonPresetByKey(key) {
    return SEASON_NAME_PRESETS.find((preset) => preset.key === key) ?? null;
}
