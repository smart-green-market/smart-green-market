import {
    Building2,
    Calendar,
    MapPin,
    Phone,
    Receipt,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";
import { formatFinanceCurrency } from "../../../utils/supplierFinanceUtils";

const STATUS_CONFIG = {
    approved: { label: "ĐANG HOẠT ĐỘNG", className: "bg-green-100 text-green-800" },
    pending: { label: "CHỜ DUYỆT", className: "bg-amber-100 text-amber-800" },
    rejected: { label: "TỪ CHỐI", className: "bg-red-100 text-red-800" },
};

function MetricTile({ icon: Icon, label, value, accent = "text-emerald-700" }) {
    return (
        <div className="rounded-xl border border-neutral-100 bg-stone-50/80 p-4">
            <div className="mb-2 flex items-center gap-2 text-neutral-500">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                    {label}
                </span>
            </div>
            <p className={`text-lg font-bold tabular-nums font-['Geist',sans-serif] ${accent}`}>
                {value}
            </p>
        </div>
    );
}

function CashFlowRow({ item, index }) {
    const label =
        item.month ??
        item.period ??
        item.label ??
        `Kỳ ${index + 1}`;
    const cashIn = Number(item.in ?? item.cash_in ?? item.inflow ?? 0);
    const cashOut = Number(item.out ?? item.cash_out ?? item.outflow ?? 0);
    const maxValue = Math.max(cashIn, cashOut, 1);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-600">
                <span>{label}</span>
                <span className="text-neutral-400">
                    +{formatFinanceCurrency(cashIn)} / -{formatFinanceCurrency(cashOut)}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                    <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, (cashIn / maxValue) * 100)}%` }}
                    />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-red-100">
                    <div
                        className="h-full rounded-full bg-red-400"
                        style={{ width: `${Math.min(100, (cashOut / maxValue) * 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function SupplierFinanceCard({ supplier }) {
    const status =
        STATUS_CONFIG[supplier.verificationStatus] ?? STATUS_CONFIG.pending;
    const netCash = supplier.cashIn - supplier.cashOut;

    return (
        <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="border-b border-neutral-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <Building2 className="h-5 w-5 shrink-0 text-emerald-700" />
                            <h3 className="truncate text-lg font-bold text-neutral-900 font-['Geist',sans-serif]">
                                {supplier.companyName}
                            </h3>
                            <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
                            >
                                {status.label}
                            </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-600">
                            {supplier.taxCode ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <Receipt className="h-3.5 w-3.5 text-neutral-400" />
                                    MST: <strong>{supplier.taxCode}</strong>
                                </span>
                            ) : null}
                            {supplier.phone ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-neutral-400" />
                                    {supplier.phone}
                                </span>
                            ) : null}
                            {supplier.address ? (
                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                                    <span className="truncate">{supplier.address}</span>
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <div className="shrink-0 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-right shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            Tổng doanh thu
                        </p>
                        <p className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums font-['Geist',sans-serif]">
                            {formatFinanceCurrency(supplier.totalRevenue)}
                        </p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                            {supplier.orderCount} đơn hàng
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 xl:grid-cols-3">
                <MetricTile
                    icon={TrendingUp}
                    label="Dòng tiền vào"
                    value={formatFinanceCurrency(supplier.cashIn)}
                    accent="text-sky-700"
                />
                <MetricTile
                    icon={TrendingDown}
                    label="Dòng tiền ra"
                    value={formatFinanceCurrency(supplier.cashOut)}
                    accent="text-amber-700"
                />
                <MetricTile
                    icon={Wallet}
                    label="Dòng tiền ròng"
                    value={formatFinanceCurrency(netCash)}
                    accent={netCash >= 0 ? "text-emerald-700" : "text-red-600"}
                />
            </div>

            {supplier.cashFlowTrend.length > 0 ? (
                <div className="border-t border-neutral-100 px-6 py-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-emerald-700" />
                        <h4 className="text-sm font-bold text-neutral-800 font-['Geist',sans-serif]">
                            Dòng tiền theo kỳ
                        </h4>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {supplier.cashFlowTrend.slice(0, 6).map((item, index) => (
                            <CashFlowRow
                                key={item.month ?? item.period ?? index}
                                item={item}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            ) : null}
        </article>
    );
}
