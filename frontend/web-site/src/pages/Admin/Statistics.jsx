import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Award,
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
import {
    adminDashboardService,
    handleApiError,
    normalizeAdminRevenueChart,
} from "../../services/api/Admin/adminDashboardService";
import {
    formatCurrency,
    truncateLabel,
} from "../../utils/adminStatisticsUtils";

function KPIOverviewCard({
    title,
    value,
    icon: Icon,
    colorClass,
    bgClass,
    borderClass,
    description,
    accentClass = "bg-emerald-500",
}) {
    return (
        <article
            className={`group relative flex min-h-[190px] flex-col overflow-hidden rounded-3xl border ${borderClass} bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
        >
            <div className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} />
            <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${bgClass} ${colorClass} transition-transform duration-300 group-hover:scale-105`}>
                    <Icon className="h-5 w-5" />
                </span>
                <span className={`mt-1 h-2 w-2 rounded-full ${accentClass} ring-4 ring-white`} />
            </div>

            <p className="mt-5 text-xs font-bold uppercase leading-5 tracking-[0.08em] text-neutral-500">
                {title}
            </p>
            <h3 className="mt-1 text-4xl font-black leading-none tracking-tight text-neutral-950">
                {value}
            </h3>

            {description ? (
                <p className="mt-auto border-t border-neutral-100 pt-3 text-xs leading-5 text-neutral-500">
                    {description}
                </p>
            ) : null}
        </article>
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
    const label = isB2B ? "B2B · NCC → Đại lý" : "B2C · Đại lý → Buyer";

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
    const [chartData, setChartData] = useState({
        dealers: [],
        suppliers: [],
        hasSupplierSeries: false,
    });
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
                chart: { dealers: [], suppliers: [], hasSupplierSeries: false },
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
                            : request.key === "chart"
                              ? normalizeAdminRevenueChart(value)
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
        // Đồng bộ dữ liệu dashboard từ API khi trang được mở.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchStatistics();
    }, [fetchStatistics]);

    const buildRevenueRows = useCallback(
        (items) =>
            items.map((item, index) => ({
                id: item.month ?? index,
                month: item.month,
                revenue: Number(item.revenue || 0),
                previousRevenue:
                    index > 0 ? Number(items[index - 1]?.revenue || 0) : null,
            })),
        [],
    );

    const currentMonth = useMemo(
        () =>
            new Intl.DateTimeFormat("sv-SE", {
                year: "numeric",
                month: "2-digit",
            }).format(new Date()),
        [],
    );

    const revenueMonths = useMemo(() => {
        const months = new Set(
            [...chartData.dealers, ...chartData.suppliers]
                .map((item) => item.month)
                .filter(Boolean),
        );

        if (months.size === 0 && summary?.revenue?.this_month_supplier != null) {
            months.add(currentMonth);
        }

        return [...months].sort((left, right) => left.localeCompare(right));
    }, [chartData.dealers, chartData.suppliers, currentMonth, summary]);

    const dealerRevenueRows = useMemo(() => {
        const revenueByMonth = new Map(
            chartData.dealers.map((item) => [item.month, Number(item.revenue || 0)]),
        );
        const alignedItems = revenueMonths.map((month) => ({
            month,
            revenue: revenueByMonth.get(month) ?? 0,
        }));
        return buildRevenueRows(alignedItems);
    }, [buildRevenueRows, chartData.dealers, revenueMonths]);

    const supplierRevenueRows = useMemo(() => {
        const revenueByMonth = new Map(
            chartData.suppliers.map((item) => [item.month, Number(item.revenue || 0)]),
        );

        if (!chartData.hasSupplierSeries) {
            const currentSupplierRevenue = summary?.revenue?.this_month_supplier;
            const fallbackMonth = revenueMonths.includes(currentMonth)
                ? currentMonth
                : revenueMonths.at(-1);

            if (currentSupplierRevenue != null && fallbackMonth) {
                revenueByMonth.set(fallbackMonth, Number(currentSupplierRevenue || 0));
            }
        }

        const alignedItems = revenueMonths.map((month) => ({
            month,
            revenue: revenueByMonth.get(month) ?? 0,
        }));
        return buildRevenueRows(alignedItems);
    }, [
        buildRevenueRows,
        chartData.hasSupplierSeries,
        chartData.suppliers,
        currentMonth,
        revenueMonths,
        summary,
    ]);

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
                        Theo dõi riêng doanh thu bán lẻ B2C và giao dịch nhập hàng B2B trên SmartGreenMarket.
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

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <KPIOverviewCard
                    title="Đại lý hoạt động"
                    value={summary?.active_dealers ?? 0}
                    icon={Store}
                    colorClass="text-sky-700"
                    bgClass="bg-sky-50"
                    borderClass="border-sky-100"
                    accentClass="bg-sky-500"
                    description="Tài khoản Đại lý đang ở trạng thái hoạt động."
                />
                <KPIOverviewCard
                    title="Nhà cung cấp hoạt động"
                    value={summary?.active_suppliers ?? 0}
                    icon={Truck}
                    colorClass="text-indigo-700"
                    bgClass="bg-indigo-50"
                    borderClass="border-indigo-100"
                    accentClass="bg-indigo-500"
                    description="Tài khoản Nhà cung cấp đang ở trạng thái hoạt động."
                />
                <KPIOverviewCard
                    title="Khách hàng mới (Tháng)"
                    value={summary?.new_customers_this_month ?? 0}
                    icon={Users}
                    colorClass="text-amber-700"
                    bgClass="bg-amber-50"
                    borderClass="border-amber-100"
                    accentClass="bg-amber-500"
                    description="Buyer đăng ký mới từ đầu tháng đến hiện tại."
                />
            </div>

            <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
                            <Store className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                Phân hệ Đại lý · B2C
                            </p>
                            <h2 className="mt-0.5 text-lg font-black text-emerald-950">
                                Hiệu quả bán hàng của Đại lý
                            </h2>
                            <p className="mt-0.5 text-xs text-emerald-800/70">
                                Dữ liệu đơn hàng Buyer đã giao hoặc hoàn tất, không bao gồm phiếu nhập Nhà cung cấp.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)] xl:items-stretch">
                    <RevenueOverviewPanel
                        rows={dealerRevenueRows}
                        title="Doanh thu Đại lý theo tháng"
                        subtitle="Doanh thu B2C từ Buyer trong các tháng gần nhất"
                        valueLabel="Doanh thu Đại lý"
                        infoText="Chỉ tính đơn bán lẻ B2C đã giao hoặc hoàn tất của các Đại lý."
                        emptyMessage="Không có dữ liệu doanh thu Đại lý"
                    />
                    <LeaderboardPanel
                        compact={false}
                        visibleItems={5}
                        className="h-full"
                        title="Top Đại lý theo doanh thu"
                        subtitle="Xếp theo doanh thu B2C từ đơn Buyer đã giao/hoàn tất"
                        icon={Award}
                        items={topDealers}
                        nameKey="store_name"
                        revenueKey="total_revenue"
                        valueLabel="Doanh thu B2C"
                        orderLabel="đơn B2C"
                        orderKey="total_orders"
                    />
                </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white p-4 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-700 text-white shadow-sm">
                            <Truck className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700">
                                Phân hệ Nhà cung cấp · B2B
                            </p>
                            <h2 className="mt-0.5 text-lg font-black text-indigo-950">
                                Giá trị nhập hàng từ Nhà cung cấp
                            </h2>
                            <p className="mt-0.5 text-xs text-indigo-800/70">
                                Dữ liệu phiếu nhập Đại lý đã giao hoặc hoàn tất, tách biệt doanh thu bán lẻ.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)] xl:items-stretch">
                    <RevenueOverviewPanel
                        rows={supplierRevenueRows}
                        title="Giá trị nhập hàng theo tháng"
                        subtitle="Giá trị B2B Đại lý nhập từ Nhà cung cấp trong các tháng gần nhất"
                        valueLabel="Giá trị nhập hàng"
                        infoText="Chỉ tính phiếu nhập B2B đã giao hoặc hoàn tất từ Nhà cung cấp."
                        emptyMessage="Không có dữ liệu nhập hàng Nhà cung cấp"
                        tone="indigo"
                    />
                    <LeaderboardPanel
                        compact={false}
                        visibleItems={5}
                        className="h-full"
                        title="Top Nhà cung cấp theo B2B"
                        subtitle="Xếp theo giá trị phiếu nhập Đại lý đã giao/hoàn tất"
                        icon={Award}
                        items={topSuppliers}
                        nameKey="company_name"
                        revenueKey="total_revenue"
                        orderKey="total_orders"
                        valueLabel="Giá trị B2B"
                        orderLabel="phiếu nhập"
                        tone="indigo"
                    />
                </div>
            </section>

            <StatisticsDataSection
                title="Top 10 sản phẩm theo giá trị giao dịch"
                subtitle="Mỗi sản phẩm thuộc riêng kênh B2C hoặc B2B; các giá trị chỉ dùng để xếp hạng, không cộng thành tổng doanh thu"
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
                        label: "Giá trị theo kênh",
                        align: "right",
                        className: "font-mono font-bold",
                        render: (row) => formatCurrency(row.revenue),
                    },
                ]}
            />
        </AdminPageShell>
    );
}
