import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Bell,
    Calendar,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    Inbox,
    Loader2,
    RefreshCw,
} from "lucide-react";
import {
    formatNotificationRow,
    getMarkedReadState,
    isNotificationUnread,
    matchesNotificationRecord,
    resolveMarkReadId,
} from "../../../components/Admin/Notification/notificationFormatters";
import {
    handleApiError,
    notificationService,
    parseMyNotificationsResponse,
} from "../../../services/api/notificationService";
import { appToast } from "../../../components/common/toast";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 3;

const FILTER_TABS = [
    { key: "all", label: "Tất cả" },
    { key: "unread", label: "Chưa đọc" },
    { key: "read", label: "Đã đọc" },
];

const TYPE_CONFIG = {
    info:    { label: "Thông báo", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-100" },
    success: { label: "Thành công", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
    warning: { label: "Cảnh báo", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
    error:   { label: "Thất bại", cls: "bg-red-50 text-red-700 ring-1 ring-red-100" },
};

const REF_LABELS = {
    customer_order:   "Đơn hàng",
    purchase_order:   "Đơn đặt hàng",
    supplier_product: "Sản phẩm",
    category:         "Danh mục",
    certification:    "Chứng chỉ",
    account_document: "Giấy tờ",
    supplier:         "Nhà cung cấp",
    dealer:           "Đại lý",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateFull(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("vi-VN", {
        hour: "2-digit", minute: "2-digit",
        day: "2-digit", month: "2-digit", year: "numeric",
    });
}

function buildPageNumbers(current, total) {
    if (total <= 1) return [];
    const delta = 2;
    const pages = [];
    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push("...");
    if (total > 1) pages.push(total);

    return pages;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NotificationCard({ item, onMarkRead }) {
    const isUnread = isNotificationUnread(item);
    const typeConf = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.info;
    const refLabel = REF_LABELS[item.referenceType] ?? null;

    const handleClick = () => {
        if (isUnread) {
            const markId = resolveMarkReadId(item);
            if (markId != null) onMarkRead(markId, item.receiptId);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`group relative flex gap-4 rounded-2xl border p-5 transition-all duration-200 ${
                isUnread
                    ? "cursor-pointer border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white shadow-sm hover:border-emerald-200 hover:shadow-md"
                    : "border-neutral-100 bg-white hover:border-neutral-200 hover:bg-neutral-50/60"
            }`}
        >
            {isUnread && (
                <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />
            )}

            <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${typeConf.cls}`}>
                <Bell className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start gap-2">
                    <p className={`text-sm leading-snug ${isUnread ? "font-bold text-neutral-900" : "font-semibold text-neutral-700"}`}>
                        {item.title}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeConf.cls}`}>
                        {typeConf.label}
                    </span>
                    {refLabel && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                            {refLabel}
                        </span>
                    )}
                </div>

                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-neutral-500">
                    {item.content}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateFull(item.createdAt)}
                    </span>
                    {!isUnread && item.readAt && (
                        <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCheck className="h-3 w-3" />
                            Đã đọc
                        </span>
                    )}
                    {item.referenceOrderCode && (
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-neutral-500">
                            #{item.referenceOrderCode}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

function EmptyState({ filter }) {
    const msgs = {
        all:    { title: "Chưa có thông báo nào", desc: "Thông báo về đơn hàng và ưu đãi sẽ xuất hiện tại đây." },
        unread: { title: "Không có thông báo chưa đọc", desc: "Tất cả thông báo của bạn đã được đọc." },
        read:   { title: "Chưa có thông báo đã đọc", desc: "Bạn chưa mở thông báo nào." },
    };
    const { title, desc } = msgs[filter] ?? msgs.all;
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
                <Inbox className="h-8 w-8" />
            </div>
            <p className="text-sm font-semibold text-neutral-700">{title}</p>
            <p className="mt-1 max-w-xs text-xs text-neutral-400">{desc}</p>
        </div>
    );
}

function Pagination({ current, total, onChange }) {
    if (total <= 1) return null;
    const pages = buildPageNumbers(current, total);

    return (
        <div className="flex items-center justify-center gap-1">
            <button
                type="button"
                onClick={() => onChange(current - 1)}
                disabled={current === 1}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition-all hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {pages.map((p, idx) =>
                p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="flex h-9 w-9 items-center justify-center text-xs text-neutral-400">
                        ...
                    </span>
                ) : (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onChange(p)}
                        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border text-xs font-semibold transition-all ${
                            p === current
                                ? "border-emerald-600 bg-emerald-700 text-white shadow-sm"
                                : "border-neutral-200 bg-white text-neutral-600 hover:border-emerald-300 hover:text-emerald-700"
                        }`}
                    >
                        {p}
                    </button>
                ),
            )}

            <button
                type="button"
                onClick={() => onChange(current + 1)}
                disabled={current === total}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition-all hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BuyerNotificationsPage() {
    const [allNotifications, setAllNotifications] = useState([]);
    const [activeFilter, setActiveFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [markingAllRead, setMarkingAllRead] = useState(false);

    // Derived states
    const filteredNotifications = useMemo(() => {
        if (activeFilter === "unread") {
            return allNotifications.filter(isNotificationUnread);
        }
        if (activeFilter === "read") {
            return allNotifications.filter((i) => !isNotificationUnread(i));
        }
        return allNotifications;
    }, [allNotifications, activeFilter]);

    const totalCount = filteredNotifications.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

    const unreadCount = useMemo(() => {
        return allNotifications.filter(isNotificationUnread).length;
    }, [allNotifications]);

    const tabCounts = useMemo(() => {
        const unread = allNotifications.filter(isNotificationUnread).length;
        return {
            all: allNotifications.length,
            unread: unread,
            read: allNotifications.length - unread,
        };
    }, [allNotifications]);

    const fetchAllNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let allItems = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const raw = await notificationService.getMy({ page, page_size: 100 });
                const parsed = parseMyNotificationsResponse(raw);
                const formatted = parsed.results.map(formatNotificationRow);
                allItems = [...allItems, ...formatted];
                hasMore = parsed.hasMore;
                page += 1;

                if (page > 20) break; // Safety break
            }

            setAllNotifications(allItems);
        } catch (err) {
            setError(handleApiError(err, "Không tải được danh sách thông báo."));
        } finally {
            setLoading(false);
        }
    }, []);

    // Load initially
    useEffect(() => {
        fetchAllNotifications();
    }, [fetchAllNotifications]);

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setCurrentPage(1); // reset to first page on filter change
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleMarkRead = useCallback(async (markReadId, receiptId) => {
        if (markReadId == null) return;
        try {
            const response = await notificationService.mark_read(markReadId);
            const markedState = getMarkedReadState(response);
            setAllNotifications((prev) =>
                prev.map((item) =>
                    matchesNotificationRecord(item, markReadId, receiptId)
                        ? { ...item, ...markedState }
                        : item,
                ),
            );
        } catch (err) {
            console.error(handleApiError(err, "Không thể đánh dấu đã đọc"));
        }
    }, []);

    const handleMarkAllRead = async () => {
        const unread = allNotifications.filter(isNotificationUnread);
        if (unread.length === 0) return;
        setMarkingAllRead(true);
        try {
            await Promise.all(
                unread.map((item) => {
                    const id = resolveMarkReadId(item);
                    return id != null ? notificationService.mark_read(id).catch(() => {}) : Promise.resolve();
                }),
            );
            const now = new Date().toISOString();
            setAllNotifications((prev) =>
                prev.map((item) =>
                    isNotificationUnread(item) ? { ...item, readAt: now, isRead: true } : item,
                ),
            );
            appToast.success("Đã đánh dấu tất cả là đã đọc");
        } catch {
            appToast.danger("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setMarkingAllRead(false);
        }
    };

    const displayedItems = useMemo(() => {
        const fromIndex = (currentPage - 1) * PAGE_SIZE;
        const toIndex = fromIndex + PAGE_SIZE;
        return filteredNotifications.slice(fromIndex, toIndex);
    }, [filteredNotifications, currentPage]);

    // Compute display pagination info
    const from = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const to = Math.min(currentPage * PAGE_SIZE, totalCount);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-neutral-900">Thông báo</h1>
                    <p className="mt-0.5 text-sm text-neutral-500">
                        {unreadCount > 0 ? (
                            <>Bạn có <span className="font-semibold text-emerald-700">{unreadCount}</span> thông báo chưa đọc</>
                        ) : (
                            "Tất cả thông báo của bạn"
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchAllNotifications}
                        disabled={loading}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        Làm mới
                    </button>

                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            disabled={markingAllRead}
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 disabled:opacity-60"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            {markingAllRead ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
                        </button>
                    )}
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 rounded-xl bg-neutral-100 p-1">
                {FILTER_TABS.map((tab) => {
                    const count = tabCounts[tab.key] ?? 0;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => handleFilterChange(tab.key)}
                            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                                activeFilter === tab.key
                                    ? "bg-white text-emerald-800 shadow-sm"
                                    : "text-neutral-500 hover:text-neutral-700"
                            }`}
                        >
                            {tab.label}
                            {count > 0 && (
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                    activeFilter === tab.key
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-neutral-200 text-neutral-500"
                                }`}>
                                    {count > 99 ? "99+" : count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Result info */}
            {!loading && !error && totalCount > 0 && (
                <p className="text-xs text-neutral-400">
                    Hiển thị <span className="font-semibold text-neutral-600">{from}–{to}</span> trên tổng số{" "}
                    <span className="font-semibold text-neutral-600">{totalCount}</span> thông báo
                </p>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-neutral-100 bg-white">
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                    <button
                        type="button"
                        onClick={fetchAllNotifications}
                        className="mt-3 cursor-pointer rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800"
                    >
                        Thử lại
                    </button>
                </div>
            ) : displayedItems.length === 0 ? (
                <div className="rounded-2xl border border-neutral-100 bg-white">
                    <EmptyState filter={activeFilter} />
                </div>
            ) : (
                <div className="space-y-3">
                    {displayedItems.map((item) => (
                        <NotificationCard
                            key={item.id ?? item.receiptId ?? item.title}
                            item={item}
                            onMarkRead={handleMarkRead}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
                <Pagination
                    current={currentPage}
                    total={totalPages}
                    onChange={handlePageChange}
                />
            )}
        </div>
    );
}
