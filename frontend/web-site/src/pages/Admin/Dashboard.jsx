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
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4">
                <div>
                    <h2 className="text-base font-bold text-neutral-900">{title}</h2>
                    <p className="mt-1 text-xs text-neutral-500">{description}</p>
                </div>
                <Link
                    to={href}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 no-underline hover:underline"
                >
                    Quản lý
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    <p className="text-sm font-medium text-neutral-700">{emptyText}</p>
                </div>
            ) : (
                <ul className="divide-y divide-neutral-100">
                    {items.map((item) => (
                        <li key={item.id}>{renderItem(item)}</li>
                    ))}
                </ul>
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
        ];

        try {
            const results = await Promise.allSettled(requests.map((request) => request.run()));
            const payload = {
                suppliers: [],
                dealers: [],
                documents: [],
                certifications: [],
                products: [],
            };
            const warnings = [];
            let successCount = 0;

            results.forEach((result, index) => {
                const request = requests[index];

                if (result.status === "fulfilled") {
                    payload[request.key] = normalizeListResponse(result.value);
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

    const pendingQueue = useMemo(
        () => (summary ? buildPendingQueue(summary) : []),
        [summary],
    );

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

    const topSuppliers = summary.pendingSuppliers.slice(0, 5);
    const topDealers = summary.pendingDealers.slice(0, 5);

    return (
        <AdminPageShell>

            {fetchWarnings.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Một số dữ liệu chưa tải được: {fetchWarnings.join(" · ")}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                {STAT_CARDS.map((card) => (
                    <DashboardStatCard
                        key={card.key}
                        card={card}
                        stats={summary.stats[card.key]}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <PendingEntityPanel
                    title="Nhà cung cấp chờ duyệt"
                    description="Hồ sơ đăng ký mới từ nhà cung cấp nông sản"
                    href="/quan-tri/nha-cung-cap"
                    items={topSuppliers}
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
                    title="Đại lý chờ duyệt"
                    description="Cửa hàng đại lý mới gửi hồ sơ xác minh"
                    href="/quan-tri/dai-ly"
                    items={topDealers}
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

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                        <Truck className="h-4 w-4 text-emerald-700" />
                        Nhà cung cấp
                    </div>
                    <p className="mt-3 text-2xl font-bold text-neutral-900">
                        {summary.stats.suppliers.approved}
                        <span className="ml-2 text-sm font-medium text-neutral-500">
                            / {summary.stats.suppliers.total} đã duyệt
                        </span>
                    </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                        <Store className="h-4 w-4 text-sky-700" />
                        Đại lý
                    </div>
                    <p className="mt-3 text-2xl font-bold text-neutral-900">
                        {summary.stats.dealers.approved}
                        <span className="ml-2 text-sm font-medium text-neutral-500">
                            / {summary.stats.dealers.total} đang hoạt động
                        </span>
                    </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                        <AlertCircle className="h-4 w-4 text-amber-700" />
                        Tổng chờ xử lý
                    </div>
                    <p className="mt-3 text-2xl font-bold text-amber-700">
                        {summary.pendingTotal}
                        <span className="ml-2 text-sm font-medium text-neutral-500">
                            hồ sơ cần duyệt
                        </span>
                    </p>
                </div>
            </section>
        </AdminPageShell>
    );
}
