// Tính thông tin hạn dùng (tiến trình, số ngày còn lại, nhãn hiển thị) từ issue_date/expiry_date.
// Trả về null nếu thiếu dữ liệu ngày — card/thống kê sẽ tự bỏ qua phần liên quan.
export function getExpiryInfo(issueDate, expiryDate) {
  if (!issueDate || !expiryDate) return null;

  const start = new Date(issueDate);
  const end = new Date(expiryDate);
  const now = new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const totalDays = (end - start) / 86400000;
  const elapsedDays = (now - start) / 86400000;
  const remainingDays = (end - now) / 86400000;
  const percent = totalDays > 0 ? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100)) : 100;
  const monthsAbs = Math.max(1, Math.round(Math.abs(remainingDays) / 30));

  if (remainingDays < 0) {
    return { tone: "r", percent: 100, remainingDays, label: `Đã hết hạn ${monthsAbs} tháng` };
  }
  if (remainingDays <= 30) {
    return { tone: "a", percent, remainingDays, label: `Còn ${monthsAbs} tháng` };
  }
  return { tone: "g", percent, remainingDays, label: `Còn ${monthsAbs} tháng` };
}

// Nhóm hiệu lực dùng cho khối thống kê (active | soon | expired | null).
// Chỉ approved mới được tính vào thống kê — pending/rejected/revoked không theo dõi hạn dùng.
export function getValidityBucket(row) {
  // Chỉ approved mới được tính vào thống kê hiệu lực
  if (row.status !== "approved" && row.status !== "expired") return null;

  const info = getExpiryInfo(row.issue_date, row.expiry_date);
  if (!info) return row.status === "expired" ? "expired" : null;

  if (info.remainingDays < 0 || row.status === "expired") return "expired";
  if (info.remainingDays <= 30) return "soon";   // dưới 1 tháng → sắp hết hạn
  return "active";                                // còn hơn 1 tháng → đang hiệu lực
}