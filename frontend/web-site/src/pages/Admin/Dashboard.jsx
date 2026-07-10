import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    ArrowUpRight,
    CheckCircle2,
    Clock3,
    FileCheck,
    FileText,
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
import { accountDocumentService } from "../../services/api/accountDocumentService";
import { certificationService } from "../../services/api/certificationService";
import { dealerService, handleApiError as handleDealerError } from "../../services/api/dealerService";
import { productService, handleApiError as handleProductError } from "../../services/api/productService";
import { supplierService, handleApiError as handleSupplierError } from "../../services/api/suppilerService";
import {
    buildDashboardSummary,
    formatRelativeTimeVi,
    normalizeListResponse,
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

export default function AdminDashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [fetchWarnings, setFetchWarnings] = useState([]);
    const [summary, setSummary] = useState(null);

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
                    <p className="text-sm text-emerald-100 mt-1">
                        Theo dõi hồ sơ chờ duyệt và tình hình hoạt động nền tảng SmartGreenMarket.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        to="/quan-tri/thong-ke"
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-700/40 px-4 py-2 text-xs font-semibold tracking-wide no-underline text-white transition-colors hover:bg-emerald-700/70"
                    >
                        Xem thống kê
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                        type="button"
                        onClick={fetchDashboard}
                        className="cursor-pointer flex items-center gap-2 bg-emerald-700/60 hover:bg-emerald-700 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors border border-emerald-600/30"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Làm mới
                    </button>
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
