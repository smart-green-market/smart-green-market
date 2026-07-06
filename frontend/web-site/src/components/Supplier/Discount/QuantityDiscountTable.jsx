import { QUANTITY_DISCOUNT_SCOPE_LABELS, formatTierLabel } from "../../../utils/quantityDiscountUtils";
import Pagination from "../../common/Pagination";

export default function QuantityDiscountTable({
  policies,
  totalCount,
  page,
  setPage,
  limit,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}) {
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Tên</th>
              <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Phạm vi</th>
              <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Bậc giảm</th>
              <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase text-center">Trạng thái</th>
              <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {policies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 text-sm">
                  Chưa có chính sách giảm giá theo số lượng
                </td>
              </tr>
            ) : (
              policies.map((policy) => (
                <tr key={policy.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">{policy.title}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {QUANTITY_DISCOUNT_SCOPE_LABELS[policy.scope] || policy.scope}
                    {policy.scope === "category" && policy.category_name && (
                      <span className="block text-xs text-neutral-400">{policy.category_name}</span>
                    )}
                    {policy.scope === "supplier_product" && policy.supplier_product_name && (
                      <span className="block text-xs text-neutral-400">{policy.supplier_product_name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">
                      {policy.tier_count || 0} bậc
                    </span>
                    {policy.max_discount_label && (
                      <span className="block text-xs text-neutral-400 mt-1">
                        Tối đa: {policy.max_discount_label}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onToggleActive(policy)}
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        policy.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {policy.is_active ? "Đang bật" : "Đã tắt"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => onView(policy.id)} className="text-xs text-blue-600 hover:underline">Xem</button>
                      <button onClick={() => onEdit(policy.id)} className="text-xs text-emerald-600 hover:underline">Sửa</button>
                      <button onClick={() => onDelete(policy.id)} className="text-xs text-red-600 hover:underline">Xóa</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-neutral-100">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
