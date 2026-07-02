import { useState, useEffect, useCallback, useMemo } from "react";
import {
    HardDrive,
    RefreshCw,
    Save,
    Shield,
    ShoppingCart,
    Truck,
    Undo2,
} from "lucide-react";
import { AdminPageLoadError, AdminPageLoading } from "../../components/Admin/UI/AdminFetchState";
import ConfirmModal from "../../components/common/ConfirmModal";
import { settingService, handleApiError } from "../../services/api/settingService";

const EDITABLE_FIELDS = [
    "max_upload_image_size_mb",
    "max_categories_per_supplier",
    "max_products_per_supplier",
    "max_images_per_product",
    "max_images_per_certification",
    "max_login_attempts",
    "login_lockout_minutes",
    "min_order_amount",
    "max_order_amount",
    "min_deposit_percent",
    "max_deposit_percent",
    "default_deposit_percent",
    "min_delivery_lead_days",
    "shipping_fee",
    "min_lead_hours",
    "morning_cutoff_hour",
    "max_booking_days",
];

const FIELD_META = {
    max_upload_image_size_mb: {
        label: "Giới hạn dung lượng ảnh (MB)",
        suffix: "MB",
        hint: "Kích thước tệp tối đa cho phép upload.",
        min: 0,
        step: 1,
    },
    max_images_per_product: {
        label: "Số lượng ảnh tối đa của sản phẩm",
        hint: "Số lượng ảnh tối đa cho một sản phẩm.",
        min: 0,
        step: 1,
    },
    max_images_per_certification: {
        label: "Số lượng ảnh tối đa của chứng chỉ",
        hint: "Số lượng ảnh tối đa cho một chứng chỉ.",
        min: 0,
        step: 1,
    },
    max_categories_per_supplier: {
        label: "Giới hạn đăng ký danh mục",
        hint: "Số lượng danh mục tối đa mỗi nhà cung cấp.",
        min: 0,
        step: 1,
    },
    max_products_per_supplier: {
        label: "Giới hạn đăng ký sản phẩm",
        hint: "Số lượng sản phẩm tối đa mỗi nhà cung cấp.",
        min: 0,
        step: 1,
    },
    max_login_attempts: {
        label: "Giới hạn số lần đăng nhập thất bại",
        suffix: "lần",
        hint: "Khóa tài khoản tạm thời sau số lần thử không đúng.",
        min: 0,
        step: 1,
    },
    login_lockout_minutes: {
        label: "Thời gian khóa tài khoản",
        suffix: "phút",
        hint: "Thời gian khóa sau khi vượt số lần đăng nhập sai.",
        min: 0,
        step: 1,
    },
    min_order_amount: {
        label: "Giá trị đơn hàng tối thiểu",
        suffix: "VNĐ",
        hint: "Số tiền tối thiểu để đặt một đơn hàng.",
        min: 0,
        step: 1,
    },
    max_order_amount: {
        label: "Giá trị đơn hàng tối đa",
        suffix: "VNĐ",
        hint: "Số tiền tối đa cho phép trên một đơn hàng.",
        min: 0,
        step: 1,
    },
    min_deposit_percent: {
        label: "Tỷ lệ đặt cọc tối thiểu",
        suffix: "%",
        hint: "Phần trăm đặt cọc thấp nhất được phép.",
        min: 0,
        max: 100,
        step: 0.01,
    },
    max_deposit_percent: {
        label: "Tỷ lệ đặt cọc tối đa",
        suffix: "%",
        hint: "Phần trăm đặt cọc cao nhất được phép.",
        min: 0,
        max: 100,
        step: 0.01,
    },
    default_deposit_percent: {
        label: "Tỷ lệ đặt cọc mặc định",
        suffix: "%",
        hint: "Tỷ lệ đặt cọc áp dụng mặc định khi tạo đơn.",
        min: 0,
        max: 100,
        step: 0.01,
    },
    min_delivery_lead_days: {
        label: "Số ngày giao hàng tối thiểu",
        suffix: "ngày",
        hint: "Thời gian chờ giao hàng tối thiểu kể từ khi đặt đơn.",
        min: 0,
        step: 1,
    },
    shipping_fee: {
        label: "Phí giao hàng mặc định",
        suffix: "VNĐ",
        hint: "Phí ship áp dụng mặc định cho đơn hàng.",
        min: 0,
        step: 1,
    },
    min_lead_hours: {
        label: "Thời gian đặt trước tối thiểu",
        suffix: "giờ",
        hint: "Số giờ tối thiểu phải đặt trước khi giao hàng.",
        min: 0,
        step: 1,
    },
    morning_cutoff_hour: {
        label: "Giờ cắt đơn buổi sáng",
        suffix: "h",
        hint: "Giờ cuối cùng trong ngày để nhận đơn giao buổi sáng (0–23).",
        min: 0,
        max: 23,
        step: 1,
    },
    max_booking_days: {
        label: "Số ngày đặt trước tối đa",
        suffix: "ngày",
        hint: "Khách có thể chọn ngày giao trong khoảng bao nhiêu ngày tới.",
        min: 0,
        step: 1,
    },
};

