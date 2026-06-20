// src/components/OrderListEmpty.jsx

/**
 * Trạng thái rỗng — hiển thị khi danh sách đơn hàng (đã lọc) không có gì.
 */
export default function OrderListEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
      Không có đơn hàng nào trong mục này.
    </div>
  );
}
