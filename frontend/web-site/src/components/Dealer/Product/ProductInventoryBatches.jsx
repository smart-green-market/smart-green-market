import { useState, useMemo, useEffect } from "react";
import { PackageCheck, Edit } from "lucide-react";
import Pagination from "../../common/Pagination";
import UpdateProductModal from "../Inventory/UpdateProductModal";
import { dealerInventoryService } from "../../../services/api/dealerInventoryService";
import { toast } from "sonner";
import SortableHeader from "../../common/SortableHeader";
import useTableSort from "../../../hooks/useTableSort";

const COLUMN_CONFIG = {
  batch_number:       { key: "batch_number",       type: "string" },
  remaining_quantity: { key: "remaining_quantity", type: "number" },
  import_price:       { key: "import_price",       type: "number" },
  import_date:        { key: "import_date",        type: "date" },
  expiry_date:        { key: "expiry_date",        type: "date" },
  status:             { key: "status",             type: "string" },
};

export default function ProductInventoryBatches({
  batches,
  product,
  onUpdate,
  currentPage: propCurrentPage,
  totalPages: propTotalPages,
  onPageChange: propOnPageChange,
}) {
  const [selectedRow, setSelectedRow] = useState(null);
  const [localPage, setLocalPage] = useState(1);

  const isControlled = propOnPageChange !== undefined;
  const currentPage = isControlled ? (propCurrentPage || 1) : localPage;
  const onPageChange = isControlled ? propOnPageChange : setLocalPage;

  const { sortedData, sortColumn, sortDirection, handleSort } = useTableSort(batches, COLUMN_CONFIG);

  const PAGE_SIZE = 5;
  const totalPages = isControlled ? (propTotalPages || 1) : Math.max(1, Math.ceil((sortedData?.length || 0) / PAGE_SIZE));

  useEffect(() => {
    if (!isControlled) {
      setLocalPage(1);
    }
  }, [batches, isControlled]);

  const paginatedData = useMemo(() => {
    if (isControlled) return sortedData;
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedData.slice(start, start + PAGE_SIZE);
  }, [sortedData, isControlled, currentPage]);

  const handleSaveBatch = async (updatedBatch) => {
    if (updatedBatch.wastageData && updatedBatch.originalData?.id) {
      try {
        await dealerInventoryService.recordWastage(
          updatedBatch.originalData.id,
          updatedBatch.wastageData
        );
        toast.success("Ghi nhận hao hụt thành công!");
      } catch (error) {
        console.error("Lỗi khi ghi nhận hao hụt:", error);
        toast.error("Không thể ghi nhận hao hụt.");
      }
    }
    if (onUpdate) {
      await onUpdate();
    }
    setSelectedRow(null);
  };
  return (
    <div className="bg-white border border-neutral-100 rounded-2xl shadow-xs overflow-hidden font-['Geist',sans-serif]">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-100">
        <PackageCheck className="w-5 h-5 text-emerald-600" />
        <h2 className="text-base font-bold text-emerald-950">Lô hàng liên quan</h2>
      </div>

      {!batches || batches.length === 0 ? (
        <div className="py-8 text-sm text-neutral-500 text-center font-semibold">
          Không có dữ liệu lô hàng.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left whitespace-nowrap">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200/60">
                  <SortableHeader label="Mã lô" column="batch_number" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Tồn kho" column="remaining_quantity" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Giá nhập" column="import_price" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Ngày nhập" column="import_date" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Hạn dùng" column="expiry_date" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Trạng thái" column="status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                  <th className="px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-wider text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedData.map((row, index) => {
                  const isOutOfStock = row.remaining_quantity <= 0;
                  return (
                    <tr key={row.id || index} className="hover:bg-emerald-50/30 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-emerald-800">{row.batch_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-neutral-800">{row.remaining_quantity} {row.supplier_product_unit || "kg"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-neutral-500 text-xs">
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(row.import_price)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-neutral-500 text-xs">
                          {row.import_date ? new Date(row.import_date).toLocaleDateString("vi-VN") : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-neutral-600 font-bold text-xs">
                          {row.expiry_date ? new Date(row.expiry_date).toLocaleDateString("vi-VN") : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isOutOfStock ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                          {isOutOfStock ? "Hết hàng" : "Còn hàng"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const modalData = {
                              batchCode: row.batch_number,
                              productName: product?.title || row.dealer_product_title || "Nông sản",
                              category: product?.category?.name || row.category?.name || "---",
                              supplier: row.supplier_name || "---",
                              stock: row.remaining_quantity,
                              unit: row.supplier_product_unit || "kg",
                              discount: row.discount || 0,
                              discountDate: row.discount_date || "",
                              originalData: row,
                            };
                            setSelectedRow(modalData);
                          }}
                          title="Cập nhật lô hàng"
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </div>
      )}

      {selectedRow && (
        <UpdateProductModal
          data={selectedRow}
          onClose={() => setSelectedRow(null)}
          onSave={handleSaveBatch}
        />
      )}
    </div>
  );
}
