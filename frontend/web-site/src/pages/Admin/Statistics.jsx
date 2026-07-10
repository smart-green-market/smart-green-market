import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Award,
    DollarSign,
    Package,
    RefreshCw,
    Store,
    Truck,
    Users,
} from "lucide-react";
import {
    AdminPageLoadError,
    AdminPageLoading,
    AdminPageShell,
} from "../../components/Admin/UI/AdminFetchState";
import StatisticsDataSection from "../../components/Admin/Statistics/StatisticsDataSection";
import LeaderboardPanel from "../../components/Admin/Statistics/LeaderboardPanel";
import RevenueOverviewPanel from "../../components/Admin/Statistics/RevenueOverviewPanel";
import TrendBadge from "../../components/Admin/Statistics/TrendBadge";
import {
    adminDashboardService,
    handleApiError,
} from "../../services/api/Admin/adminDashboardService";
import {
    formatCurrency,
    getPreviousMonthRevenue,
    truncateLabel,
} from "../../utils/adminStatisticsUtils";

function KPIOverviewCard({ title, value, icon: Icon, colorClass, bgClass, borderClass, trend }) {
    return (
        <div
            className={`flex items-center justify-between rounded-2xl border ${borderClass} bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md`}
        >
            <div className="min-w-0">
                <span className="block truncate text-xs font-bold uppercase tracking-wider text-neutral-500">
                    {title}
                </span>
                <h3 className="mt-2 truncate text-2xl font-black leading-none text-neutral-900">
                    {value}
                </h3>
                {trend ? <div className="mt-2">{trend}</div> : null}
            </div>
            <div className={`shrink-0 rounded-xl p-3 ${bgClass} ${colorClass}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    );
}

function RankBadge({ rank }) {
    let rankClass = "bg-stone-100 text-stone-600";

    if (rank === 1) rankClass = "bg-amber-100 text-amber-800 font-bold";
    else if (rank === 2) rankClass = "bg-slate-100 text-slate-800 font-bold";
    else if (rank === 3) rankClass = "bg-orange-100 text-orange-800 font-bold";

    return (
        <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${rankClass}`}
        >
            {rank}
        </span>
    );
}

