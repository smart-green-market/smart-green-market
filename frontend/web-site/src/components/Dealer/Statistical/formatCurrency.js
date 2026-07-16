/**
 * Format a number as Vietnamese Dong (VND) currency.
 */
export const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);
};
