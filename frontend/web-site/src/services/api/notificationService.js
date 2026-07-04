import axiosClient from "./axiosClient";

export const BELL_NOTIFICATION_PAGE_SIZE = 5;
export const NOTIFICATION_DEFAULT_PAGE_SIZE = 20;

function normalizeNotificationList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function parseMyNotificationsResponse(data = {}) {
  return {
    unreadCount: Number(data?.unread_count ?? 0),
    unread: Array.isArray(data?.unread) ? data.unread : [],
    results: normalizeNotificationList(data),
    count: Number(data?.count ?? 0),
    page: Number(data?.page ?? 1),
    pageSize: Number(data?.page_size ?? NOTIFICATION_DEFAULT_PAGE_SIZE),
    hasMore: Boolean(data?.has_more),
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
}

export const notificationService = {
  getMy: (params = {}) =>
    axiosClient.get("/notifications/my/", { params }).then((res) => res.data),

  getMyNotifications: (params = {}) =>
    notificationService.getMy(params).then(parseMyNotificationsResponse),
  // Lấy danh sách thông báo gửi đến user đăng nhập, sắp xếp mới nhất trước.

  // unread_count + unread[]: thông báo chưa đọc (badge / dropdown)
  // results[]: chưa đọc lên trước, sau đó mới nhất trước trong từng nhóm
  // read_at=null: chưa đọc
  // type_label: loại thông báo (Thông tin / Thành công / ...)
  // reference_type_label: nhóm nội dung (Giấy tờ / Danh mục / ...)
  // Phân trang (load more): ?page=1&page_size=20 (mặc định page=1, page_size=20, tối đa 100).

  // {
  //   "unread_count": 0,
  //   "unread": [
  //     {
  //       "receipt_id": 0,
  //       "id": 0,
  //       "title": "string",
  //       "content": "string",
  //       "type": "info",
  //       "type_label": "string",
  //       "reference_type": "account_document",
  //       "reference_type_label": "string",
  //       "reference_id": 0,
  //       "reference_status": "string",
  //       "reference_order_code": "string",
  //       "read_at": "2026-07-01T08:52:12.561Z",
  //       "created_at": "2026-07-01T08:52:12.561Z"
  //     }
  //   ],
  //   "count": 0,
  //   "next": "string",
  //   "previous": "string",
  //   "page": 0,
  //   "page_size": 0,
  //   "has_more": true,
  //   "results": [
  //     {
  //       "receipt_id": 0,
  //       "id": 0,
  //       "title": "string",
  //       "content": "string",
  //       "type": "info",
  //       "type_label": "string",
  //       "reference_type": "account_document",
  //       "reference_type_label": "string",
  //       "reference_id": 0,
  //       "reference_status": "string",
  //       "reference_order_code": "string",
  //       "read_at": "2026-07-01T08:52:12.561Z",
  //       "created_at": "2026-07-01T08:52:12.561Z"
  //     }
  //   ]
  // }

  getAll: (params) =>
    notificationService.getMy(params).then((data) => normalizeNotificationList(data)),

  /** Chuông thông báo: trang 1, 5 bản ghi mới nhất + unread_count từ BE */
  getBellFeed: () =>
    notificationService
      .getMy({ page: 1, page_size: BELL_NOTIFICATION_PAGE_SIZE })
      .then((data) => {
        const parsed = parseMyNotificationsResponse(data);
        return {
          unreadCount: parsed.unreadCount,
          items: parsed.results,
        };
      }),

  // getAll response (results[]):
  // {
  //   "receipt_id": 0,   ← chỉ để hiển thị/tracking
  //   "id": 0,           ← dùng cho mark_read (mọi role); getById chỉ admin
  //   "title": "string",
  //   "content": "string",
  //   "type": "info",
  //   "type_label": "string",
  //   "reference_type": "account_document",
  //   "reference_type_label": "string",
  //   "reference_id": 0,
  //   "reference_status": "string",
  //   "reference_order_code": "string",
  //   "read_at": null,
  //   "created_at": "2026-06-12T15:15:21.858Z"
  // }

  getById: (id) =>
    axiosClient.get(`/notifications/${id}/`).then((res) => res.data),

  // getById response:
  // {
  //   "id": 0,
  //   "type_label": "string",
  //   "reference_type_label": "string",
  //   "type": "info",
  //   "title": "string",
  //   "content": "string",
  //   "reference_type": "string",
  //   "reference_id": 2147483647,
  //   "created_at": "2026-06-12T15:18:04.802Z",
  //   "created_by": 0
  // }

  mark_read: (id) =>
    axiosClient
      .post(`/notifications/${id}/mark_read/`, {})
      .then((res) => res.data),
  // id = notification id từ getAll (mọi role)
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
