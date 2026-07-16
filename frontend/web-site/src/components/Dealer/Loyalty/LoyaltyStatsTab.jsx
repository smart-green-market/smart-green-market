import { Loader2 } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";

export default function LoyaltyStatsTab({
  stats = [],
  loadingStats,
  colors = []
}) {
  return (
    <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs">
      <h2 className="text-base font-extrabold text-emerald-950 mb-2">Phân bố khách hàng theo hạng</h2>
      <p className="text-xs text-neutral-400 font-medium mb-6">Biểu đồ tổng quan số lượng khách hàng thuộc các mức hạng thành viên.</p>

      {loadingStats ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : stats.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 text-xs font-semibold">
          Không có dữ liệu thống kê. Bạn cần gán hạng thành viên cho khách hàng trước.
        </div>
      ) : (
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 600 }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "#f3f4f6" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                  fontWeight: "bold",
                  fontSize: "13px"
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
