import React from 'react';
import SortableHeader from "../../common/SortableHeader";
import Pagination from "../../common/Pagination";
import useTableSort from "../../../hooks/useTableSort";

const COLUMN_CONFIG = {
  title: { key: "title", type: "string" },
  scope: { key: "scope", type: "string" },
  tier_count: { key: "tier_count", type: "number" }
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

  return (
    <div className="flex flex-col gap-4 font-['Geist',sans-serif]">
      <div className="w-full rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left whitespace-nowrap border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader column="title" label="Tên chính sách" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader column="scope" label="Sản phẩm" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader column="tier_count" label="Tỷ lệ giảm" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-center">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-center">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((policy) => (
                <tr key={policy.id || Math.random()} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{policy.title || "Chưa có tên"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {policy.scope === 'all' ? "Tất cả sản phẩm" :
                        policy.scope === 'category' ? "Theo danh mục" :
                          policy.scope === 'dealer_product' ? "Sản phẩm cụ thể" : "Tất cả"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                      {policy.tier_count ? `${policy.tier_count} mức giảm` : "0 mức giảm"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleToggleActive(policy)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${policy.is_active ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${policy.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-4 text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedPolicyId(policy.id);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-green-600 hover:text-green-900 transition-colors"
                      >
                        Xem chi tiết
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPolicyId(policy.id);
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(policy.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
