import { Truck } from "lucide-react";
import { formatCurrency } from "./utils";

export default function TopSuppliers({ purchasedSuppliers = [], className = "" }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className={`bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-emerald-950">Đối tác nhập hàng</h2>
                    <p className="text-xs text-neutral-400">Danh sách nhà cung cấp sắp xếp theo tổng giá trị mua hàng</p>
                </div>
                <Truck className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            <th className="pb-3 font-semibold">Tên nhà cung cấp</th>
                            <th className="pb-3 font-semibold text-center">Số lần mua hàng</th>
                            <th className="pb-3 font-semibold text-right">Lần mua gần nhất</th>
                            <th className="pb-3 font-semibold text-right">Tổng tiền mua hàng</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {purchasedSuppliers.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="py-6 text-center text-sm text-neutral-400">
                                    Chưa có dữ liệu giao dịch với nhà cung cấp
                                </td>
                            </tr>
                        ) : (
                            purchasedSuppliers.map((item, idx) => (
                                <tr key={item.supplier_id || idx} className="hover:bg-neutral-50/30 transition-colors">
                                    <td className="py-3.5 text-xs font-bold text-neutral-800">
                                        {item.supplier_name}
                                    </td>
                                    <td className="py-3.5 text-xs font-medium text-neutral-600 text-center">
                                        {item.purchase_count} lần
                                    </td>
                                    <td className="py-3.5 text-xs text-neutral-500 text-right font-medium">
                                        {formatDate(item.last_purchase_time)}
                                    </td>
                                    <td className="py-3.5 text-xs font-bold text-emerald-600 text-right">
                                        {formatCurrency(item.total_purchase_amount)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
