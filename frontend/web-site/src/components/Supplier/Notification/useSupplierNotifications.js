import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "../../../contexts/authProvider";
import { useNotificationWebSocket } from "../../../hooks/useNotificationWebSocket";
import {
  getMarkedReadState,
  matchesNotificationRecord,
  parseNotificationWebSocketMessage,
  resolveMarkReadId,
  sortNotificationsByCreatedDesc,
} from "../../Admin/Notification/notificationFormatters";
import {
  notificationService,
  handleApiError,
  parseMyNotificationsResponse,
} from "../../../services/api/notificationService";
import {
  mapApiListToSupplierNotifications,
  mapApiToSupplierNotification,
  notifIsUnread,
  countSupplierUnread,
} from "./notificationHelpers";

export const SUPPLIER_BELL_PAGE_SIZE = 6;
export const SUPPLIER_LIST_PAGE_SIZE = 100;

export default function useSupplierNotifications({
  enabled = true,
  /** null = trang danh sách đầy đủ; number = giới hạn cho chuông dropdown */
  listLimit = SUPPLIER_BELL_PAGE_SIZE,
} = {}) {
  const { user } = useAuth();
  const isEnabled = enabled && Boolean(user);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const pageSize = listLimit ?? SUPPLIER_LIST_PAGE_SIZE;

  const applyList = useCallback((rawList = [], options = {}) => {
    let mapped = mapApiListToSupplierNotifications(rawList);
    if (listLimit != null) mapped = mapped.slice(0, listLimit);
    setNotifications(mapped);
    setUnreadCount(
      options.unreadCount != null ? options.unreadCount : countSupplierUnread(mapped),
    );
  }, [listLimit]);

  const fetchNotifications = useCallback(async () => {
    if (!isEnabled) return;
    setLoading(true);
    try {
      const data = await notificationService.getMy({
        page: 1,
        page_size: pageSize,
      });
      const parsed = parseMyNotificationsResponse(data);
      applyList(parsed.results, { unreadCount: parsed.unreadCount });
    } catch (error) {
      console.error(handleApiError(error, "Không thể tải thông báo"));
    } finally {
      setLoading(false);
    }
  }, [applyList, isEnabled, pageSize]);

  useEffect(() => {
    if (!isEnabled) return undefined;
    fetchNotifications();
    return undefined;
  }, [isEnabled, fetchNotifications]);

  const handleWebSocketMessage = useCallback((data) => {
    const message = parseNotificationWebSocketMessage(data);
    if (!message) return;

    if (message.kind === "list") {
      applyList(message.items, {
        unreadCount: message.unreadCount,
      });
      return;
    }

    if (message.kind === "unread_count") {
      setUnreadCount(message.unreadCount);
      return;
    }

    if (message.kind === "new") {
      const mapped = mapApiToSupplierNotification(message.item);
      setNotifications((prev) => {
        const withoutDup = prev.filter((item) => item.id !== mapped.id);
        const next = sortNotificationsByCreatedDesc([mapped, ...withoutDup]);
        return listLimit != null ? next.slice(0, listLimit) : next;
      });
      if (notifIsUnread(mapped)) {
        setUnreadCount((prev) => prev + 1);
      }
    }
  }, [applyList, listLimit]);

  useNotificationWebSocket({
    enabled: isEnabled,
    onMessage: handleWebSocketMessage,
    onConnect: fetchNotifications,
  });

  const recentNotifications = useMemo(
    () => notifications.slice(0, SUPPLIER_BELL_PAGE_SIZE),
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifications.filter((n) => {
      const matchType =
        filter === "all" || (filter === "unread" ? notifIsUnread(n) : n.type === filter);
      const matchText =
        !q || n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q);
      return matchType && matchText;
    });
  }, [notifications, filter, search]);

  const markOneReadApi = useCallback(async (id, receiptId) => {
    const markReadId = resolveMarkReadId({ id, receipt_id: receiptId });
    if (markReadId == null) return;

    try {
      const response = await notificationService.mark_read(markReadId);
      const markedState = getMarkedReadState(response);
      setNotifications((prev) =>
        prev.map((n) =>
          matchesNotificationRecord(n, markReadId, receiptId)
            ? {
                ...n,
                read_at: markedState.readAt,
                is_read: markedState.isRead,
              }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error(handleApiError(error, "Không thể đánh dấu đã đọc"));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unreadItems = notifications.filter(notifIsUnread);
    if (unreadItems.length === 0) return;

    await Promise.allSettled(
      unreadItems.map((n) => markOneReadApi(n.id, n.receipt_id)),
    );
  }, [notifications, markOneReadApi]);

  const markOneRead = useCallback(
    (id) => {
      const item = notifications.find((n) => n.id === id);
      if (item && notifIsUnread(item)) {
        markOneReadApi(item.id, item.receipt_id);
      }
    },
    [notifications, markOneReadApi],
  );

  const selectedNotification = useMemo(
    () => notifications.find((n) => n.id === selectedId) || null,
    [notifications, selectedId],
  );

  const openNotification = useCallback(
    (id, { closeDropdown: shouldCloseDropdown = false } = {}) => {
      markOneRead(id);
      setSelectedId(id);
      setModalOpen(true);
      if (shouldCloseDropdown) setDropdownOpen(false);
    },
    [markOneRead],
  );

  const closeModal = useCallback(() => setModalOpen(false), []);
  const toggleDropdown = useCallback(() => setDropdownOpen((o) => !o), []);
  const closeDropdown = useCallback(() => setDropdownOpen(false), []);
  const openDropdown = useCallback(() => setDropdownOpen(true), []);

  return {
    notifications,
    recentNotifications,
    filteredNotifications,
    unreadCount,
    loading,
    refreshNotifications: fetchNotifications,
    setNotifications,

    filter,
    setFilter,
    search,
    setSearch,

    isDropdownOpen,
    toggleDropdown,
    openDropdown,
    closeDropdown,

    isModalOpen,
    selectedNotification,
    openNotification,
    closeModal,

    markAllRead,
    markOneRead,
  };
}
