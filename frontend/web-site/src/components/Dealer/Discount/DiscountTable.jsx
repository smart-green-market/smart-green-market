import SortableHeader from "../../common/SortableHeader";
import Pagination from "../../common/Pagination";
import useTableSort from "../../../hooks/useTableSort";
import {
  formatDiscountValue,
  formatTimeDisplay,
  normalizeIsActive,
  SCOPE_LABELS,
} from "./discountPolicyUtils";

const COLUMN_CONFIG = {
  title: { key: "title", type: "string" },
  scope: { key: "scope", type: "string" },
  discount_value: { key: "discount_value", type: "number" }
};

export default function DiscountTable({
  policies,
  totalCount,
  page,
  setPage,
  limit,
  handleToggleActive,
  handleDelete,
  setSelectedPolicyId,
  setIsDetailModalOpen,
  setIsEditModalOpen
}) {
  const totalPages = Math.ceil(totalCount / limit);
  const { sortedData, sortColumn, sortDirection, handleSort } = useTableSort(policies, COLUMN_CONFIG);

  const scopeBadgeClass = (scope) => {
    if (scope === 'all') return 'bg-blue-50 text-blue-700';
    if (scope === 'category') return 'bg-purple-50 text-purple-700';
    if (scope === 'dealer_product') return 'bg-amber-50 text-amber-700';
    return 'bg-gray-50 text-gray-700';
  };

  const scopeDetail = (policy) => {
    if (policy.scope === 'category') {
      return policy.category_name || (policy.category && typeof policy.category === 'object' ? policy.category.name : null) || (policy.category ? `Danh mục #${policy.category}` : null);
    }
    if (policy.scope === 'dealer_product') {
      return policy.dealer_product_title || (policy.dealer_product && typeof policy.dealer_product === 'object' ? policy.dealer_product.title : null) || (policy.dealer_product ? `Sản phẩm #${policy.dealer_product}` : null);
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4 font-['Geist',sans-serif]">
      <div className="w-full rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left whitespace-nowrap border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader column="title" label="Tên chính sách" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader column="scope" label="Phạm vi" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader column="discount_value" label="Mức giảm" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Khung giờ
                </th>
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-center">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-center">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((policy, index) => {
                const isActive = normalizeIsActive(policy.is_active);
                const targetLabel = scopeDetail(policy);

                return (
                  <tr key={policy.id ?? `${policy.title || "policy"}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{policy.title || "Chưa có tên"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium w-fit ${scopeBadgeClass(policy.scope)}`}>
                          {SCOPE_LABELS[policy.scope] || policy.scope}
                        </span>
                        {targetLabel && (
                          <span className="text-xs text-neutral-500 mt-1 max-w-[200px] truncate block" title={targetLabel}>
                            {targetLabel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                        {formatDiscountValue(policy)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {formatTimeDisplay(policy.daily_start_time)} - {formatTimeDisplay(policy.daily_end_time)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isActive}
                        aria-label={isActive ? 'Tắt chính sách' : 'Bật chính sách'}
                        onClick={() => handleToggleActive(policy)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${isActive ? 'bg-green-500' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-4 text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPolicyId(policy.id);
                            setIsDetailModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPolicyId(policy.id);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(policy.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
