import { useNavigate } from "react-router-dom";
import { getNotificationSeeAllPath } from "../../common/notificationRolePaths";
import NotificationBell from "./NotificationBell";
import NotificationDetailModal from "./NotificationDetailModal";
import useSupplierNotifications from "./useSupplierNotifications";
import "./Notification.css";

const SUPPLIER_PAGE_ROUTES = {
  orders: "/nha-cung-cap/don-hang",
  products: "/nha-cung-cap/san-pham",
  certs: "/nha-cung-cap/chung-nhan",
  profile: "/nha-cung-cap/thong-tin-ca-nhan",
};

/** Chuông thông báo Supplier — UI riêng + API + WebSocket realtime */
export default function SupplierNotificationBell() {
  const navigate = useNavigate();
  const seeAllPath = getNotificationSeeAllPath("supplier");

  const notif = useSupplierNotifications({ enabled: true });

  return (
    <div className="supplier-notif-root">
      <NotificationBell
        unreadCount={notif.unreadCount}
        notifications={notif.recentNotifications}
        isOpen={notif.isDropdownOpen}
        onToggle={notif.toggleDropdown}
        onClose={notif.closeDropdown}
        onMarkAllRead={notif.markAllRead}
        onItemClick={(id) => notif.openNotification(id, { closeDropdown: true })}
        onViewAll={() => {
          notif.closeDropdown();
          navigate(seeAllPath);
        }}
      />

      <NotificationDetailModal
        notification={notif.selectedNotification}
        isOpen={notif.isModalOpen}
        onClose={notif.closeModal}
        onNavigate={(page) => {
          const route = SUPPLIER_PAGE_ROUTES[page];
          if (route) navigate(route);
        }}
      />
    </div>
  );
}
