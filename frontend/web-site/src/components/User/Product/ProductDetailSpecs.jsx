import { useState } from "react";
import { ChevronDown, Sprout } from "lucide-react";
import {
    formatDateVi,
    formatProductPrice,
    formatStorageDuration,
    formatStorageTemperature,
    formatUnitLabel,
    getProductPrice,
} from "../../../utils/userProductUtils";

function SpecRow({ label, value, highlight = false }) {
    if (value == null || value === "") return null;

    return (
        <div className="flex flex-col gap-1 border-b border-stone-100 py-3 last:border-b-0 sm:flex-row sm:items-start sm:gap-6">
            <dt className="w-full shrink-0 text-sm font-medium text-neutral-500 sm:w-44">
                {label}
            </dt>
            <dd
                className={`text-sm leading-6 ${
                    highlight ? "font-semibold text-emerald-950" : "text-zinc-800"
                }`}
            >
                {value}
            </dd>
        </div>
    );
}

function SpecSection({ title, children, className = "" }) {
    return (
        <div
            className={`rounded-xl border border-stone-200 bg-white p-6 shadow-sm ${className}`}
        >
            <h3 className="mb-4 text-lg font-semibold text-emerald-950">{title}</h3>
            <dl>{children}</dl>
        </div>
    );
}

