import { formatCurrency } from "./formatCurrency";

/**
 * CategoryDistribution
 * Shows revenue & purchase cost distribution across product categories as progress bars.
 *
 * Props:
 *   categoryDistribution – array of { category, sales, purchases }
 */
export default function CategoryDistribution({ categoryDistribution }) {
    return (
        <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-base font-extrabold text-emerald-950">Phân tích theo Ngành hàng</h2>
                    <p className="text-xs text-neutral-400 font-medium">Cơ cấu doanh thu &amp; nhập hàng theo danh mục</p>
                </div>
            </div>

            {categoryDistribution.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-neutral-400 text-xs font-medium">
                    Không có dữ liệu ngành hàng
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[250px]">
                    {categoryDistribution.map((item, idx) => {
                        const totalBoth = item.sales + item.purchases;
                        const salesPct = totalBoth > 0 ? (item.sales / totalBoth) * 100 : 0;
                        const purchasesPct = totalBoth > 0 ? (item.purchases / totalBoth) * 100 : 0;

                        return (
                            <div key={idx} className="p-3 bg-neutral-50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-neutral-700">{item.category}</span>
                                    <span className="text-[10px] font-black text-neutral-500">
                                        Tổng: {formatCurrency(totalBoth)}
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    {/* Sales proportion */}
                                    <div className="space-y-0.5">
                                        <div className="flex justify-between text-[10px] text-neutral-400 font-medium">
                                            <span>Doanh thu bán ra</span>
                                            <span className="text-emerald-700 font-bold">
                                                {formatCurrency(item.sales)} ({salesPct.toFixed(0)}%)
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${salesPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Purchase proportion */}
                                    <div className="space-y-0.5">
                                        <div className="flex justify-between text-[10px] text-neutral-400 font-medium">
                                            <span>Chi phí nhập sỉ</span>
                                            <span className="text-amber-700 font-bold">
                                                {formatCurrency(item.purchases)} ({purchasesPct.toFixed(0)}%)
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-500 rounded-full"
                                                style={{ width: `${purchasesPct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
