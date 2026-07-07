/**
 * Đếm số phần tử có field khớp value.
 */
export function countByField(items = [], field, value) {
  return items.filter((item) => item?.[field] === value).length;
}

/**
 * Đếm theo cấu hình card — hỗ trợ match tùy chỉnh hoặc filterValue.
 *
 * @param {Array} items - Dữ liệu gốc từ page (đã fetch)
 * @param {Array} cards - Mảng cấu hình card (key, filterValue, match?)
 * @param {{ field?: string }} options - field mặc định để so khớp (vd: "status")
 */
export function buildCountsFromCards(
  items = [],
  cards = [],
  { field = "status" } = {},
) {
  return cards.reduce((counts, card) => {
    if (typeof card.match === "function") {
      counts[card.key] = items.filter(card.match).length;
    } else {
      const value = card.filterValue ?? card.key;
      counts[card.key] = countByField(items, field, value);
    }
    return counts;
  }, {});
}

const STATUS_COUNT_KEY_ALIASES = {
  approved: ["approved", "active"],
  active: ["active", "approved"],
};

function readCountValue(countStatus, key) {
  const candidates = STATUS_COUNT_KEY_ALIASES[key] ?? [key];

  for (const candidate of candidates) {
    if (countStatus?.[candidate] != null) {
      return Number(countStatus[candidate]);
    }
  }

  return null;
}

function resolveStatusCount(countStatus, card) {
  const keys = card.countStatusKeys ?? [
    card.countStatusKey ?? card.filterValue ?? card.key,
  ];

  return keys.reduce((total, key) => {
    const value = readCountValue(countStatus, key);
    return value == null ? total : total + value;
  }, 0);
}

export function hasAdminCountStatus(countStatus) {
  if (!countStatus || typeof countStatus !== "object") return false;
  return Object.keys(countStatus).length > 0;
}

export function buildCountsFromStatusMap(countStatus = {}, cards = []) {
  return cards.reduce((counts, card) => {
    counts[card.key] = resolveStatusCount(countStatus, card);
    return counts;
  }, {});
}

/**
 * Gom count theo map { active: "active", pending: "pending", ... }
 */
export function buildCountsFromMap(
  items = [],
  valueMap = {},
  { field = "status" } = {},
) {
  return Object.fromEntries(
    Object.entries(valueMap).map(([key, value]) => [
      key,
      countByField(items, field, value),
    ]),
  );
}
