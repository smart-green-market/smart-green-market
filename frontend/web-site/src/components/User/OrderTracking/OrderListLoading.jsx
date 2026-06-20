// src/components/OrderListLoading.jsx

/**
 * Trạng thái đang tải danh sách đơn hàng.
 * Hiển thị khi page gọi API và đang chờ kết quả.
 */
export default function OrderListLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center bg-slate-50">
      <p className="text-slate-400">Đang tải đơn hàng...</p>
    </div>
  );
}
