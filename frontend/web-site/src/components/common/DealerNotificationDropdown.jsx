import { Calendar } from "lucide-react";
import { isNotificationUnread } from "../Admin/Notification/notificationFormatters";

export default function DealerNotificationDropdown({ items, onItemClick, onSeeMore, hasMore }) {
    // Hàm format định dạng thời gian ngắn gọn
    const formatShortDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit"
        });
    };

    return (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 overflow-hidden transform origin-top-right transition-all">
            <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between bg-stone-50">
                <span className="text-xs font-bold text-neutral-800 font-['Geist',sans-serif]">Thông báo mới nhận</span>
            </div>

            <div className="max-h-[360px] overflow-y-auto">
                {items.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-400 font-['Geist',sans-serif]">
                        Không có thông báo nào gần đây.
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onItemClick(item)}
                            className={`px-4 py-3 border-b border-neutral-50 last:border-0 cursor-pointer transition-all flex flex-col gap-1 hover:bg-neutral-50
                                ${isNotificationUnread(item) ? "bg-emerald-50/40" : "opacity-70"}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <h4 className={`text-xs line-clamp-1 font-['Geist',sans-serif] ${isNotificationUnread(item) ? "font-bold text-neutral-900" : "font-normal text-neutral-600"}`}>
                                    {item.title}
                                </h4>
                                {isNotificationUnread(item) && (
                                    <span className="w-2 h-2 mt-1 rounded-full bg-blue-600 shrink-0" />
                                )}
                            </div>
                            <p className="text-[11px] text-neutral-500 line-clamp-2 font-['Geist',sans-serif]">
                                {item.content}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                <span>{formatShortDate(item.createdAt)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {(onSeeMore && (hasMore || items.length > 0)) && (
                <button
                    onClick={onSeeMore}
                    className="w-full text-center py-2 px-4 bg-stone-50 hover:bg-stone-100 text-xs font-bold text-emerald-800 transition-colors border-t border-neutral-100 font-['Geist',sans-serif] cursor-pointer"
                >
                    {hasMore ? "Xem thông báo trước đó" : "Xem tất cả thông báo"}
                </button>
            )}
        </div>
    );
}