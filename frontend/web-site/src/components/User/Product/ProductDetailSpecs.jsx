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
            <dt className="w-full shrink-0 text-sm font-medium text-neutral-500 sm:w-44">{label}</dt>
            <dd
                className={`text-sm leading-6 ${highlight ? "font-semibold text-emerald-950" : "text-zinc-800"
                    }`}
            >
                {value}
            </dd>
        </div>
    );
}

function SpecSection({ title, children }) {
    return (
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-['Noto_Serif',serif] text-lg font-semibold text-emerald-950">
                {title}
            </h3>
            <dl>{children}</dl>
        </div>
    );
}

export default function ProductDetailSpecs({ product }) {
    const storageLabel = formatStorageDuration(product.storage_duration_days);
    const tempLabel = formatStorageTemperature(
        product.min_storage_temp,
        product.max_storage_temp,
    );

    return (
        <section className="flex flex-col gap-6">
            <h2 className="font-['Noto_Serif',serif] text-2xl font-semibold text-emerald-950">
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

            <div className="grid gap-6 lg:grid-cols-2">
                <SpecSection title="Thông tin sản phẩm">
                    <SpecRow label="Tên sản phẩm" value={product.name} highlight />
                    <SpecRow label="Danh mục" value={product.category_name} />
                    <SpecRow label="Đơn vị tính" value={product.unit} />
                    <SpecRow
                        label="Giá bán"
                        value={`${formatProductPrice(getProductPrice(product))}${formatUnitLabel(product.unit)}`}
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
                    <SpecRow label="Nguồn hàng gốc" value={product.supplier_product_name} />
                    <SpecRow label="Mã sản phẩm" value={product.slug || `#${product.id}`} />
                </SpecSection>

                <SpecSection title="Bảo quản & sử dụng">
                    <SpecRow label="Hạn sử dụng / bảo quản" value={storageLabel} highlight />
                    <SpecRow label="Nhiệt độ bảo quản" value={tempLabel} />
                    <SpecRow label="Cập nhật lần cuối" value={formatDateVi(product.updated_at)} />
                    <SpecRow label="Ngày đăng bán" value={formatDateVi(product.created_at)} />
                    <SpecRow
                        label="Đã kiểm duyệt"
                        value={
                            product.verified_at
                                ? `${formatDateVi(product.verified_at)}${product.verified_by_username ? ` bởi ${product.verified_by_username}` : ""}`
                                : null
                        }
                    />
                </SpecSection>
            </div>

            {product.dealer ? (
                <SpecSection title="Cửa hàng đại lý">
                    <SpecRow label="Tên cửa hàng" value={product.dealer.store_name} highlight />
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
