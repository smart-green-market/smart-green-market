// NotificationDropdown.jsx
// Panel dropdown hiển thị tối đa 6 thông báo gần nhất — được NotificationBell render.
// Component thuần hiển thị (presentational), không tự giữ state.

import React from 'react';
import NotificationItem from './NotificationItem';
import './Notification.css';

export default function NotificationDropdown({
  isOpen,
  notifications = [],
  onMarkAllRead,
  onItemClick,
  onViewAll,
}) {
  return (
    <div className={`notif-dd ${isOpen ? 'open' : ''}`}>
      <div className="notif-dd-head">
        <span className="notif-dd-title">Thông báo</span>
        <span
          className="notif-dd-mark"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAllRead?.();
          }}
        >
          Đánh dấu đã đọc tất cả
        </span>
      </div>
      <div className="notif-dd-list">
        {notifications.length === 0 ? (
          <div className="notif-dd-empty">Không có thông báo nào.</div>
        ) : (
          notifications.slice(0, 6).map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              variant="dropdown"
              onClick={onItemClick}
            />
          ))
        )}
      </div>
      <div className="notif-dd-foot" onClick={onViewAll}>
        Xem tất cả thông báo
      </div>
    </div>
  );
}
