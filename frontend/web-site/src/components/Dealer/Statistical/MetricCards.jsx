import { TrendingUp, ShoppingBag, ArrowUpRight, Percent } from "lucide-react";
import { formatCurrency } from "./formatCurrency";

/**
 * MetricCards
 * Displays 4 KPI cards: retail revenue, purchase cost, gross profit, profit margin.
 *
 * Props:
 *   metrics – object with shape:
 *     {
 *       total_revenue, total_purchase_cost, gross_profit, profit_margin,
 *       completed_sales_count, completed_purchases_count
 *     }
 */
export default function MetricCards({ metrics }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in duration-300">
            {/* Net Revenue */}
            <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Doanh thu bán lẻ</span>
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-xl font-black text-neutral-800 mb-1">{formatCurrency(metrics.total_revenue)}</h3>
                <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-block">
                    {metrics.completed_sales_count} đơn hoàn thành
                </p>
            </div>

            {/* Purchase Cost */}
            <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Chi phí nhập sỉ</span>
                    <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                        <ShoppingBag className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-xl font-black text-neutral-800 mb-1">{formatCurrency(metrics.total_purchase_cost)}</h3>
                <p className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded inline-block">
                    {metrics.completed_purchases_count} phiếu hoàn tất
                </p>
            </div>

            {/* Gross Profit */}
            <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Lợi nhuận gộp</span>
                    <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                        <ArrowUpRight className="w-4 h-4" />
                    </div>
                </div>
                <h3 className={`text-xl font-black mb-1 ${metrics.gross_profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {formatCurrency(metrics.gross_profit)}
                </h3>
                <p className="text-[10px] text-neutral-500 font-medium">Doanh thu trừ giá vốn nhập</p>
            </div>

            {/* Profit Margin */}
            <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Biên lợi nhuận gộp</span>
                    <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                        <Percent className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-xl font-black text-neutral-800 mb-1">
                    {new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(metrics.profit_margin)}%
                </h3>
                <p className="text-[10px] text-neutral-500 font-medium">Tỷ lệ lợi nhuận / doanh thu</p>
            </div>
        </div>
    );
}
