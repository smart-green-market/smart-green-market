import { toast } from "sonner";

export const NOTIFICATION_REALTIME_EVENT = "sgm:notification:new";

/**
 * Hiển thị toast theo type backend (success | error | warning | info).
 */
export function showRealtimeNotificationToast(item) {
    if (!item || typeof item !== "object") return;

    const title = item.title || "Thông báo mới";
    const description = item.content ?? item.message;
    const options = { description, duration: 5000 };
    const type = item.type ?? "info";

    switch (type) {
        case "success":
            toast.success(title, options);
            break;
        case "error":
            toast.error(title, options);
            break;
        case "warning":
            toast.warning(title, options);
            break;
        default:
            toast.info(title, options);
            break;
    }
}

export function dispatchRealtimeNotificationEvent(item) {
    if (!item || typeof item !== "object") return;
    window.dispatchEvent(
        new CustomEvent(NOTIFICATION_REALTIME_EVENT, { detail: item }),
    );
}

export function resolveNotificationId(item) {
    return item?.id ?? item?.notification_id ?? null;
}
