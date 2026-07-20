import { useEffect, useState } from "react";
import { X, Loader2, AlertTriangle, AreaChart as AreaChartIcon } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { customerService } from "../../../services/api/customerService";
import { useAuth } from "../../../contexts/authProvider";

export default function CustomerSegmentChartModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSegmentationData();
    }
  }, [isOpen]);

  const fetchSegmentationData = async () => {
    const dealerId = user?.dealer_profile?.id || 7;
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getSegmentationHistory(dealerId);
      const rawData = res || [];
      // Lọc dữ liệu: lớn hơn 9 thì lấy 8 lần train mới nhất (các phần tử cuối cùng)
      const processedData = rawData.length > 9 ? rawData.slice(-8) : rawData;
      
      // Định dạng lại: chỉ lấy ngày, không lấy giờ
      const formattedData = processedData.map((item) => {
        let dateStr = "";
        if (item.formatted_created_at) {
          dateStr = item.formatted_created_at.split(" ")[0]; // Cắt bỏ phần giờ "09:01"
        } else if (item.created_at) {
          const d = new Date(item.created_at);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          dateStr = `${day}/${month}/${year}`;
        }
        return {
          ...item,
          formatted_created_at: dateStr,
        };
      });

      setData(formattedData);
    } catch (err) {
      console.error("Lỗi tải dữ liệu lịch sử phân loại:", err);
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
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <AreaChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-neutral-900">Biểu đồ Phân loại Khách hàng</h2>
              <p className="text-xs font-medium text-neutral-500 mt-0.5">
                Lịch sử diễn biến phân khúc khách hàng theo thời gian chạy AI
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
                <AreaChartIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-neutral-600 mb-1">Chưa có dữ liệu phân loại</p>
              <p className="text-xs text-neutral-500">Bạn cần chạy AI phân loại khách hàng để lưu lịch sử phân khúc.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="h-[420px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="formatted_created_at"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#4b5563", fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 600 }}
                      dx={-10}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        fontWeight: "bold",
                        fontSize: "13px"
                      }}
                      formatter={(value, name) => [`${value} khách hàng`, name]}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="vip_count"
                      name="Khách hàng VIP"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="potential_count"
                      name="Khách hàng Tiềm năng"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="passive_count"
                      name="Khách hàng Thụ động"
                      stackId="1"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="risk_count"
                      name="Khách hàng Rủi ro"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chú thích & Thông tin lần phân loại cuối cùng */}
              {data.length > 0 && (
                <div className="flex flex-col gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 mt-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/50 pb-3">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Lần phân loại cuối ({data[data.length - 1]?.formatted_created_at})
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      Độ tin cậy AI (Silhouette): {data[data.length - 1]?.silhouette_score ? data[data.length - 1].silhouette_score.toFixed(4) : "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 justify-start items-center">
                    {[
                      { label: "VIP", count: data[data.length - 1]?.vip_count || 0, color: "#10b981" },
                      { label: "Tiềm năng", count: data[data.length - 1]?.potential_count || 0, color: "#3b82f6" },
                      { label: "Thụ động", count: data[data.length - 1]?.passive_count || 0, color: "#f59e0b" },
                      { label: "Rủi ro", count: data[data.length - 1]?.risk_count || 0, color: "#ef4444" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200/50 rounded-xl shadow-2xs">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-bold text-neutral-700">{item.label}</span>
                        <span className="text-[10px] font-black text-neutral-400 border-l border-neutral-200 pl-1.5 ml-0.5">
                          {item.count} khách hàng
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
