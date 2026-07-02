// NotificationItem.jsx
// 1 dòng thông báo — dùng chung cho cả dropdown (variant="dropdown")
// và trang danh sách đầy đủ (variant="list").

import React from 'react';
import { notifTone, notifIcon, notifIsUnread, formatNotifTime } from './notificationHelpers';
import './Notification.css';

export default function NotificationItem({ notification, variant = 'list', onClick }) {
  const unread = notifIsUnread(notification);
  const rowClass = variant === 'dropdown' ? 'notif-item' : 'notif-list-item';

  return (
    <div
      className={`${rowClass} ${unread ? 'unread' : ''}`}
      onClick={() => onClick?.(notification.id)}
    >
      <div className={`notif-ico ${notifTone(notification)}`}>
        <i className={`ti ${notifIcon(notification)}`}></i>
      </div>
      <div className="notif-body">
        <div className="notif-top-row">
          <div className="notif-title">{notification.title}</div>
          {unread && <div className="notif-dot" />}
        </div>
        <div className="notif-msg">{notification.content}</div>
        <div className="notif-time">{formatNotifTime(notification.created_at)}</div>
      </div>
    </div>
  );
}
