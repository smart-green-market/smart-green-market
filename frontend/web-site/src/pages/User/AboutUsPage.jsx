import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Award,
    Building2,
    Clock3,
    Globe,
    Leaf,
    Loader2,
    Mail,
    MapPin,
    Package,
    Phone,
    Truck,
    User,
} from "lucide-react";
import { useScrollToHash } from "../../hooks/useScrollToHash";
import { useDealerSlug, useStorefrontPaths } from "../../hooks/useStorefrontPaths";
import {
    buyerDealerService,
    handleApiError,
} from "../../services/api/Buyer/buyerDealerService";
import {
    buildDealerContactChannels,
    buildPhoneHref,
    formatDeliveryFee,
    formatMinOrderAmount,
    getDealerMapEmbedUrl,
    getDealerMapSearchUrl,
    normalizeDealerAbout,
} from "../../utils/dealerAboutUtils";

function InfoRow({ icon: Icon, label, value, href }) {
    if (!value) return null;

    const content = (
        <div className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/80 p-4 transition-colors hover:border-emerald-100 hover:bg-emerald-50/40">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {label}
                </p>
                <p className="mt-0.5 break-words text-sm font-medium text-emerald-950 sm:text-base">
                    {value}
                </p>
            </div>
        </div>
    );

    if (href) {
        return (
            <a href={href} className="block no-underline">
                {content}
            </a>
        );
    }

    return content;
}

