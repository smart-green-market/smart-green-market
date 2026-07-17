import { Leaf, ClipboardList } from "lucide-react";
import { formatCurrency } from "./formatCurrency";

/**
 * WastageStats
 * Displays inventory wastage and supplier return statistics.
 *
 * Props:
 *   wastageStats – object with shape:
 *     { total_wastage_quantity, total_wastage_cost, total_returned_quantity, total_returned_cost }
 */
export default function WastageStats({ wastageStats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Inventory Wastage */}
            <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-rose-50 text-rose-700 rounded-2xl shadow-xs">
                        <Leaf className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                            Hao hụt tồn kho
                        </h4>
                        <p className="text-xs text-neutral-400 font-medium">Sản phẩm tiêu hủy hoặc quá hạn sử dụng</p>
                    </div>
                </div>
                <div className="text-right">
                    <h3 className="text-lg font-black text-rose-700">{formatCurrency(wastageStats.total_wastage_cost)}</h3>
                    <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded">
                        {wastageStats.total_wastage_quantity} kg hao hụt
                    </span>
                </div>
            </div>

            {/* Returns to Suppliers */}
            <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-amber-50 text-amber-700 rounded-2xl shadow-xs">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                            Trả hàng cho Nhà cung cấp
                        </h4>
                        <p className="text-xs text-neutral-400 font-medium">Sản phẩm bị lỗi hoặc không đạt chuẩn sỉ</p>
                    </div>
                </div>
                <div className="text-right">
                    <h3 className="text-lg font-black text-amber-700">
                        {formatCurrency(wastageStats.total_returned_cost)}
                    </h3>
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded">
                        {wastageStats.total_returned_quantity} kg trả lại
                    </span>
                </div>
            </div>
        </div>
    );
}
