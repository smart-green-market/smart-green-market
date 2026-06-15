export function canLockProduct(status) {
  return status === "active";
}

export function canUnlockProduct(status) {
  return status === "inactive";
}

export function canToggleSellingStatus(status) {
  return canLockProduct(status) || canUnlockProduct(status);
}
