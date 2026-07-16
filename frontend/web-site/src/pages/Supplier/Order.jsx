import { useState, useEffect, useCallback } from "react";
import { FileSpreadsheet, Truck } from "lucide-react";
import { toast } from "sonner";
import OrderTable from "../../components/Supplier/Order/OrderTable";
import OrderStatusStats from "../../components/Supplier/Order/OrderStatusStats";
import DetailOrderModal from "../../components/Supplier/Order/DetailOrderModal";
import ConfirmBatchShippingModal from "../../components/Supplier/Order/ConfirmBatchShippingModal";
import SupplierPageHeader, { SUPPLIER_PAGE_CLASS } from "../../components/Supplier/UI/SupplierPageHeader";
import { orderService, parseOrderList, extractOrderItems } from "../../services/api/orderService";
import { exportOrdersToExcel } from "../../utils/exportUtils";
import { matchesStatusFilter } from "../../components/Supplier/Order/orderStatusConfig";
import { useOrderRealtimeRefresh } from "../../hooks/useOrderRealtimeRefresh";
import { ORDER_REFERENCE_TYPES } from "../../utils/orderRealtimeUtils";

export default function OrderSupplierPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState(null);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");

  // State quản lý chọn đơn hàng loạt
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  // Cache items + returns theo order id (nhấc từ OrderTable lên để dùng chung sản phẩm cho modal confirm)
  const [detailCache, setDetailCache] = useState({});

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

  // Reset danh sách chọn khi từ khóa tìm kiếm thay đổi
  useEffect(() => {
    setSelectedIds([]);
  }, [search]);

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

  // Danh sách các đơn hàng hợp lệ đã chọn (phải ở trạng thái processing) và được gán kèm items từ detailCache
  const selectedOrders = data
    .filter((order) => selectedIds.includes(order.id) && order.status === "processing")
    .map((order) => {
      const cached = detailCache[order.id];
      const merged = { ...order };
      if (extractOrderItems(order).length === 0 && cached?.items?.length) {
        merged.items = cached.items;
      } else if (extractOrderItems(order).length > 0) {
        merged.items = extractOrderItems(order);
      } else {
        merged.items = [];
      }
      return merged;
    });

  const handleBatchShip = async () => {
    if (selectedOrders.length === 0) return;
    setBatchLoading(true);
    const toastId = toast.loading(`Đang xử lý giao hàng cho ${selectedOrders.length} đơn hàng...`);
    try {
      let successCount = 0;
      let failCount = 0;
      for (const order of selectedOrders) {
        try {
          await orderService.confirmShipping(order.id, {});
          successCount++;
        } catch (err) {
          console.error(`Lỗi khi giao hàng đơn ${order.order_code}:`, err);
          failCount++;
        }
      }
      toast.dismiss(toastId);
      if (failCount === 0) {
        toast.success(`Đã chuyển thành công ${successCount} đơn hàng sang trạng thái Đang giao.`);
      } else {
        toast.warning(`Hoàn tất: ${successCount} thành công, ${failCount} thất bại.`);
      }
      setSelectedIds([]);
      setIsBatchModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error("Lỗi giao hàng loạt:", error);
      toast.dismiss(toastId);
      toast.error("Có lỗi xảy ra trong quá trình xử lý giao hàng loạt.");
    } finally {
      setBatchLoading(false);
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
          onClick={async () => {
            const toastId = toast.loading("Đang tải dữ liệu đơn hàng và xuất Excel...");
            try {
              const keyword = (search ?? "").trim().toLowerCase();
              const filteredData = data.filter((row) => {
                const matchSearch =
                  !keyword ||
                  row.order_code?.toLowerCase().includes(keyword) ||
                  row.dealer_name?.toLowerCase().includes(keyword);
                const matchStatus = matchesStatusFilter(row, statusFilter);
                return matchSearch && matchStatus;
              });
              await exportOrdersToExcel(filteredData);
              toast.success("Xuất file Excel thành công!");
            } catch (error) {
              console.error("Lỗi xuất Excel:", error);
              toast.error(error?.message || "Có lỗi xảy ra khi xuất Excel.");
            } finally {
              toast.dismiss(toastId);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Xuất Excel
        </button>
      </div>

      {selectedOrders.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5 my-3 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-800">
              Đã chọn <strong className="font-extrabold text-blue-900">{selectedOrders.length}</strong> đơn hàng đang chuẩn bị
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm shadow-blue-100 cursor-pointer"
          >
            <Truck size={14} />
            Bắt đầu giao {selectedOrders.length} đơn
          </button>
        </div>
      )}

      <OrderTable
        data={data}
        search={search}
        loading={loading}
        onView={handleViewOrder}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        detailCache={detailCache}
        setDetailCache={setDetailCache}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <DetailOrderModal
        isOpen={detailRow !== null}
        onClose={() => setDetailRow(null)}
        order={detailRow}
        onUpdate={fetchOrders}
        refreshKey={detailRefreshKey}
      />

      <ConfirmBatchShippingModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onConfirm={handleBatchShip}
        selectedOrders={selectedOrders}
        loading={batchLoading}
      />
    </div>
  );
}
