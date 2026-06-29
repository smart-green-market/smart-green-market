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
export function buildCountsFromCards(items = [], cards = [], { field = "status" } = {}) {
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

/**
 * Gom count theo map { active: "active", pending: "pending", ... }
 */
export function buildCountsFromMap(items = [], valueMap = {}, { field = "status" } = {}) {
    return Object.fromEntries(
        Object.entries(valueMap).map(([key, value]) => [
            key,
            countByField(items, field, value),
        ]),
    );
}
