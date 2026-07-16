import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Info,
  Cpu
} from "lucide-react";
import aiPredictionService from "../../../services/api/aiPredictionService";
import { dealerService } from "../../../services/api/dealerService";

export default function DealerAiPredictionPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("predictions"); // "predictions" | "recommendations"
  const [predictions, setPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [summaryKpi, setSummaryKpi] = useState(null);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dealerProfile, setDealerProfile] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDecisionType, setFilterDecisionType] = useState("");

  const loadData = async (showLoading = true, cat = filterCategory, dec = filterDecisionType) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      let profile = dealerProfile;
      if (!profile) {
        try {
          profile = await dealerService.getMe();
          setDealerProfile(profile);
        } catch (e) {
          console.error("Failed to fetch dealer info, using default dealer_id = 7", e);
        }
      }

      const dealerId = profile?.id || 7;

      // Gọi song song 2 API dự báo & khuyến nghị
      const [predictionsData, recommendationsData] = await Promise.all([
        aiPredictionService.getProductPredictions(),
        aiPredictionService.getDecisionRecommendations(dealerId, cat, dec),
      ]);

      const recs = recommendationsData && Array.isArray(recommendationsData.recommendations)
        ? recommendationsData.recommendations
        : [];

      if (recommendationsData && recommendationsData.summary_kpi) {
        setSummaryKpi(recommendationsData.summary_kpi);
      }

      // Tạo danh sách dự báo động từ dữ liệu khuyến nghị thực tế (vì có forecast_next_days)
      let preds = [];
      if (recs.length > 0) {
        // Trích xuất dự báo sản lượng bán (sales volume/demand forecasting) từ AI recommendations thật
        preds = recs.map((r, idx) => {
          const isUp = r.growth_rate > 0.02;
          const isDown = r.growth_rate < -0.02;
          const trend = isUp ? "up" : isDown ? "down" : "stable";

          // Tạo nhãn ngày dự báo (7 ngày kể từ hôm nay)
          const dates = [];
          const baseDate = new Date();
          const forecastDaysCount = r.forecast_next_days?.length || 7;
          for (let i = 0; i < forecastDaysCount; i++) {
            const d = new Date(baseDate);
            d.setDate(baseDate.getDate() + i);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            dates.push(`${day}/${month}`);
          }

          return {
            id: r.dealer_product_id || idx,
            product_name: r.product_name,
            category: r.category,
            current_price: r.recent_avg_daily_sales || 0, // Giá trị sản lượng bán trung bình
            predicted_price: r.forecast_next_days ? r.forecast_next_days[r.forecast_next_days.length - 1] : r.recent_avg_daily_sales,
            confidence: Math.round(r.decision_confidence * 100) || 95,
            trend: trend,
            forecast_dates: dates,
            forecast_prices: r.forecast_next_days || Array(7).fill(r.recent_avg_daily_sales),
            is_sales_volume: true // Cờ đánh dấu đây là sản lượng để đổi VND thành kg
          };
        });
      } else {
        // Fallback về mock giá mặc định nếu không có dữ liệu recommendations
        preds = Array.isArray(predictionsData) ? predictionsData : [];
      }

      setPredictions(preds);
      setRecommendations(recs);
      if (preds.length > 0) {
        setSelectedPrediction(prev => {
          if (prev) {
            const found = preds.find(p => p.id === prev.id);
            return found || preds[0];
          }
          return preds[0];
        });
      }
    } catch (err) {
      console.error("Error loading AI Prediction data:", err);
      setError("Không thể tải thông tin từ hệ thống AI. Vui lòng kết nối server backend và thử lại.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Tránh gọi trùng lặp lúc mount
    const delayDebounce = setTimeout(() => {
      if (!loading) {
        loadData(false, filterCategory, filterDecisionType);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [filterCategory, filterDecisionType]);

  const handleTrainAi = async () => {
    if (training) return;
    setTraining(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const dealerId = dealerProfile?.id || 7;
      const res = await aiPredictionService.trainAiModel(dealerId);
      setSuccessMessage(res.message || "Huấn luyện AI thành công! Đang cập nhật dữ liệu...");

      // Tự động đóng thông báo sau 5 giây
      setTimeout(() => setSuccessMessage(""), 5000);

      // Load lại dữ liệu dự đoán mới nhất
      await loadData(false);
    } catch (e) {
      console.error("Error training AI model:", e);
      const backendError = e.response?.data?.error || e.message || "Đã xảy ra lỗi trong quá trình huấn luyện.";
      setErrorMessage(`Huấn luyện thất bại: ${backendError}`);

      // Tự động đóng thông báo sau 6 giây
      setTimeout(() => setErrorMessage(""), 6000);
    } finally {
      setTraining(false);
    }
  };

  const handleAnalyzeAi = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const dealerId = dealerProfile?.id || 7;
      const res = await aiPredictionService.analyzeAiData(dealerId);
      setSuccessMessage(res.message || "Phân tích dữ liệu & dự báo thành công!");

      // Tự động đóng thông báo sau 5 giây
      setTimeout(() => setSuccessMessage(""), 5000);

      // Load lại dữ liệu dự đoán mới nhất
      await loadData(false);
    } catch (e) {
      console.error("Error analyzing AI data:", e);
      const backendError = e.response?.data?.error || e.message || "Đã xảy ra lỗi trong quá trình phân tích.";
      setErrorMessage(`Phân tích thất bại: ${backendError}`);

      // Tự động đóng thông báo sau 6 giây
      setTimeout(() => setErrorMessage(""), 6000);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
          <p className="text-sm text-neutral-500 font-medium font-['Geist']">Đang xử lý dữ liệu AI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif] flex justify-center items-center">
        <div className="bg-white border border-rose-100 rounded-2xl p-8 max-w-md shadow-xs text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-extrabold text-neutral-800 mb-1">Lỗi kết nối hệ thống AI</h2>
          <p className="text-xs text-neutral-500 leading-relaxed mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer"
          >
            Thử tải lại trang
          </button>
        </div>
      </div>
    );
  }

  // Tiện ích format tiền tệ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Tiện ích format hiển thị động (Tiền tệ hoặc Sản lượng)
  const formatValue = (val, isSalesVolume) => {
    if (isSalesVolume) {
      return `${val.toFixed(2)} kg/ngày`;
    }
    return formatCurrency(val);
  };

  // Xác định icon xu hướng
  const renderTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-rose-600" />;
      default:
        return <Minus className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getTrendBadge = (trend) => {
    switch (trend) {
      case "up":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
            <TrendingUp className="w-3 h-3" /> Xu hướng tăng
          </span>
        );
      case "down":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
            <TrendingDown className="w-3 h-3" /> Xu hướng giảm
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-50 text-neutral-600">
            <Minus className="w-3 h-3" /> Ổn định
          </span>
        );
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Khẩn cấp
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Cần chú ý
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Info className="w-3.5 h-3.5" /> Thông tin
          </span>
        );
    }
  };

  // Vẽ biểu đồ SVG tùy biến cho dự báo
  const renderSVGChart = (data) => {
    if (!data || !data.forecast_prices || data.forecast_prices.length < 2) {
      return (
        <div className="bg-white border border-emerald-100/30 rounded-xl p-4 shadow-2xs text-center py-8">
          <p className="text-xs text-neutral-400 font-medium">Không đủ dữ liệu dự báo để hiển thị biểu đồ.</p>
        </div>
      );
    }

    const prices = data.forecast_prices;
    const dates = data.forecast_dates || [];
    const isSales = data.is_sales_volume;

    const minPrice = Math.min(...prices) * 0.95; // Margin dưới
    const maxPrice = Math.max(...prices) * 1.05; // Margin trên
    const priceRange = (maxPrice - minPrice) || 1;

    // Kích thước SVG
    const width = 500;
    const height = 220;
    const padding = { top: 20, right: 30, bottom: 30, left: 60 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Tính tọa độ cho từng điểm
    const points = prices.map((price, index) => {
      const x = padding.left + (index / (prices.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
      return { x, y, price, date: dates[index] };
    });

    // Tạo chuỗi đường thẳng nối các điểm (D path)
    const linePath = points.reduce((path, point, index) => {
      return index === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`;
    }, "");

    // Tạo vùng đổ màu gradient dưới đường line
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

    const chartTitle = isSales
      ? "Biểu đồ dự báo sản lượng bán 7 ngày tới (kg/ngày)"
      : "Biểu đồ dự báo giá 7 ngày tới (VND/kg)";

    return (
      <div className="bg-white border border-emerald-100/30 rounded-xl p-4 shadow-2xs">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{chartTitle}</span>
          <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Mô hình AI dự đoán</span>
        </div>
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible font-['Geist']">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const yVal = padding.top + chartHeight * ratio;
              const priceLabel = maxPrice - ratio * priceRange;
              return (
                <g key={idx} className="opacity-40">
                  <line
                    x1={padding.left}
                    y1={yVal}
                    x2={width - padding.right}
                    y2={yVal}
                    stroke="#E5E7EB"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={padding.left - 8}
                    y={yVal + 4}
                    textAnchor="end"
                    fill="#9CA3AF"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {isSales ? priceLabel.toFixed(1) : Math.round(priceLabel).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Area Path */}
            <path d={areaPath} fill="url(#chartGradient)" />

            {/* Line Path */}
            <path
              d={linePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dots on points */}
            {points.map((point, index) => (
              <g key={index} className="group/dot cursor-pointer">
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  className="transition-all duration-200 hover:r-6 hover:fill-emerald-600"
                />
                {/* Tooltip hiển thị giá trị */}
                <text
                  x={point.x}
                  y={point.y - 10}
                  textAnchor="middle"
                  fill="#065f46"
                  fontSize="9"
                  fontWeight="bold"
                  className="opacity-0 group-hover/dot:opacity-100 transition-opacity bg-neutral-900 px-1.5 py-0.5 rounded"
                >
                  {isSales ? `${point.price.toFixed(2)} kg` : `${(point.price / 1000).toFixed(0)}k`}
                </text>
              </g>
            ))}

            {/* X Axis Labels */}
            {points.map((point, index) => (
              <text
                key={index}
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                fill="#9CA3AF"
                fontSize="10"
                fontWeight="600"
              >
                {point.date}
              </text>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const isSalesVolumeForecast = predictions.length > 0 && predictions[0].is_sales_volume;

  return (
    <div className="p-6 bg-emerald-50/15 min-h-screen font-['Geist',sans-serif]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-green-600 rounded-xl text-white shadow-md shadow-emerald-500/10">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-emerald-950 tracking-tight">Trợ lý Phân tích AI</h1>
          </div>
          <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
            Hệ thống phân tích dự đoán xu hướng giá nông sản, sản lượng bán ra và đề xuất tự động các quyết định hành động nhằm tối đa biên lợi nhuận của đại lý.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Train AI Button */}
          <button
            onClick={handleTrainAi}
            disabled={training}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs ${training
              ? "bg-emerald-100 text-emerald-400 border border-emerald-200 cursor-not-allowed"
              : "bg-gradient-to-tr from-emerald-600 to-green-500 text-white hover:shadow-md hover:from-emerald-700 hover:to-green-600 active:scale-95 border border-emerald-500/20"
              }`}
          >
            {training ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-emerald-500"></div>
                <span>Đang huấn luyện...</span>
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5" />
                <span>Huấn luyện AI</span>
              </>
            )}
          </button>

          {/* Analyze / Run Prediction Button */}
          <button
            onClick={handleAnalyzeAi}
            disabled={analyzing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs ${analyzing
              ? "bg-blue-100 text-blue-400 border border-blue-200 cursor-not-allowed"
              : "bg-gradient-to-tr from-blue-600 to-indigo-500 text-white hover:shadow-md hover:from-blue-700 hover:to-indigo-600 active:scale-95 border border-blue-500/20"
              }`}
            title="Tải model đã train từ đĩa cứng, chạy dự báo cho dữ liệu kho mới nhất và cập nhật đè vào Database."
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-500"></div>
                <span>Đang phân tích...</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5" />
                <span>Chạy dự báo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tab Switcher Row */}
      <div className="flex justify-end mb-4">
        <div className="bg-neutral-100/80 backdrop-blur-xs p-1 rounded-xl flex items-center border border-neutral-200/40 shadow-2xs">
          <button
            onClick={() => setActiveTab("predictions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === "predictions"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-neutral-500 hover:text-neutral-800"
              }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {isSalesVolumeForecast ? "Dự báo nhu cầu" : "Xu hướng giá"}
          </button>
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === "recommendations"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-neutral-500 hover:text-neutral-800"
              }`}
          >
            <Brain className="w-3.5 h-3.5" />
            Gợi ý quyết định
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-fade-in shadow-2xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce" />
          <div className="flex-1 text-xs font-bold text-emerald-800">{successMessage}</div>
          <button onClick={() => setSuccessMessage("")} className="text-emerald-400 hover:text-emerald-600 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 animate-fade-in shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />
          <div className="flex-1 text-xs font-bold text-rose-800">{errorMessage}</div>
          <button onClick={() => setErrorMessage("")} className="text-rose-400 hover:text-rose-600 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Content Areas */}
      {activeTab === "predictions" ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left panel: Product List */}
          <div className="lg:col-span-3 bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs flex flex-col">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-base font-extrabold text-neutral-800">
                  {isSalesVolumeForecast ? "Dự báo nhu cầu sản lượng bán" : "Danh sách nông sản phân tích"}
                </h2>
                <p className="text-xs text-neutral-400">Chọn sản phẩm cụ thể để xem chi tiết biểu đồ dự báo xu hướng</p>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2.5 py-1 rounded-lg">
                Số lượng: {predictions.length} sản phẩm
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Sản phẩm</th>
                    <th className="pb-3 text-right">{isSalesVolumeForecast ? "Bán TB gần đây" : "Giá hiện tại"}</th>
                    <th className="pb-3 text-right">Dự báo 7 ngày</th>
                    <th className="pb-3 text-center">Xu hướng</th>
                    <th className="pb-3 pr-2 text-right">Độ tin cậy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100/60">
                  {predictions.map((p) => {
                    const priceDiff = p.predicted_price - p.current_price;
                    const percentDiff = p.current_price > 0 ? (priceDiff / p.current_price) * 100 : 0;
                    const isSelected = selectedPrediction?.id === p.id;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPrediction(p)}
                        className={`group cursor-pointer transition-colors hover:bg-emerald-50/30 ${isSelected ? "bg-emerald-50/50" : ""
                          }`}
                      >
                        <td className="py-3.5 pl-2">
                          <span className="text-sm font-bold text-neutral-700 group-hover:text-emerald-700 transition-colors">
                            {p.product_name}
                          </span>
                          <span className="block text-[10px] text-neutral-400">{p.category}</span>
                        </td>
                        <td className="py-3.5 text-right font-medium text-neutral-600 text-sm">
                          {formatValue(p.current_price, p.is_sales_volume)}
                        </td>
                        <td className="py-3.5 text-right font-bold text-neutral-800 text-sm">
                          <div>{formatValue(p.predicted_price, p.is_sales_volume)}</div>
                          <span
                            className={`text-[10px] font-semibold ${priceDiff > 0
                              ? "text-emerald-600"
                              : priceDiff < 0
                                ? "text-rose-600"
                                : "text-neutral-400"
                              }`}
                          >
                            {priceDiff > 0 ? "+" : ""}
                            {percentDiff.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="flex justify-center">{renderTrendIcon(p.trend)}</div>
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-bold text-neutral-600">{p.confidence}%</span>
                            <div className="w-16 bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${p.confidence}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel: Prediction Details & Chart */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {selectedPrediction ? (
              <>
                {/* Details Card */}
                <div className="bg-white border border-emerald-100/50 rounded-2xl p-6 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8"></div>

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Chi tiết dự báo</span>
                      <h3 className="text-lg font-black text-neutral-800 mt-0.5">{selectedPrediction.product_name}</h3>
                    </div>
                    {getTrendBadge(selectedPrediction.trend)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-neutral-100">
                    <div>
                      <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                        {selectedPrediction.is_sales_volume ? "Sản lượng hiện hành" : "Giá hiện hành"}
                      </span>
                      <span className="text-base font-bold text-neutral-700">
                        {formatValue(selectedPrediction.current_price, selectedPrediction.is_sales_volume)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                        {selectedPrediction.is_sales_volume ? "Sản lượng dự đoán (7 ngày)" : "Giá dự đoán (7 ngày)"}
                      </span>
                      <span className="text-base font-extrabold text-emerald-600">
                        {formatValue(selectedPrediction.predicted_price, selectedPrediction.is_sales_volume)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                    <p className="text-xs text-neutral-500 font-medium">
                      Độ tin cậy mô hình: <span className="font-bold text-neutral-700">{selectedPrediction.confidence}%</span>
                    </p>
                  </div>
                </div>

                {/* SVG Chart Card */}
                {renderSVGChart(selectedPrediction)}
              </>
            ) : (
              <div className="bg-white border border-emerald-100/50 rounded-2xl p-8 shadow-xs text-center my-auto">
                <HelpCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-neutral-400">Chọn một nông sản ở bảng bên trái để xem biểu đồ chi tiết.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Decision Recommendations */
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Bộ lọc gợi ý */}
          <div className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-neutral-800 mb-1">Bộ lọc đề xuất</h3>
              <p className="text-[11px] text-neutral-400">Lọc kết quả AI theo danh mục và loại quyết định từ database</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Category Filter */}
              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Danh mục</label>
                <input
                  type="text"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  placeholder="Ví dụ: Rau củ, Trái cây..."
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-neutral-50/50"
                />
              </div>

              {/* Decision Type Filter */}
              <div className="w-full sm:w-56">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Loại quyết định</label>
                <select
                  value={filterDecisionType}
                  onChange={(e) => setFilterDecisionType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-neutral-50/50"
                >
                  <option value="">Tất cả quyết định</option>
                  <option value="Nhập hàng gấp">Nhập hàng gấp</option>
                  <option value="Nhập thêm hàng">Nhập thêm hàng</option>
                  <option value="Duy trì">Duy trì</option>
                  <option value="Khuyến mãi đẩy hàng">Khuyến mãi đẩy hàng</option>
                  <option value="Giảm nhập / ngừng nhập">Giảm nhập / ngừng nhập</option>
                </select>
              </div>

              {/* Clear Filter Button */}
              {(filterCategory || filterDecisionType) && (
                <button
                  onClick={() => {
                    setFilterCategory("");
                    setFilterDecisionType("");
                  }}
                  className="w-full sm:w-auto px-4 py-2 mt-4 sm:mt-auto bg-neutral-900 text-white hover:bg-emerald-600 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer h-[38px] flex items-center justify-center shrink-0"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          {/* KPI Summary Block */}
          {summaryKpi && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-2xs text-center">
                <span className="text-xs font-semibold text-rose-500 block">Nhập hàng gấp</span>
                <span className="text-xl font-black text-neutral-800">{summaryKpi.nhap_hang_gap || 0}</span>
              </div>
              <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-2xs text-center">
                <span className="text-xs font-semibold text-emerald-500 block">Nhập thêm</span>
                <span className="text-xl font-black text-neutral-800">{summaryKpi.nhap_them || 0}</span>
              </div>
              <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-2xs text-center">
                <span className="text-xs font-semibold text-blue-500 block">Duy trì</span>
                <span className="text-xl font-black text-neutral-800">{summaryKpi.duy_tri || 0}</span>
              </div>
              <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-2xs text-center">
                <span className="text-xs font-semibold text-amber-500 block">Khuyến mãi</span>
                <span className="text-xl font-black text-neutral-800">{summaryKpi.khuyen_mai || 0}</span>
              </div>
              <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-2xs text-center">
                <span className="text-xs font-semibold text-neutral-500 block">Giảm nhập</span>
                <span className="text-xl font-black text-neutral-800">{summaryKpi.giam_nhap || 0}</span>
              </div>
            </div>
          )}

          <div className="bg-emerald-600 text-white rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-100" /> Trợ lý đề xuất kinh doanh
              </h2>
              <p className="text-xs text-emerald-100/80 max-w-xl">
                AI phân tích dữ liệu tồn kho, xu hướng thị trường và dự báo nhu cầu để đưa ra các gợi ý tối ưu lượng hàng hóa của đại lý nhằm tối đa doanh thu và giảm thiểu rác thải sinh học.
              </p>
            </div>
            {/* <span className="text-xs font-extrabold bg-white/15 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
              Cập nhật: Mới nhất
            </span> */}
          </div>

          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={rec.dealer_product_id || index}
                className="bg-white border border-neutral-100 hover:border-emerald-100 rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  {/* Icon depending on type */}
                  <div className={`p-3 rounded-xl shrink-0 mt-0.5 ${rec.type === "import_alert"
                    ? "bg-emerald-50 text-emerald-600"
                    : rec.type === "discount_alert"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-blue-50 text-blue-600"
                    }`}>
                    {rec.type === "import_alert" ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : rec.type === "discount_alert" ? (
                      <PercentIcon className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-neutral-800">{rec.title}</h3>
                      {getUrgencyBadge(rec.urgency)}
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed max-w-2xl">{rec.description}</p>
                    {/* Probabilities preview */}
                    {rec.all_probabilities && (
                      <div className="text-[10px] text-neutral-400/85 pt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-medium border-t border-neutral-50">
                        <span>Xác suất AI:</span>
                        {Object.entries(rec.all_probabilities).map(([decisionName, prob]) => (
                          <span key={decisionName} className={prob > 0.5 ? "text-emerald-600 font-bold" : ""}>
                            {decisionName}: {(prob * 100).toFixed(1)}%
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => navigate(rec.action_link)}
                  className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-900 text-white hover:bg-green-700 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  {rec.action_label}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// React Icons helper since Percent might not be in Lucide version or as standard
function PercentIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="19" y1="5" x2="5" y2="19"></line>
      <circle cx="6.5" cy="6.5" r="2.5"></circle>
      <circle cx="17.5" cy="17.5" r="2.5"></circle>
    </svg>
  );
}
