// NotificationDetailModal.jsx
// Modal chi tiết thông báo — mở khi click vào 1 item ở dropdown hoặc ở bảng danh sách.

import React from 'react';
import { notifTone, notifIcon, formatNotifDateTimeFull, buildNotifMetaRows } from './notificationHelpers';
import { REF_STATUS_LABELS, REF_TYPE_ACTION } from './notificationConstants';
import './Notification.css';

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onNavigate, // (page: string) => void — điều hướng khi bấm nút hành động
}) {
  if (!notification) return null;

  const n = notification;
  const metaRows = buildNotifMetaRows(n, REF_STATUS_LABELS);
  const action = REF_TYPE_ACTION[n.reference_type];

  const handleAction = () => {
    onClose?.();
    if (action) onNavigate?.(action.page);
  };

  return (
    <div
      className={`modal-overlay ${isOpen ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <div className={`notif-ico ${notifTone(n)}`}>
            <i className={`ti ${notifIcon(n)}`}></i>
          </div>
          <div className="modal-head-text">
            <div className="modal-title">{n.title}</div>
            <div className="modal-time">{formatNotifDateTimeFull(n.created_at)}</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="ti ti-x"></i>
          </button>
        </div>

        <div className="modal-body">
          <div>{n.content}</div>
          {metaRows.length > 0 && (
            <div className="modal-meta-box">
              {metaRows.map(([label, value]) => (
                <div className="modal-meta-row" key={label}>
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            Đóng
          </button>
          {action && (
            <button className="btn-primary" onClick={handleAction}>
              <i className="ti ti-arrow-right"></i>
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
