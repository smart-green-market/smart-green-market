// NotificationBell.jsx
// Icon chuông trên topbar + badge số chưa đọc + gắn NotificationDropdown bên trong.
// Tự xử lý việc đóng dropdown khi click ra ngoài.

import React, { useEffect, useRef } from 'react';
import NotificationDropdown from './NotificationDropdown';
import './Notification.css';

export default function NotificationBell({
  unreadCount = 0,
  notifications = [],
  isOpen = false,
  onToggle,
  onClose,
  onMarkAllRead,
  onItemClick,
  onViewAll,
}) {
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (isOpen && wrapRef.current && !wrapRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, onClose]);

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div className="tb-icon-wrap" ref={wrapRef}>
      <button
        type="button"
        className="tb-icon"
        title="Thông báo"
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
      >
        <i className="ti ti-bell"></i>
        <div className={`tb-notif ${unreadCount === 0 ? 'hidden' : ''}`}>{badgeLabel}</div>
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        notifications={notifications}
        onMarkAllRead={onMarkAllRead}
        onItemClick={onItemClick}
        onViewAll={onViewAll}
      />
    </div>
  );
}
