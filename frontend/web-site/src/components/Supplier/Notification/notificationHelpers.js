// notificationHelpers.js
// Các hàm tiện ích thuần (pure functions) dùng chung cho toàn bộ module Thông báo

import {
  formatNotificationRow,
  isNotificationUnread,
  sortNotificationsByCreatedDesc,
} from '../../Admin/Notification/notificationFormatters';
import { TYPE_TONE, REF_TYPE_ICON } from './notificationConstants';

/** Map response API → shape snake_case mà UI Supplier đang dùng */
export function mapApiToSupplierNotification(item) {
  const row = formatNotificationRow(item);
  return {
    id: row.id,
    receipt_id: row.receiptId,
    title: row.title,
    content: row.content,
    type: row.type,
    type_label: row.typeLabel,
    reference_type: row.referenceType,
    reference_type_label: row.referenceTypeLabel,
    reference_id: row.referenceId,
    reference_status: row.referenceStatus,
    reference_order_code: row.referenceOrderCode,
    read_at: row.readAt ?? null,
    is_read: row.isRead,
    created_at: row.createdAt,
  };
}

export function mapApiListToSupplierNotifications(rawList = []) {
  return sortNotificationsByCreatedDesc(
    (rawList ?? []).map(mapApiToSupplierNotification),
  );
}

export function countSupplierUnread(notifications = []) {
  return notifications.filter(notifIsUnread).length;
}

/** Tông màu icon (g/a/b/p/r) dựa theo type của thông báo */
export function notifTone(n) {
  return TYPE_TONE[n.type] || 'b';
}

/** Class icon Tabler dựa theo reference_type */
export function notifIcon(n) {
  return REF_TYPE_ICON[n.reference_type] || 'ti-bell';
}

/** Thông báo chưa đọc */
export function notifIsUnread(n) {
  return isNotificationUnread(n);
}

/**
 * Định dạng thời gian tương đối (Vừa xong / x phút trước / x giờ trước / x ngày trước),
 * quá 7 ngày thì hiển thị dd/mm/yyyy.
 */
export function formatNotifTime(iso) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Định dạng ngày giờ đầy đủ, dùng trong modal chi tiết thông báo */
export function formatNotifDateTimeFull(iso) {
  const date = new Date(iso);
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Xây danh sách [label, value] cho khối "modal-meta-box" trong modal chi tiết,
 * trả về mảng các cặp để component tự render — tách khỏi JSX cho dễ test.
 */
export function buildNotifMetaRows(n, refStatusLabels) {
  const rows = [];
  rows.push(['Loại thông báo', n.type_label]);
  rows.push(['Đối tượng', n.reference_type_label]);
  if (n.reference_order_code) {
    rows.push(['Mã tham chiếu', n.reference_order_code]);
  } else if (n.reference_id) {
    rows.push(['Mã tham chiếu', `#${n.reference_id}`]);
  }
  if (n.reference_status) {
    rows.push(['Trạng thái', refStatusLabels[n.reference_status] || n.reference_status]);
  }
  return rows;
}