export default function AboutUsPage() {
    useScrollToHash(120);
    const dealerSlug = useDealerSlug();
    const paths = useStorefrontPaths();
    const [dealer, setDealer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDealer = useCallback(async () => {
        if (!dealerSlug) {
            setDealer(null);
            setError("Chưa xác định cửa hàng.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await buyerDealerService.getDealer(dealerSlug);
            setDealer(normalizeDealerAbout(data));
        } catch (err) {
            setError(handleApiError(err, "Không thể tải thông tin cửa hàng"));
            setDealer(null);
        } finally {
            setLoading(false);
        }
    }, [dealerSlug]);

    useEffect(() => {
        loadDealer();
    }, [loadDealer]);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
            </div>
        );
    }

    if (error || !dealer) {
        return (
            <div className="mx-auto max-w-[1280px] px-4 py-16 text-center sm:px-10">
                <p className="text-neutral-600">{error || "Không có dữ liệu cửa hàng."}</p>
                <button
                    type="button"
                    onClick={loadDealer}
                    className="mt-4 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    const mapUrl = getDealerMapEmbedUrl(dealer.mapQuery);
    const mapSearchUrl = getDealerMapSearchUrl(dealer.mapQuery);
    const phoneHref = buildPhoneHref(dealer.phone);
    const contactChannels = buildDealerContactChannels(dealer);

    return (
        <div className="bg-gray-50 pb-16">
            {/* Hero */}
            <div className="border-b border-emerald-900/10 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 text-white">
                <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-10 sm:py-16">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-emerald-100">
                        <Link
                            to={paths.home}
                            className="text-emerald-100/90 no-underline hover:text-white"
                        >
                            Cửa hàng
                        </Link>
                        <span>/</span>
                        <span className="font-medium text-white">Về chúng tôi</span>
                    </div>
                    <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
                        {dealer.logoUrl ? (
                            <img
                                src={dealer.logoUrl}
                                alt={dealer.storeName}
                                className="h-20 w-20 shrink-0 rounded-2xl border border-white/20 bg-white object-cover shadow-md sm:h-24 sm:w-24"
                            />
                        ) : null}
                        <div className="max-w-2xl">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                                <Leaf className="h-3.5 w-3.5" />
                                {dealer.tagline}
                            </span>
                            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                                {dealer.storeName}
                            </h1>
                            {dealer.description ? (
                                <p className="mt-4 text-base leading-relaxed text-emerald-50/95 sm:text-lg">
                                    {dealer.description}
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {dealer.highlights.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
                            >
                                <p className="text-lg font-bold sm:text-xl">{item.value}</p>
                                <p className="mt-0.5 text-xs text-emerald-100">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* About — map + info */}
            <section
                id="ve-chung-toi"
                className="scroll-mt-28 mx-auto max-w-[1280px] px-4 pt-12 sm:px-10 sm:pt-16"
            >
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-emerald-950 sm:text-3xl">
                            Về chúng tôi
                        </h2>
                    </div>
                    <Link
                        to={{ pathname: paths.about, hash: "#lien-he" }}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800 no-underline transition-colors hover:bg-emerald-50"
                    >
                        <Phone className="h-4 w-4" />
                        Liên hệ ngay
                    </Link>
                </div>

                <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
                    {/* Map */}
                    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                        <div className="border-b border-stone-100 px-5 py-4">
                            <div className="flex items-center gap-2 text-emerald-900">
                                <MapPin className="h-5 w-5 shrink-0" />
                                <p className="font-semibold">Vị trí cửa hàng</p>
                            </div>
                            {dealer.address ? (
                                <p className="mt-1 text-sm text-neutral-600">{dealer.address}</p>
                            ) : (
                                <p className="mt-1 text-sm text-neutral-500">
                                    Chưa cập nhật địa chỉ cửa hàng.
                                </p>
                            )}
                        </div>
                        <div className="relative aspect-[4/3] min-h-[280px] w-full bg-stone-100 lg:aspect-auto lg:min-h-[420px]">
                            {mapUrl ? (
                                <iframe
                                    title={`Bản đồ ${dealer.storeName}`}
                                    src={mapUrl}
                                    className="absolute inset-0 h-full w-full border-0"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-neutral-500">
                                    Không thể hiển thị bản đồ khi chưa có địa chỉ.
                                </div>
                            )}
                        </div>
                        {mapSearchUrl ? (
                            <div className="px-5 py-3">
                                <a
                                    href={mapSearchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-emerald-700 no-underline hover:underline"
                                >
                                    Mở trong Google Maps →
                                </a>
                            </div>
                        ) : null}
                    </div>

                    {/* Dealer info */}
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
                            <div className="flex items-center gap-3">
                                {dealer.logoUrl ? (
                                    <img
                                        src={dealer.logoUrl}
                                        alt={dealer.storeName}
                                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                                    />
                                ) : (
                                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                                        <Building2 className="h-6 w-6" />
                                    </span>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-emerald-950">
                                        {dealer.storeName}
                                    </h3>
                                    {dealer.foundedYear ? (
                                        <p className="text-sm text-neutral-500">
                                            Hoạt động từ năm {dealer.foundedYear}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                            {dealer.description ? (
                                <p className="mt-5 text-sm leading-7 text-neutral-700 sm:text-base">
                                    {dealer.description}
                                </p>
                            ) : null}
                            {dealer.certifications.length > 0 ? (
                                <ul className="mt-5 space-y-2">
                                    {dealer.certifications.map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-center gap-2 text-sm text-emerald-900"
                                        >
                                            <Award className="h-4 w-4 shrink-0 text-emerald-600" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoRow
                                icon={Phone}
                                label="Hotline"
                                value={dealer.phone}
                                href={phoneHref}
                            />
                            <InfoRow
                                icon={Mail}
                                label="Email"
                                value={dealer.email}
                                href={dealer.email ? `mailto:${dealer.email}` : undefined}
                            />
                            <InfoRow
                                icon={User}
                                label="Người liên hệ"
                                value={dealer.contactName}
                            />
                            <InfoRow
                                icon={Globe}
                                label="Cửa hàng trực tuyến"
                                value={dealer.website}
                                href={dealer.website || undefined}
                            />
                        </div>

                        {dealer.deliverySlots.length > 0 ||
                        dealer.shippingFee != null ||
                        dealer.minOrderAmount != null ? (
                            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-2 text-emerald-900">
                                    <Truck className="h-5 w-5" />
                                    <h3 className="font-semibold">Chính sách giao hàng</h3>
                                </div>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center justify-between gap-4 border-b border-stone-100 py-2">
                                        <span className="text-neutral-600">Phí giao hàng</span>
                                        <span className="font-medium text-emerald-950">
                                            {formatDeliveryFee(dealer.shippingFee)}
                                        </span>
                                    </li>
                                    <li className="flex items-center justify-between gap-4 border-b border-stone-100 py-2">
                                        <span className="text-neutral-600">Đơn tối thiểu</span>
                                        <span className="font-medium text-emerald-950">
                                            {formatMinOrderAmount(dealer.minOrderAmount)}
                                        </span>
                                    </li>
                                    {dealer.minLeadHours != null ? (
                                        <li className="flex items-center justify-between gap-4 border-b border-stone-100 py-2">
                                            <span className="text-neutral-600">
                                                Đặt trước tối thiểu
                                            </span>
                                            <span className="font-medium text-emerald-950">
                                                {dealer.minLeadHours} giờ
                                            </span>
                                        </li>
                                    ) : null}
                                    {dealer.maxBookingDays != null ? (
                                        <li className="flex items-center justify-between gap-4 border-b border-stone-100 py-2">
                                            <span className="text-neutral-600">
                                                Đặt trước tối đa
                                            </span>
                                            <span className="font-medium text-emerald-950">
                                                {dealer.maxBookingDays} ngày
                                            </span>
                                        </li>
                                    ) : null}
                                    {dealer.categoryCount > 0 ? (
                                        <li className="flex items-center justify-between gap-4 border-b border-stone-100 py-2">
                                            <span className="flex items-center gap-1.5 text-neutral-600">
                                                <Package className="h-4 w-4" />
                                                Danh mục sản phẩm
                                            </span>
                                            <span className="font-medium text-emerald-950">
                                                {dealer.categoryCount}
                                            </span>
                                        </li>
                                    ) : null}
                                </ul>
                                {dealer.deliverySlots.length > 0 ? (
                                    <div className="mt-4">
                                        <div className="mb-2 flex items-center gap-2 text-emerald-900">
                                            <Clock3 className="h-4 w-4" />
                                            <p className="text-sm font-semibold">
                                                Khung giờ giao hàng
                                            </p>
                                        </div>
                                        <ul className="space-y-2">
                                            {dealer.deliverySlots.map((slot) => (
                                                <li
                                                    key={slot.id}
                                                    className="rounded-lg bg-stone-50 px-3 py-2 text-sm font-medium text-emerald-950"
                                                >
                                                    {slot.label}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            <section
                id="lien-he"
                className="scroll-mt-28 mx-auto mt-16 max-w-[1280px] px-4 sm:px-10"
            >
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <div className="grid lg:grid-cols-[1fr_1.2fr]">
                        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-8 text-white sm:p-10">
                            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                                Liên hệ {dealer.storeName}
                            </h2>

                            {dealer.contactAvatarUrl ? (
                                <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4">
                                    <img
                                        src={dealer.contactAvatarUrl}
                                        alt={dealer.contactName || dealer.storeName}
                                        className="h-12 w-12 rounded-full border border-white/20 object-cover"
                                    />
                                    <div>
                                        {dealer.contactName ? (
                                            <p className="font-semibold text-white">
                                                {dealer.contactName}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}

                            <ul className="mt-8 space-y-4">
                                {contactChannels.length > 0 ? (
                                    contactChannels.map((channel) => {
                                        const card = (
                                            <div className="group block rounded-xl border border-white/15 bg-white/10 p-4 transition-colors hover:bg-white/15">
                                                <p className="text-xs uppercase tracking-wide text-emerald-100">
                                                    {channel.label}
                                                </p>
                                                <p className="mt-1 break-words text-lg font-semibold text-white group-hover:underline">
                                                    {channel.value}
                                                </p>
                                            </div>
                                        );

                                        if (!channel.href) {
                                            return <li key={channel.id}>{card}</li>;
                                        }

                                        return (
                                            <li key={channel.id}>
                                                <a
                                                    href={channel.href}
                                                    target={
                                                        channel.external
                                                            ? "_blank"
                                                            : undefined
                                                    }
                                                    rel={
                                                        channel.external
                                                            ? "noopener noreferrer"
                                                            : undefined
                                                    }
                                                    className="block no-underline"
                                                >
                                                    {card}
                                                </a>
                                            </li>
                                        );
                                    })
                                ) : (
                                    <li className="rounded-xl border border-white/15 bg-white/10 p-4 text-sm text-emerald-100">
                                        Chưa có thông tin liên hệ.
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="p-8 sm:p-10">
                            <h3 className="text-lg font-semibold text-emerald-950">
                                Gửi tin nhắn cho chúng tôi
                            </h3>
                            <form
                                className="mt-6 space-y-4"
                                onSubmit={(event) => event.preventDefault()}
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                                            Họ và tên
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Nguyễn Văn A"
                                            className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                                            Số điện thoại
                                        </span>
                                        <input
                                            type="tel"
                                            placeholder="090x xxx xxx"
                                            className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </label>
                                </div>
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                                        Email
                                    </span>
                                    <input
                                        type="email"
                                        placeholder="email@example.com"
                                        className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                                        Nội dung
                                    </span>
                                    <textarea
                                        rows={4}
                                        placeholder="Bạn cần hỗ trợ điều gì?"
                                        className="w-full resize-none rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </label>
                                <button
                                    type="submit"
                                    className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 sm:w-auto sm:px-8"
                                >
                                    Gửi liên hệ
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