const SECTIONS = [
    {
        id: "storage",
        title: "Lưu trữ & Hình ảnh",
        icon: HardDrive,
        fields: [
            "max_upload_image_size_mb",
            "max_images_per_product",
            "max_images_per_certification",
            "max_categories_per_supplier",
            "max_products_per_supplier",
        ],
    },
    {
        id: "security",
        title: "Bảo mật",
        icon: Shield,
        fields: ["max_login_attempts", "login_lockout_minutes"],
    },
    {
        id: "order",
        title: "Đơn hàng & Thanh toán",
        icon: ShoppingCart,
        fields: [
            "min_order_amount",
            "max_order_amount",
            "min_deposit_percent",
            "max_deposit_percent",
            "default_deposit_percent",
            "min_delivery_lead_days",
        ],
    },
    {
        id: "delivery",
        title: "Giao hàng",
        icon: Truck,
        fields: [
            "shipping_fee",
            "min_lead_hours",
            "morning_cutoff_hour",
            "max_booking_days",
        ],
    },
];

function pickEditableValues(source) {
    return EDITABLE_FIELDS.reduce((acc, key) => {
        const value = source?.[key];
        acc[key] = value == null || value === "" ? "" : String(value);
        return acc;
    }, {});
}

function buildPatch(formValues, originalValues) {
    const patch = {};

    EDITABLE_FIELDS.forEach((key) => {
        const nextRaw = formValues[key];
        const prevRaw = originalValues[key];

        if (nextRaw === prevRaw) return;

        const nextNum = Number(nextRaw);
        if (nextRaw === "" || Number.isNaN(nextNum)) return;

        patch[key] = nextNum;
    });

    return patch;
}

function formatUpdatedAt(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("vi-VN");
}

function formatVndPreview(value) {
    if (value === "" || value == null) return null;
    const num = Number(value);
    if (Number.isNaN(num)) return null;
    return `${new Intl.NumberFormat("vi-VN").format(num)} VNĐ`;
}

