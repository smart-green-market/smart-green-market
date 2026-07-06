import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    ArrowUpRight,
    CheckCircle2,
    Clock3,
    FileCheck,
    FileText,
    Loader2,
    Package,
    RefreshCw,
    Store,
    Truck,
    DollarSign,
    Users,
    TrendingUp,
    Award
} from "lucide-react";

import {
    AdminPageLoadError,
    AdminPageLoading,
    AdminPageShell,
} from "../../components/Admin/UI/AdminFetchState";
import { useAuth } from "../../contexts/authProvider";
import { accountDocumentService } from "../../services/api/accountDocumentService";
import { certificationService } from "../../services/api/certificationService";
import { dealerService, handleApiError as handleDealerError } from "../../services/api/dealerService";
import { productService, handleApiError as handleProductError } from "../../services/api/productService";
import { supplierService, handleApiError as handleSupplierError } from "../../services/api/suppilerService";
import { adminDashboardService } from "../../services/api/Admin/adminDashboardService";
import {
    buildDashboardSummary,
    buildPendingQueue,
    formatRelativeTimeVi,
    normalizeListResponse,
    PENDING_QUEUE_TYPE,
} from "../../utils/adminDashboardUtils";

const STAT_CARDS = [
    {
        key: "suppliers",
        label: "Nhà cung cấp chờ duyệt",
        href: "/quan-tri/nha-cung-cap",
        icon: Truck,
        accent: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
    },
    {
        key: "dealers",
        label: "Đại lý chờ duyệt",
        href: "/quan-tri/dai-ly",
        icon: Store,
        accent: "text-sky-700",
        bg: "bg-sky-50",
        border: "border-sky-100",
    },
    {
        key: "documents",
        label: "Giấy tờ chờ duyệt",
        href: "/quan-tri/giay-to",
        icon: FileText,
        accent: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-100",
    },
    {
        key: "certifications",
        label: "Chứng chỉ chờ duyệt",
        href: "/quan-tri/chung-chi",
        icon: FileCheck,
        accent: "text-violet-700",
        bg: "bg-violet-50",
        border: "border-violet-100",
    },
    {
        key: "products",
        label: "Sản phẩm chờ duyệt",
        href: "/quan-tri/san-pham",
        icon: Package,
        accent: "text-lime-700",
        bg: "bg-lime-50",
        border: "border-lime-100",
    },
];

const VND_FORMATTER = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
});

const formatCurrency = (val) => {
    if (val == null || isNaN(Number(val))) return "0 đ";
    return `${VND_FORMATTER.format(Math.round(Number(val)))} đ`;
};

