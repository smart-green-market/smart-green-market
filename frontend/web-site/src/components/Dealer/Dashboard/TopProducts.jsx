import { Leaf } from "lucide-react";
import { formatCurrency } from "./utils";

export default function TopProducts({ topProducts }) {
    return (
        <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-emerald-950">Nông sản bán chạy</h2>
                    <p className="text-xs text-neutral-400">Top 10 mặt hàng tiêu thụ mạnh nhất</p>
                </div>
                <Leaf className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-2">
                {topProducts.length === 0 && <p className="text-sm text-neutral-400">Chưa có dữ liệu bán hàng</p>}
                {topProducts.map((item, idx) => {
                    const progressPercent = Math.min((item.sales / (item.sales + item.current_stock || 1)) * 100, 100);
                    return (
                        <div key={idx} className="flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-800">{item.name}</h4>
                                    <p className="text-[10px] text-neutral-400">{item.category}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(item.revenue)}</span>
                                    <p className="text-[10px] text-neutral-500">Đã bán: {item.sales}</p>
                                </div>
                            </div>
                            <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[9px] text-neutral-400">Tồn kho: {item.current_stock}</span>
                                <span className={`text-[9px] font-semibold ${item.current_stock > 10 ? "text-emerald-600" :
                                    item.current_stock > 0 ? "text-amber-600" : "text-red-500"
                                    }`}>
                                    {item.current_stock > 10 ? "Còn hàng" : item.current_stock > 0 ? "Sắp hết" : "Cháy hàng"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
