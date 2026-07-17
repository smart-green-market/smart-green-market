import { useEffect, useState } from "react";
import { X, Loader2, AlertTriangle, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { customerService } from "../../../services/api/customerService";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b", "#ec4899"];

export default function CustomerSegmentChartModal({ isOpen, onClose }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSegmentationData();
    }
  }, [isOpen]);

  const fetchSegmentationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getSegmentStats();
      setData(res || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu phân loại:", err);
      setError("Không thể tải biểu đồ phân loại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-neutral-900">Biểu đồ Phân loại Khách hàng</h2>
              <p className="text-xs font-medium text-neutral-500 mt-0.5">
                Thống kê số lượng khách hàng theo từng phân khúc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
              <p className="text-sm font-medium text-neutral-500">Đang tổng hợp dữ liệu khách hàng...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-red-600 mb-1">Đã có lỗi xảy ra</p>
              <p className="text-xs text-neutral-500 max-w-xs">{error}</p>
              <button 
                onClick={fetchSegmentationData}
                className="mt-4 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-bold transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-50 text-neutral-400 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-neutral-600 mb-1">Chưa có dữ liệu phân loại</p>
              <p className="text-xs text-neutral-500">Bạn cần Train AI để phân loại khách hàng trước.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={false}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 600 }}
                      dx={-10}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", fontWeight: "bold", fontSize: "13px" }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chú thích màu sắc khách hàng */}
              <div className="flex flex-wrap gap-4 justify-start items-center p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200/50 rounded-xl shadow-2xs">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs font-bold text-neutral-700">{item.name}</span>
                    <span className="text-[10px] font-black text-neutral-400 border-l border-neutral-200 pl-1.5 ml-0.5">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