function KPIOverviewCard({ title, value, icon: Icon, colorClass, bgClass, borderClass }) {
    return (
        <div className={`rounded-2xl border ${borderClass} bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between`}>
            <div className="min-w-0">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block truncate">{title}</span>
                <h3 className="mt-2 text-2xl font-black text-neutral-900 leading-none truncate">
                    {value}
                </h3>
            </div>
            <div className={`rounded-xl p-3 shrink-0 ${bgClass} ${colorClass}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    );
}

function DashboardStatCard({ card, stats }) {
    const Icon = card.icon;
    const pending = stats?.pending ?? 0;
    const total = stats?.total ?? 0;

    return (
        <Link
            to={card.href}
            className={`group rounded-2xl border ${card.border} bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md no-underline`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        {card.label}
                    </p>
                    <p className={`mt-2 text-3xl font-bold ${pending > 0 ? card.accent : "text-neutral-800"}`}>
                        {pending}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                        {total > 0 ? `${total} hồ sơ trong hệ thống` : "Chưa có dữ liệu"}
                    </p>
                </div>
                <div className={`rounded-xl p-3 ${card.bg} ${card.accent}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-800 opacity-0 transition-opacity group-hover:opacity-100">
                Xem danh sách
                <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
        </Link>
    );
}

function PendingEntityPanel({ title, description, href, items, emptyText, renderItem }) {
    return (
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4 shrink-0">
                <div>
                    <h2 className="text-base font-bold text-neutral-900 leading-none">{title}</h2>
                    <p className="mt-1 text-xs text-neutral-500">{description}</p>
                </div>
                <Link
                    to={href}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 no-underline hover:underline shrink-0"
                >
                    Quản lý
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center flex-1">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    <p className="text-sm font-medium text-neutral-700">{emptyText}</p>
                </div>
            ) : (
                <ul className="divide-y divide-neutral-100 overflow-y-auto max-h-[360px] scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent">
                    {items.map((item) => (
                        <li key={item.id}>{renderItem(item)}</li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function RevenueHistoryChart({ data, compact = false }) {
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [chartType, setChartType] = useState("line"); // "line" | "bar"

    const formatCurrencyShort = (val) => {
        if (val == null || isNaN(Number(val))) return "0 đ";
        const num = Math.round(Number(val));
        if (num >= 1000000000) {
            return `${Math.round(num / 1000000000)} tỷ`;
        }
        if (num >= 1000000) {
            return `${Math.round(num / 1000000)} tr`;
        }
        if (num >= 1000) {
            return `${Math.round(num / 1000)} k`;
        }
        return `${VND_FORMATTER.format(num)} đ`;
    };

    const emptyHeight = compact ? "h-[280px]" : "h-[320px]";

    if (!data || data.length === 0) {
        return (
            <div className={`flex ${emptyHeight} items-center justify-center rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm`}>
                <p className="text-sm text-neutral-400">Không có dữ liệu biểu đồ doanh thu</p>
            </div>
        );
    }

    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 40;
    const width = 600;
    const height = compact ? 220 : 300;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...data.map(d => Number(d.revenue || 0)), 1000000);

    const points = data.map((d, index) => {
        const x = paddingLeft + (index * (chartWidth / Math.max(data.length - 1, 1)));
        const y = paddingTop + chartHeight - (Number(d.revenue || 0) / maxVal * chartHeight);
        return { x, y, month: d.month, revenue: Number(d.revenue || 0) };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = points.length > 0
        ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
        : '';

    const gridLevels = [0, 0.25, 0.5, 0.75, 1];

    return (
        <div className="h-full rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm flex flex-col font-['Geist',sans-serif] sm:p-5">
            <div className={`flex items-center justify-between flex-wrap gap-3 ${compact ? "mb-3" : "mb-4"}`}>
                <div>
                    <h2 className={`font-bold text-neutral-900 flex items-center gap-1.5 ${compact ? "text-sm" : "text-base"}`}>
                        <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
                        Doanh thu hệ thống (6 tháng gần nhất)
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">Biểu đồ thể hiện lịch sử doanh thu hàng tháng</p>
                </div>
                <div className="flex bg-stone-100 p-0.5 rounded-xl border border-stone-200/50">
                    <button
                        onClick={() => setChartType("line")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            chartType === "line"
                                ? "bg-white text-emerald-800 shadow-sm"
                                : "text-neutral-500 hover:text-neutral-800"
                        }`}
                    >
                        Đường
                    </button>
                    <button
                        onClick={() => setChartType("bar")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            chartType === "bar"
                                ? "bg-white text-emerald-800 shadow-sm"
                                : "text-neutral-500 hover:text-neutral-800"
                        }`}
                    >
                        Cột
                    </button>
                </div>
            </div>

            <div className="relative flex-1">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#059669" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                    </defs>

                    {/* Gridlines & Y axis labels */}
                    {gridLevels.map((lvl, index) => {
                        const y = paddingTop + chartHeight - (lvl * chartHeight);
                        const val = lvl * maxVal;
                        return (
                            <g key={index}>
                                <line
                                    x1={paddingLeft}
                                    y1={y}
                                    x2={width - paddingRight}
                                    y2={y}
                                    stroke="#f1f5f9"
                                    strokeWidth={1}
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={paddingLeft - 10}
                                    y={y + 4}
                                    textAnchor="end"
                                    fill="#94a3b8"
                                    fontSize={10}
                                    className="font-semibold font-mono"
                                >
                                    {formatCurrencyShort(val)}
                                </text>
                            </g>
                        );
                    })}

                    {/* X axis labels */}
                    {points.map((p, index) => (
                        <text
                            key={index}
                            x={p.x}
                            y={paddingTop + chartHeight + 20}
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize={11}
                            className="font-semibold"
                        >
                            {p.month}
                        </text>
                    ))}

                    {/* Area fill */}
                    {chartType === "line" && areaPath && (
                        <path d={areaPath} fill="url(#areaGradient)" />
                    )}

                    {/* Line */}
                    {chartType === "line" && linePath && (
                        <path d={linePath} fill="none" stroke="#10b981" strokeWidth={3} strokeLinecap="round" />
                    )}

                    {/* Bar Chart rendering */}
                    {chartType === "bar" && points.map((p, index) => {
                        const barWidth = 32;
                        const barHeight = (paddingTop + chartHeight) - p.y;
                        const isHovered = hoveredPoint?.month === p.month;
                        return (
                            <rect
                                key={index}
                                x={p.x - barWidth / 2}
                                y={p.y}
                                width={barWidth}
                                height={barHeight}
                                fill={isHovered ? "#047857" : "url(#barGradient)"}
                                rx={6}
                                className="transition-all duration-200 cursor-pointer"
                            />
                        );
                    })}

                    {/* Interactive dots (only for line chart) */}
                    {chartType === "line" && points.map((p, index) => (
                        <circle
                            key={index}
                            cx={p.x}
                            cy={p.y}
                            r={hoveredPoint?.month === p.month ? 6 : 4}
                            fill={hoveredPoint?.month === p.month ? '#059669' : '#10b981'}
                            stroke="#ffffff"
                            strokeWidth={2}
                            className="transition-all duration-150"
                        />
                    ))}

                    {/* Overlay tracking columns */}
                    {points.map((p, index) => {
                        const colWidth = chartWidth / Math.max(data.length - 1, 1);
                        const xStart = index === 0 ? p.x : p.x - colWidth / 2;
                        const xWidth = index === 0 || index === data.length - 1 ? colWidth / 2 : colWidth;
                        return (
                            <rect
                                key={index}
                                x={xStart}
                                y={paddingTop}
                                width={xWidth}
                                height={chartHeight}
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPoint(p)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                        );
                    })}
                </svg>

                {/* Tooltip */}
                {hoveredPoint && (
                    <div
                        className="absolute z-20 bg-neutral-900/95 text-white rounded-xl px-3 py-2 shadow-lg text-[11px] pointer-events-none transition-all duration-150 -translate-x-1/2 -translate-y-full border border-neutral-800"
                        style={{
                            left: `${(hoveredPoint.x / width) * 100}%`,
                            top: `${(hoveredPoint.y / height) * 100 - 8}%`
                        }}
                    >
                        <div className="font-bold text-neutral-400 uppercase tracking-wider text-[9px]">Tháng {hoveredPoint.month}</div>
                        <div className="mt-0.5 text-emerald-400 font-black text-xs">{formatCurrency(hoveredPoint.revenue)}</div>
                    </div>
                )}
            </div>
        </div>
    );
}

function LeaderboardPanel({
    title,
    subtitle,
    icon: Icon,
    items,
    nameKey,
    revenueKey,
    orderKey,
    compact = false,
    visibleItems = 3,
    className = "",
}) {
    const maxRevenue = useMemo(() => {
        return Math.max(...items.map((item) => Number(item[revenueKey] || 0)), 1);
    }, [items, revenueKey]);

    const listMaxHeight = visibleItems * (compact ? 52 : 56);

    return (
        <section className={`rounded-2xl border border-neutral-200 bg-white shadow-sm flex flex-col font-['Geist',sans-serif] min-h-0 ${className}`}>
            <div className={`flex items-center gap-2.5 border-b border-neutral-100 shrink-0 ${compact ? "px-4 py-3" : "px-5 py-4"}`}>
                <div className="rounded-lg p-2 bg-emerald-50 text-emerald-700 shrink-0">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <h2 className={`font-bold text-neutral-900 leading-tight truncate ${compact ? "text-sm" : "text-base"}`}>
                        {title}
                    </h2>
                    <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">{subtitle}</p>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center flex-1">
                    <p className="text-sm font-medium text-neutral-400">Không có dữ liệu xếp hạng</p>
                </div>
            ) : (
                <div
                    className="divide-y divide-neutral-100 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent"
                    style={{ maxHeight: `${listMaxHeight}px` }}
                >
                    {items.map((item, index) => {
                        const revenue = Number(item[revenueKey] || 0);
                        const orders = item[orderKey] || 0;
                        const percentage = (revenue / maxRevenue) * 100;
                        const rank = index + 1;

                        let rankBg = "bg-stone-100 text-stone-600";

                        if (rank === 1) rankBg = "bg-amber-100 text-amber-800 font-bold";
                        else if (rank === 2) rankBg = "bg-slate-100 text-slate-800 font-bold";
                        else if (rank === 3) rankBg = "bg-orange-100 text-orange-800 font-bold";

                        return (
                            <div
                                key={item.id || index}
                                className={`flex flex-col gap-1.5 hover:bg-stone-50/50 transition-colors ${compact ? "px-4 py-2.5" : "px-5 py-3"}`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${rankBg}`}>
                                            {rank}
                                        </span>
                                        <span className={`truncate font-semibold text-neutral-800 ${compact ? "text-xs" : "text-sm"}`}>
                                            {item[nameKey]}
                                        </span>
                                    </div>
                                    <div className="text-right shrink-0 flex flex-col">
                                        <span className={`font-bold text-neutral-900 font-mono ${compact ? "text-xs" : "text-sm"}`}>
                                            {formatCurrency(revenue)}
                                        </span>
                                        <span className="text-[10px] text-neutral-400">
                                            {orders} đơn hàng
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
                                    <div
                                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [fetchWarnings, setFetchWarnings] = useState([]);
    const [summary, setSummary] = useState(null);

    // New API dashboard states
    const [dashboardSummary, setDashboardSummary] = useState(null);
    const [dashboardChart, setDashboardChart] = useState([]);
    const [topDealers, setTopDealers] = useState([]);
    const [topSuppliers, setTopSuppliers] = useState([]);

    const adminName =
        user?.full_name
        || user?.username
        || user?.account?.username
        || "Quản trị viên";

    const fetchDashboard = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");
        setFetchWarnings([]);

        const requests = [
            {
                key: "suppliers",
                run: () => supplierService.getAll(),
                errorMessage: "Không tải được danh sách nhà cung cấp",
                handleError: handleSupplierError,
            },
            {
                key: "dealers",
                run: () => dealerService.getAll(),
                errorMessage: "Không tải được danh sách đại lý",
                handleError: handleDealerError,
            },
            {
                key: "documents",
                run: () => accountDocumentService.getAll(),
                errorMessage: "Không tải được danh sách giấy tờ",
                handleError: (error, message) => message,
            },
            {
                key: "certifications",
                run: () => certificationService.getAll(),
                errorMessage: "Không tải được danh sách chứng chỉ",
                handleError: (error, message) => message,
            },
            {
                key: "products",
                run: () => productService.getAll(),
                errorMessage: "Không tải được danh sách sản phẩm",
                handleError: handleProductError,
            },
            {
                key: "dashboardSummary",
                run: () => adminDashboardService.summary(),
                errorMessage: "Không tải được dữ liệu tổng quan doanh thu",
                handleError: (error, message) => message,
            },
            {
                key: "dashboardChart",
                run: () => adminDashboardService.chart(),
                errorMessage: "Không tải được biểu đồ doanh thu",
                handleError: (error, message) => message,
            },
            {
                key: "topDealers",
                run: () => adminDashboardService.top_dealers(),
                errorMessage: "Không tải được xếp hạng đại lý",
                handleError: (error, message) => message,
            },
            {
                key: "topSuppliers",
                run: () => adminDashboardService.top_suppliers(),
                errorMessage: "Không tải được xếp hạng nhà cung cấp",
                handleError: (error, message) => message,
            },
        ];

        try {
            const results = await Promise.allSettled(requests.map((request) => request.run()));
            const payload = {
                suppliers: [],
                dealers: [],
                documents: [],
                certifications: [],
                products: [],
                dashboardSummary: null,
                dashboardChart: [],
                topDealers: [],
                topSuppliers: [],
            };
            const warnings = [];
            let successCount = 0;

            results.forEach((result, index) => {
                const request = requests[index];

                if (result.status === "fulfilled") {
                    const val = result.value;
                    if (request.key === "dashboardSummary") {
                        payload[request.key] = val;
                    } else if (["dashboardChart", "topDealers", "topSuppliers"].includes(request.key)) {
                        payload[request.key] = Array.isArray(val) ? val : (val?.results || []);
                    } else {
                        payload[request.key] = normalizeListResponse(val);
                    }
                    successCount += 1;
                    return;
                }

                warnings.push(
                    request.handleError(result.reason, request.errorMessage),
                );
            });

            if (successCount === 0) {
                setLoadError(warnings[0] || "Không thể tải dữ liệu dashboard.");
                setSummary(null);
                return;
            }

            setFetchWarnings(warnings);
            setSummary(buildDashboardSummary(payload));
            
            // Set the new API stats states
            setDashboardSummary(payload.dashboardSummary);
            setDashboardChart(payload.dashboardChart);
            setTopDealers(payload.topDealers);
            setTopSuppliers(payload.topSuppliers);
        } catch (error) {
            setLoadError(handleSupplierError(error, "Không thể tải dữ liệu dashboard."));
            setSummary(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    if (isLoading) {
        return (
            <AdminPageShell>
                <AdminPageLoading message="Đang tải tổng quan quản trị..." />
            </AdminPageShell>
        );
    }

    if (loadError) {
        return (
            <AdminPageShell>
                <AdminPageLoadError message={loadError} onRetry={fetchDashboard} />
            </AdminPageShell>
        );
    }

    const topSuppliersPending = summary.pendingSuppliers.slice(0, 5);
    const topDealersPending = summary.pendingDealers.slice(0, 5);

    return (
        <AdminPageShell>
            {fetchWarnings.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Một số dữ liệu chưa tải được: {fetchWarnings.join(" · ")}
                </div>
            ) : null}

            {/* WELCOME BAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-emerald-800 text-white rounded-2xl p-6 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold">Chào mừng quay trở lại</h1>
                    <p className="text-sm text-emerald-100 mt-1">Dưới đây là thống kê tình hình hoạt động của nền tảng SmartGreenMarket.</p>
                </div>
                <button
                    onClick={fetchDashboard}
                    className="cursor-pointer flex items-center gap-2 bg-emerald-700/60 hover:bg-emerald-700 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors border border-emerald-600/30"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Làm mới
                </button>
            </div>

            {/* GENERAL SYSTEM OVERVIEW KPI ROW */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPIOverviewCard
                    title="Doanh thu tháng này"
                    value={formatCurrency(dashboardSummary?.revenue?.this_month)}
                    icon={DollarSign}
                    colorClass="text-emerald-700"
                    bgClass="bg-emerald-50"
                    borderClass="border-emerald-100"
                />
                <KPIOverviewCard
                    title="Đại lý hoạt động"
                    value={dashboardSummary?.active_dealers ?? 0}
                    icon={Store}
                    colorClass="text-sky-700"
                    bgClass="bg-sky-50"
                    borderClass="border-sky-100"
                />
                <KPIOverviewCard
                    title="Nhà cung cấp hoạt động"
                    value={dashboardSummary?.active_suppliers ?? 0}
                    icon={Truck}
                    colorClass="text-indigo-700"
                    bgClass="bg-indigo-50"
                    borderClass="border-indigo-100"
                />
                <KPIOverviewCard
                    title="Khách hàng mới (Tháng)"
                    value={dashboardSummary?.new_customers_this_month ?? 0}
                    icon={Users}
                    colorClass="text-amber-700"
                    bgClass="bg-amber-50"
                    borderClass="border-amber-100"
                />
            </div>

            {/* CHART + TOP PARTNERS */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)] xl:items-start">
                <RevenueHistoryChart data={dashboardChart} compact />

                <div className="flex flex-col gap-4 min-w-0">
                    <LeaderboardPanel
                        compact
                        visibleItems={3}
                        title="Top 10 Đại lý doanh thu tốt nhất"
                        subtitle="Xếp hạng các đại lý có doanh thu hoàn tất cao nhất"
                        icon={Award}
                        items={topDealers}
                        nameKey="store_name"
                        revenueKey="total_revenue"
                        orderKey="total_orders"
                    />
                    <LeaderboardPanel
                        compact
                        visibleItems={3}
                        title="Top 10 Nhà cung cấp nổi bật"
                        subtitle="Xếp hạng các đối tác có doanh thu nhập hàng lớn nhất"
                        icon={Award}
                        items={topSuppliers}
                        nameKey="company_name"
                        revenueKey="total_revenue"
                        orderKey="total_orders"
                    />
                </div>
            </div>

            {/* MODERATION PENDING ITEMS HEADING */}
            <div className="border-t border-neutral-200/60 pt-6">
                <h2 className="text-base font-bold text-neutral-800 flex items-center gap-2 leading-none">
                    <Clock3 className="w-4.5 h-4.5 text-neutral-500" />
                    Hồ sơ duyệt & Nghiệp vụ hệ thống
                </h2>
                <p className="text-xs text-neutral-500 mt-1">Quản lý và phê duyệt các hồ sơ đăng ký, giấy tờ, chứng chỉ, sản phẩm chờ duyệt</p>
            </div>

            {/* PENDING STAT CARDS */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                {STAT_CARDS.map((card) => (
                    <DashboardStatCard
                        key={card.key}
                        card={card}
                        stats={summary.stats[card.key]}
                    />
                ))}
            </div>

            {/* WAITING LIST PANELS */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <PendingEntityPanel
                    title="Hồ sơ Nhà cung cấp chờ duyệt"
                    description="Các tài khoản nhà cung cấp nông sản mới đăng ký gửi hồ sơ"
                    href="/quan-tri/nha-cung-cap"
                    items={topSuppliersPending}
                    emptyText="Không có nhà cung cấp nào đang chờ duyệt"
                    renderItem={(item) => (
                        <div className="flex items-start justify-between gap-4 px-5 py-4">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-neutral-900">
                                    {item.company_name}
                                </p>
                                <p className="mt-1 truncate text-xs text-neutral-500">
                                    {item.phone || item.address || "Chưa cập nhật liên hệ"}
                                </p>
                            </div>
                            <span className="shrink-0 text-xs text-neutral-400">
                                {formatRelativeTimeVi(item.created_at)}
                            </span>
                        </div>
                    )}
                />

                <PendingEntityPanel
                    title="Hồ sơ Đại lý chờ duyệt"
                    description="Các đối tác cửa hàng đại lý mới gửi yêu cầu xác thực"
                    href="/quan-tri/dai-ly"
                    items={topDealersPending}
                    emptyText="Không có đại lý nào đang chờ duyệt"
                    renderItem={(item) => (
                        <div className="flex items-start justify-between gap-4 px-5 py-4">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-neutral-900">
                                    {item.store_name}
                                </p>
                                <p className="mt-1 truncate text-xs text-neutral-500">
                                    {item.account?.full_name
                                        || item.account?.phone
                                        || item.store_address
                                        || "Chưa cập nhật thông tin"}
                                </p>
                            </div>
                            <span className="shrink-0 text-xs text-neutral-400">
                                {formatRelativeTimeVi(item.created_at)}
                            </span>
                        </div>
                    )}
                />
            </div>

            {/* PREVIOUS QUICK STATUSES FOR BACKWARD REUSE */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                        <Truck className="h-4 w-4 text-emerald-700" />
                        Nhà cung cấp đã duyệt
                    </div>
                    <p className="mt-3 text-2xl font-bold text-neutral-900">
                        {summary.stats.suppliers.approved}
                        <span className="ml-2 text-sm font-medium text-neutral-500">
                            / {summary.stats.suppliers.total} tổng cộng
                        </span>
                    </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                        <Store className="h-4 w-4 text-sky-700" />
                        Đại lý hoạt động
                    </div>
                    <p className="mt-3 text-2xl font-bold text-neutral-900">
                        {summary.stats.dealers.approved}
                        <span className="ml-2 text-sm font-medium text-neutral-500">
                            / {summary.stats.dealers.total} tổng cộng
                        </span>
                    </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                        <AlertCircle className="h-4 w-4 text-amber-700" />
                        Hồ sơ chờ phê duyệt
                    </div>
                    <p className="mt-3 text-2xl font-bold text-amber-700">
                        {summary.pendingTotal}
                        <span className="ml-2 text-sm font-medium text-neutral-500">
                            hồ sơ cần kiểm tra
                        </span>
                    </p>
                </div>
            </section>
        </AdminPageShell>
    );
}