function EditableField({ fieldKey, value, onChange }) {
    const meta = FIELD_META[fieldKey];
    const vndPreview = meta.suffix === "VNĐ" ? formatVndPreview(value) : null;

    return (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor={fieldKey}
                className="text-xs font-bold uppercase tracking-wide text-neutral-700"
            >
                {meta.label}
            </label>
            <div className="relative flex items-center">
                <input
                    id={fieldKey}
                    type="number"
                    value={value}
                    min={meta.min}
                    max={meta.max}
                    step={meta.step ?? 1}
                    onChange={(event) => onChange(fieldKey, event.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 font-mono text-base text-zinc-900 outline-none transition-colors [appearance:textfield] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                {meta.suffix ? (
                    <span className="pointer-events-none absolute right-4 text-base font-medium text-neutral-500">
                        {meta.suffix}
                    </span>
                ) : null}
            </div>
            {vndPreview ? (
                <p className="text-sm font-semibold text-emerald-800">{vndPreview}</p>
            ) : null}
            {meta.hint ? (
                <p className="text-xs text-neutral-500">{meta.hint}</p>
            ) : null}
        </div>
    );
}

export default function SettingsAside() {
    const [config, setConfig] = useState(null);
    const [formValues, setFormValues] = useState(() => pickEditableValues(null));
    const [originalValues, setOriginalValues] = useState(() =>
        pickEditableValues(null),
    );
    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);

    const applyConfig = useCallback((data) => {
        setConfig(data);
        const editable = pickEditableValues(data);
        setFormValues(editable);
        setOriginalValues(editable);
    }, []);

    const fetchConfig = useCallback(async () => {
        try {
            setIsFetching(true);
            setLoadError("");
            const data = await settingService.get();
            applyConfig(data);
        } catch (err) {
            setLoadError(handleApiError(err, "Không thể tải cấu hình hệ thống"));
        } finally {
            setIsFetching(false);
        }
    }, [applyConfig]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const isDirty = useMemo(
        () => JSON.stringify(formValues) !== JSON.stringify(originalValues),
        [formValues, originalValues],
    );

    const changedCount = useMemo(() => {
        return EDITABLE_FIELDS.filter((key) => formValues[key] !== originalValues[key])
            .length;
    }, [formValues, originalValues]);

    const handleFieldChange = (key, value) => {
        setFormValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setFormValues(originalValues);
    };

    const handleConfirmUpdate = async () => {
        const patch = buildPatch(formValues, originalValues);
        if (!Object.keys(patch).length) return;

        setIsSaving(true);
        try {
            const updated = await settingService.update(patch);
            applyConfig(updated);
        } catch (err) {
            throw new Error(handleApiError(err, "Không thể cập nhật cấu hình"));
        } finally {
            setIsSaving(false);
        }
    };

    if (isFetching) {
        return (
            <aside className="min-h-screen w-full max-w-full bg-neutral-50 p-4 font-sans antialiased text-zinc-900 md:p-8">
                <AdminPageLoading message="Đang tải cấu hình hệ thống..." />
            </aside>
        );
    }

    if (loadError) {
        return (
            <aside className="min-h-screen w-full max-w-full bg-neutral-50 p-4 font-sans antialiased text-zinc-900 md:p-8">
                <AdminPageLoadError message={loadError} onRetry={fetchConfig} />
            </aside>
        );
    }

    const allowedTypes = Array.isArray(config?.allowed_image_types)
        ? config.allowed_image_types
        : [];

    return (
        <aside className="min-h-screen w-full max-w-full bg-neutral-50 p-4 font-sans antialiased text-zinc-900 md:p-8">
            <div className="flex w-full flex-col items-start justify-start gap-8 rounded-lg border border-neutral-200 bg-white px-6 py-8 shadow-sm md:px-8 md:pb-16 md:pt-10">
                <div className="flex w-full flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-['Noto_Serif',serif] text-2xl font-semibold leading-8 text-zinc-900">
                            Cấu hình hệ thống
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500">
                            Xem và chỉnh sửa giới hạn nghiệp vụ toàn hệ thống.
                        </p>
                        <p className="mt-2 text-xs text-neutral-400">
                            Cập nhật lần cuối:{" "}
                            <span className="font-medium text-neutral-600">
                                {formatUpdatedAt(config?.updated_at)}
                            </span>
                            {config?.updated_by_username
                                ? ` · bởi ${config.updated_by_username}`
                                : null}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={fetchConfig}
                            disabled={isSaving}
                            title="Tải lại"
                            className="cursor-pointer inline-flex shrink-0 items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Tải lại
                        </button>

                        {isDirty ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={isSaving}
                                    className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
                                >
                                    <Undo2 className="h-4 w-4" />
                                    Hoàn tác
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmOpen(true)}
                                    disabled={isSaving}
                                    className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    Cập nhật ({changedCount})
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>

                {isDirty ? (
                    <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Bạn đã thay đổi {changedCount} trường cấu hình. Nhấn{" "}
                        <strong>Cập nhật</strong> để lưu thay đổi.
                    </div>
                ) : null}

                {SECTIONS.map(({ id, title, icon: Icon, fields }) => (
                    <div key={id} className="flex w-full flex-col gap-6">
                        <div className="inline-flex w-full items-center gap-3 border-b border-neutral-200 pb-4">
                            <Icon className="h-5 w-5 text-emerald-950" />
                            <h2 className="font-serif text-xl font-semibold leading-7 text-zinc-900">
                                {title}
                            </h2>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
                            {fields.map((fieldKey) => (
                                <EditableField
                                    key={fieldKey}
                                    fieldKey={fieldKey}
                                    value={formValues[fieldKey]}
                                    onChange={handleFieldChange}
                                />
                            ))}
                        </div>

                        {id === "storage" ? (
                            <div className="flex w-full flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wide text-neutral-700">
                                    Các loại file ảnh được phép upload
                                </label>
                                <div className="flex w-full flex-wrap gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                                    {allowedTypes.length > 0 ? (
                                        allowedTypes.map((type) => (
                                            <span
                                                key={type}
                                                className="rounded-md bg-emerald-100 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-800"
                                            >
                                                {type}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-neutral-400">—</span>
                                    )}
                                </div>
                                <p className="text-xs text-neutral-500">
                                    Trường này cố định trong hệ thống, không thể chỉnh sửa qua
                                    giao diện.
                                </p>
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmUpdate}
                title="Xác nhận cập nhật cấu hình"
                message={
                    <div className="space-y-3 text-sm leading-6">
                        <p>
                            Bạn sắp cập nhật{" "}
                            <strong>{changedCount} trường</strong> cấu hình hệ thống. Thay
                            đổi có thể ảnh hưởng đến upload, đặt hàng, giao hàng và bảo mật
                            trên toàn nền tảng.
                        </p>
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                            <strong>Cảnh báo:</strong> Thay đổi có hiệu lực sau khi cache hết
                            hạn (tối đa ~5 phút) hoặc ngay sau request tiếp theo trên cùng
                            worker.
                        </p>
                        <p>Bạn có chắc chắn muốn tiếp tục?</p>
                    </div>
                }
                confirmText="Cập nhật"
                cancelText="Hủy"
                variant="warning"
                successMessage="Đã cập nhật cấu hình hệ thống."
                errorMessage="Không thể cập nhật cấu hình. Vui lòng thử lại."
                loading={isSaving}
            />
        </aside>
    );
}
