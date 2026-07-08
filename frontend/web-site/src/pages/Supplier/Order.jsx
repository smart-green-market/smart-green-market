import { useState, useEffect, useCallback } from "react";
import { FileSpreadsheet } from "lucide-react";
import OrderTable from "../../components/Supplier/Order/OrderTable";
import OrderStatusStats from "../../components/Supplier/Order/OrderStatusStats";
import DetailOrderModal from "../../components/Supplier/Order/DetailOrderModal";
import SupplierPageHeader, { SUPPLIER_PAGE_CLASS } from "../../components/Supplier/UI/SupplierPageHeader";
import { orderService, parseOrderList } from "../../services/api/orderService";
import { exportOrdersToExcel } from "../../utils/exportUtils";
import { useOrderRealtimeRefresh } from "../../hooks/useOrderRealtimeRefresh";
import { ORDER_REFERENCE_TYPES } from "../../utils/orderRealtimeUtils";

export default function OrderSupplierPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState(null);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await orderService.getAll({ page: 1, page_size: 100 });
      setData(parseOrderList(response));
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn hàng:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useOrderRealtimeRefresh({
    referenceTypes: [ORDER_REFERENCE_TYPES.PURCHASE_ORDER],
    watchOrderId: detailRow?.id ?? null,
    onRefresh: () => fetchOrders({ silent: true }),
    onDetailRefresh: () => setDetailRefreshKey((k) => k + 1),
  });

  const handleViewOrder = async (row) => {
    setDetailRow(row);
    try {
      const detail = await orderService.getById(row.id);
      setDetailRow(detail ?? row);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết đơn hàng:", error);
    }
  };

  return (
    <div className={SUPPLIER_PAGE_CLASS}>
      <OrderStatusStats orders={data} />

      <div className="flex justify-between items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã đơn hoặc tên đại lý..."
          className="px-4 py-2 border border-neutral-200 rounded-lg text-sm w-80 outline-none focus:border-emerald-600"
        />
        <button
          onClick={() => exportOrdersToExcel(data)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Xuất Excel
        </button>
      </div>

      <OrderTable
        data={data}
        search={search}
        loading={loading}
        onView={handleViewOrder}
      />

      <DetailOrderModal
        isOpen={detailRow !== null}
        onClose={() => setDetailRow(null)}
        order={detailRow}
        onUpdate={fetchOrders}
        refreshKey={detailRefreshKey}
      />
    </div>
  );
}
