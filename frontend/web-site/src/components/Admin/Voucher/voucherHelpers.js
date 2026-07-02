export const VOUCHER_PENDING_STATUSES = ["pending", "draft"];

export function isVoucherPending(status) {
    return VOUCHER_PENDING_STATUSES.includes(status);
}

export function matchesVoucherStatusFilter(rowStatus, filterValue) {
    if (!filterValue) return true;
    if (filterValue === "pending") {
        return isVoucherPending(rowStatus);
    }
    return rowStatus === filterValue;
}
