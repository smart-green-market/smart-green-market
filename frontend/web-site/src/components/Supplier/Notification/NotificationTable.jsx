// NotificationTable.jsx
// Trang / khối "danh sách thông báo" đầy đủ: ô tìm kiếm + chip lọc + card danh sách.
// Đây là phần tương ứng với #page-notifications trong file HTML gốc.

import React from 'react';
import NotificationItem from './NotificationItem';
import { NOTIF_FILTER_CHIPS } from './notificationConstants';
import './Notification.css';

export default function NotificationTable({
  notifications = [],
  filter = 'all',
  onFilterChange,
  search = '',
  onSearchChange,
  onMarkAllRead,
  onItemClick,
  loading = false,
}) {
  return (
    <div className="page">
      <div className="toolbar">
        <div className="search-box">
          <i className="ti ti-search"></i>
          <input
            type="text"
            placeholder="Tìm theo tiêu đề thông báo..."
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
        <button className="btn-ghost" onClick={onMarkAllRead}>
          <i className="ti ti-checks"></i>
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div className="chip-group">
        {NOTIF_FILTER_CHIPS.map((chip) => (
          <div
            key={chip.value}
            className={`chip ${filter === chip.value ? 'on' : ''}`}
            onClick={() => onFilterChange?.(chip.value)}
          >
            {chip.label}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="ch">
          <div className="ch-left">
            <div className="ch-ico b">
              <i className="ti ti-bell"></i>
            </div>
            <span className="ch-title">Tất cả thông báo</span>
          </div>
          <span className="ch-link">{notifications.length} thông báo</span>
        </div>

        <div>
          {loading ? (
            <div className="empty-row">Đang tải thông báo...</div>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} variant="list" onClick={onItemClick} />
            ))
          )}
        </div>

        {!loading && notifications.length === 0 && (
          <div className="empty-row">Không tìm thấy thông báo phù hợp.</div>
        )}
      </div>
    </div>
  );
}