function CultivationProcessAccordion({ processes = [] }) {
    const [expandedId, setExpandedId] = useState(null);

    if (!processes.length) return null;

    const handleToggle = (stepId) => {
        setExpandedId((current) => (current === stepId ? null : stepId));
    };

    return (
        <div className="flex h-full flex-col rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:sticky lg:top-28 lg:self-start">
            <div className="mb-5 flex items-center gap-2">
                <div>
                    <h3 className="text-lg font-semibold text-emerald-950">
                        Quy trình canh tác
                    </h3>
                    <p className="text-xs text-neutral-500">
                        {processes.length} bước — nhấn từng bước để xem chi tiết
                    </p>
                </div>
            </div>

            <ol className="relative flex flex-col">
                {processes.map((step, index) => {
                    const isExpanded = expandedId === step.id;
                    const isLast = index === processes.length - 1;

                    return (
                        <li
                            key={step.id}
                            className={`relative flex gap-3 ${isLast ? "" : "pb-4"}`}
                        >
                            {!isLast ? (
                                <span
                                    className="absolute left-[15px] top-9 bottom-0 w-px bg-emerald-100"
                                    aria-hidden
                                />
                            ) : null}

                            <span className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white shadow-sm ring-4 ring-emerald-50">
                                {step.stepOrder}
                            </span>

                            <div className="min-w-0 flex-1">
                                <button
                                    type="button"
                                    onClick={() => handleToggle(step.id)}
                                    aria-expanded={isExpanded}
                                    className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                                        isExpanded
                                            ? "border-emerald-200 bg-emerald-50/80"
                                            : "border-stone-200 bg-stone-50/50 hover:border-emerald-200 hover:bg-emerald-50/40"
                                    }`}
                                >
                                    <span className="text-sm font-semibold leading-snug text-emerald-950">
                                        {step.name}
                                    </span>
                                    <ChevronDown
                                        className={`mt-0.5 h-4 w-4 shrink-0 text-emerald-700 transition-transform duration-200 ${
                                            isExpanded ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {isExpanded && step.description ? (
                                    <div className="mt-2 rounded-xl border border-emerald-100 bg-white px-4 py-3">
                                        <p className="whitespace-pre-line text-sm leading-6 text-neutral-600">
                                            {step.description}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

export default function ProductDetailSpecs({ product }) {
    const storageLabel = formatStorageDuration(product.storage_duration_days);
    const tempLabel = formatStorageTemperature(
        product.min_storage_temp,
        product.max_storage_temp,
    );
    const cultivationProcesses = product.cultivation_processes ?? [];
    const hasCultivation = cultivationProcesses.length > 0;
    const unitSuffix = product.unit
        ? formatUnitLabel(product.unit).startsWith("/")
            ? formatUnitLabel(product.unit)
            : `/${formatUnitLabel(product.unit)}`
        : "";

    return (
        <section className="flex flex-col gap-6">
            <h2 className="text-2xl font-semibold text-emerald-950">
                Mô tả & thông tin chi tiết
            </h2>

            {product.description ? (
                <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                        Mô tả sản phẩm
                    </h3>
                    <p className="whitespace-pre-line text-base leading-7 text-neutral-700">
                        {product.description}
                    </p>
                </div>
            ) : null}

            <div
                className={`grid gap-6 ${hasCultivation ? "lg:grid-cols-2 lg:items-start" : ""}`}
            >
                <SpecSection title="Thông tin sản phẩm" className="h-full">
                    <SpecRow label="Tên sản phẩm" value={product.name} highlight />
                    <SpecRow label="Danh mục" value={product.category_name} />
                    <SpecRow label="Đơn vị tính" value={product.unit} />
                    <SpecRow
                        label="Giá bán"
                        value={`${formatProductPrice(getProductPrice(product))}${unitSuffix}`}
                        highlight
                    />
                    <SpecRow label="Nhà cung cấp gốc" value={product.supplier_name} />
                    <SpecRow
                        label="Tồn kho"
                        value={
                            product.available_quantity != null
                                ? `${product.available_quantity} ${product.unit || ""}`.trim()
                                : null
                        }
                    />
                    <SpecRow
                        label="Nguồn hàng gốc"
                        value={product.supplier_product_name}
                    />
                    <SpecRow
                        label="Hạn sử dụng / bảo quản"
                        value={storageLabel}
                        highlight
                    />
                    <SpecRow label="Nhiệt độ bảo quản" value={tempLabel} />
                    <SpecRow
                        label="Cập nhật lần cuối"
                        value={formatDateVi(product.updated_at)}
                    />
                    <SpecRow
                        label="Ngày đăng bán"
                        value={formatDateVi(product.created_at)}
                    />
                    <SpecRow
                        label="Đã kiểm duyệt"
                        value={
                            product.verified_at
                                ? `${formatDateVi(product.verified_at)}${product.verified_by_username ? ` bởi ${product.verified_by_username}` : ""}`
                                : null
                        }
                    />
                </SpecSection>

                {hasCultivation ? (
                    <CultivationProcessAccordion processes={cultivationProcesses} />
                ) : null}
            </div>

            {product.dealer ? (
                <SpecSection title="Cửa hàng đại lý">
                    <SpecRow
                        label="Tên cửa hàng"
                        value={product.dealer.store_name}
                        highlight
                    />
                    <SpecRow label="Địa chỉ" value={product.dealer.store_address} />
                    <SpecRow label="Tài khoản" value={product.dealer.account_username} />
                    <SpecRow
                        label="Trạng thái cửa hàng"
                        value={
                            product.dealer.status === "approved"
                                ? "Đã xác minh"
                                : product.dealer.status === "pending"
                                    ? "Đang xác minh"
                                    : product.dealer.status
                        }
                    />
                </SpecSection>
            ) : null}

            {product.supplier ? (
                <SpecSection title="Nhà cung cấp">
                    <SpecRow
                        label="Đơn vị cung cấp"
                        value={product.supplier.company_name}
                        highlight
                    />
                    <SpecRow label="Mã số thuế" value={product.supplier.tax_code} />
                    <SpecRow label="Liên hệ" value={product.supplier.phone} />
                    <SpecRow label="Địa chỉ" value={product.supplier.address} />
                    <SpecRow
                        label="Trạng thái xác minh"
                        value={
                            product.supplier.verification_status === "approved"
                                ? "Đã xác minh"
                                : product.supplier.verification_status === "pending"
                                    ? "Đang xác minh"
                                    : product.supplier.verification_status
                        }
                    />
                </SpecSection>
            ) : null}
        </section>
    );
}
