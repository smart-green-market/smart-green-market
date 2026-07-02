import { useNavigate } from "react-router-dom";
import NotificationTable from "../../components/Supplier/Notification/NotificationTable";
import NotificationDetailModal from "../../components/Supplier/Notification/NotificationDetailModal";
import useSupplierNotifications from "../../components/Supplier/Notification/useSupplierNotifications";
import "../../components/Supplier/Notification/Notification.css";

const SUPPLIER_PAGE_ROUTES = {
  orders: "/nha-cung-cap/don-hang",
  products: "/nha-cung-cap/san-pham",
  certs: "/nha-cung-cap/chung-nhan",
  profile: "/nha-cung-cap/thong-tin-ca-nhan",
};

export default function SupplierNotificationPage() {
  const navigate = useNavigate();
  const notif = useSupplierNotifications({ listLimit: null });

  return (
    <div className="supplier-notif-root">
        <NotificationTable
          notifications={notif.filteredNotifications}
          filter={notif.filter}
          onFilterChange={notif.setFilter}
          search={notif.search}
          onSearchChange={notif.setSearch}
          onMarkAllRead={notif.markAllRead}
          onItemClick={(id) => notif.openNotification(id)}
          loading={notif.loading}
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