function ProductTypeBadge({ type }) {
    const normalized = String(type ?? "").toLowerCase();
    const isB2B = normalized.includes("b2b") || normalized.includes("supplier");
    const label = isB2B ? "B2B (NCC)" : "B2C (Đại lý)";

    return (
        <span
            className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                isB2B ? "bg-indigo-50 text-indigo-700" : "bg-sky-50 text-sky-700"
            }`}
        >
            {label}
        </span>
    );
}

export default function AdminStatisticsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [fetchWarnings, setFetchWarnings] = useState([]);
    const [summary, setSummary] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [topDealers, setTopDealers] = useState([]);
    const [topSuppliers, setTopSuppliers] = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    const fetchStatistics = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");
        setFetchWarnings([]);

        const requests = [
            {
                key: "summary",
                run: () => adminDashboardService.summary(),
                errorMessage: "Không tải được dữ liệu tổng quan",
            },
            {
                key: "chart",
                run: () => adminDashboardService.chart(),
                errorMessage: "Không tải được biểu đồ doanh thu",
            },
            {
                key: "topDealers",
                run: () => adminDashboardService.top_dealers(),
                errorMessage: "Không tải được xếp hạng đại lý",
            },
            {
                key: "topSuppliers",
                run: () => adminDashboardService.top_suppliers(),
                errorMessage: "Không tải được xếp hạng nhà cung cấp",
            },
            {
                key: "topProducts",
                run: () => adminDashboardService.top_products(),
                errorMessage: "Không tải được xếp hạng sản phẩm",
            },
        ];

        try {
            const results = await Promise.allSettled(requests.map((request) => request.run()));
            const payload = {
                summary: null,
                chart: [],
                topDealers: [],
                topSuppliers: [],
                topProducts: [],
            };
            const warnings = [];
            let successCount = 0;

            results.forEach((result, index) => {
                const request = requests[index];

                if (result.status === "fulfilled") {
                    const value = result.value;
                    payload[request.key] =
                        request.key === "summary"
                            ? value
                            : Array.isArray(value)
                              ? value
                              : (value?.results ?? []);
                    successCount += 1;
                    return;
                }

                warnings.push(handleApiError(result.reason, request.errorMessage));
            });

            if (successCount === 0) {
                setLoadError(warnings[0] || "Không thể tải dữ liệu thống kê.");
                return;
            }

            setFetchWarnings(warnings);
            setSummary(payload.summary);
            setChartData(payload.chart);
            setTopDealers(payload.topDealers);
            setTopSuppliers(payload.topSuppliers);
            setTopProducts(payload.topProducts);
        } catch (error) {
            setLoadError(handleApiError(error, "Không thể tải dữ liệu thống kê."));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    const previousMonthRevenue = useMemo(
        () => getPreviousMonthRevenue(chartData),
        [chartData],
    );

    const revenueTableRows = useMemo(
        () =>
            chartData.map((item, index) => ({
                id: item.month ?? index,
                month: item.month,
                revenue: Number(item.revenue || 0),
                previousRevenue:
                    index > 0 ? Number(chartData[index - 1]?.revenue || 0) : null,
            })),
        [chartData],
    );

    if (isLoading) {
        return (
            <AdminPageShell>
                <AdminPageLoading message="Đang tải dữ liệu thống kê..." />
            </AdminPageShell>
        );
    }

    if (loadError) {
        return (
            <AdminPageShell>
                <AdminPageLoadError message={loadError} onRetry={fetchStatistics} />
            </AdminPageShell>
        );
    }

    return (
        <AdminPageShell>
            {fetchWarnings.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Một số dữ liệu chưa tải được: {fetchWarnings.join(" · ")}
                </div>
            ) : null}

            <div className="flex flex-col justify-between gap-4 rounded-2xl bg-emerald-800 p-6 text-white shadow-sm md:flex-row md:items-center">
                <div>
                    <h1 className="text-xl font-bold">Thống kê hệ thống</h1>
                    <p className="mt-1 text-sm text-emerald-100">
                        Doanh thu, đối tác và sản phẩm nổi bật trên toàn nền tảng SmartGreenMarket.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fetchStatistics}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-700/60 px-4 py-2 text-xs font-semibold tracking-wide transition-colors hover:bg-emerald-700"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Làm mới
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPIOverviewCard
                    title="Doanh thu tháng này"
                    value={formatCurrency(summary?.revenue?.this_month)}
                    icon={DollarSign}
                    colorClass="text-emerald-700"
                    bgClass="bg-emerald-50"
                    borderClass="border-emerald-100"
                    trend={
                        <TrendBadge
                            current={summary?.revenue?.this_month}
                            previous={previousMonthRevenue}
                        />
                    }
                />
                <KPIOverviewCard
                    title="Đại lý hoạt động"
                    value={summary?.active_dealers ?? 0}
                    icon={Store}
                    colorClass="text-sky-700"
                    bgClass="bg-sky-50"
                    borderClass="border-sky-100"
                />
                <KPIOverviewCard
                    title="Nhà cung cấp hoạt động"
                    value={summary?.active_suppliers ?? 0}
                    icon={Truck}
                    colorClass="text-indigo-700"
                    bgClass="bg-indigo-50"
                    borderClass="border-indigo-100"
                />
                <KPIOverviewCard
                    title="Khách hàng mới (Tháng)"
                    value={summary?.new_customers_this_month ?? 0}
                    icon={Users}
                    colorClass="text-amber-700"
                    bgClass="bg-amber-50"
                    borderClass="border-amber-100"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)] xl:items-start">
                <RevenueOverviewPanel
                    rows={revenueTableRows}
                    emptyMessage="Không có dữ liệu biểu đồ doanh thu"
                />

                <div className="flex min-w-0 flex-col gap-4">
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

            <StatisticsDataSection
                title="Top 10 Sản phẩm bán chạy nhất"
                subtitle="So sánh doanh thu sản phẩm B2C (Đại lý) và B2B (Nhà cung cấp)"
                icon={Package}
                rows={topProducts}
                chartLabelKey={(row) => truncateLabel(row.name, 10)}
                chartValueKey="revenue"
                emptyMessage="Không có dữ liệu xếp hạng sản phẩm"
                chartSidebar={{
                    nameKey: "name",
                    quantityKey: "sales",
                    title: "Top sản phẩm",
                }}
                columns={[
                    {
                        key: "rank",
                        label: "#",
                        render: (_, index) => <RankBadge rank={index + 1} />,
                    },
                    {
                        key: "name",
                        label: "Sản phẩm",
                        render: (row) => (
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-neutral-900">{row.name}</p>
                                <p className="truncate text-xs text-neutral-500">
                                    {row.category || "Chưa phân loại"}
                                </p>
                            </div>
                        ),
                    },
                    {
                        key: "type",
                        label: "Loại",
                        render: (row) => <ProductTypeBadge type={row.type} />,
                    },
                    {
                        key: "sales",
                        label: "Đã bán",
                        align: "right",
                        render: (row) => `${row.sales ?? 0}`,
                    },
                    {
                        key: "revenue",
                        label: "Doanh thu",
                        align: "right",
                        className: "font-mono font-bold",
                        render: (row) => formatCurrency(row.revenue),
                    },
                ]}
            />
        </AdminPageShell>
    );
}
