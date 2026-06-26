import { formatDeliverySlotTimeRange } from "./buyerOrderUtils";

export function getDealerMapEmbedUrl(address) {
    const query = encodeURIComponent(String(address || "").trim());
    if (!query) return "";
    return `https://maps.google.com/maps?q=${query}&hl=vi&z=16&output=embed`;
}

export function getDealerMapSearchUrl(address) {
    const query = encodeURIComponent(String(address || "").trim());
    if (!query) return "";
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function formatStatValue(value, suffix = "+") {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return "—";
    if (num >= 1000) return `${num.toLocaleString("vi-VN")}${suffix}`;
    return `${num}${suffix}`;
}

function formatRating(average, count) {
    const reviewCount = Number(count);
    const avg = Number(average);
    if (!Number.isFinite(reviewCount) || reviewCount <= 0) return "Chưa có";
    if (!Number.isFinite(avg)) return "—";
    return `${avg.toFixed(1)}/5`;
}

function formatCurrency(amount) {
    const num = Number(amount);
    if (!Number.isFinite(num)) return "—";
    return `${num.toLocaleString("vi-VN")} ₫`;
}

function normalizeDeliverySlot(slot) {
    if (slot == null) return null;

    if (typeof slot === "string") {
        const trimmed = slot.trim();
        return trimmed ? { id: trimmed, label: trimmed } : null;
    }

    if (typeof slot !== "object") return null;

    const id = slot.id ?? slot.slot ?? slot.delivery_slot ?? "";
    const name = slot.name ?? slot.label ?? slot.slot_name ?? "";
    const timeLabel = formatDeliverySlotTimeRange(slot.start_time, slot.end_time);
    const label =
        [name, timeLabel].filter(Boolean).join(" • ") ||
        timeLabel ||
        name ||
        String(id);

    if (!label) return null;

    return { id: id || label, label };
}

export function normalizeDealerAbout(data) {
    if (!data) return null;

    const stats = data.stats ?? {};
    const reviewSummary = data.review_summary ?? {};
    const delivery = data.delivery_policy ?? {};
    const contact = data.contact ?? {};

    const foundedYear = data.created_at
        ? new Date(data.created_at).getFullYear()
        : null;

    const highlights = [
        {
            label: "Khách hàng tin tưởng",
            value: formatStatValue(stats.customer_count),
        },
        {
            label: "Sản phẩm đang bán",
            value: formatStatValue(stats.active_product_count),
        },
        {
            label: "Đơn hàng hoàn thành",
            value: formatStatValue(stats.completed_order_count),
        },
        {
            label: "Đánh giá trung bình",
            value: formatRating(
                reviewSummary.average_rating,
                reviewSummary.review_count,
            ),
        },
    ];

    const certifications = Array.isArray(data.verification_badges)
        ? data.verification_badges.filter(Boolean)
        : [];

    if (data.is_platform_verified && !certifications.includes("Đã xác minh nền tảng")) {
        certifications.unshift("Đã xác minh nền tảng");
    }

    const deliverySlots = Array.isArray(delivery.slots)
        ? delivery.slots.map(normalizeDeliverySlot).filter(Boolean)
        : [];

    return {
        storeName: data.store_name || "Cửa hàng",
        tagline:
            certifications[0] ||
            (data.is_platform_verified ? "Đã xác minh nền tảng" : "Nông sản sạch — Tươi mỗi ngày"),
        description: data.description || "",
        logoUrl: data.logo_url || "",
        foundedYear,
        address: data.store_address || "",
        mapQuery: data.store_address || "",
        phone: contact.phone || "",
        email: contact.email || "",
        contactName: contact.full_name || "",
        contactAvatarUrl: contact.avatar_url || "",
        website: data.storefront_url || "",
        highlights,
        certifications,
        deliverySlots,
        shippingFee: delivery.shipping_fee,
        minOrderAmount: delivery.min_order_amount,
        minLeadHours: delivery.min_lead_hours,
        maxBookingDays: delivery.max_booking_days,
        reviewCount: reviewSummary.review_count ?? 0,
        averageRating: reviewSummary.average_rating ?? 0,
        categoryCount: stats.category_count ?? 0,
        totalSold: stats.total_sold ?? 0,
    };
}

export function formatDeliveryFee(shippingFee) {
    const num = Number(shippingFee);
    if (!Number.isFinite(num)) return "Liên hệ cửa hàng";
    if (num <= 0) return "Miễn phí";
    return formatCurrency(num);
}

export function formatMinOrderAmount(minOrderAmount) {
    const num = Number(minOrderAmount);
    if (!Number.isFinite(num) || num <= 0) return "Không yêu cầu";
    return formatCurrency(num);
}

export function buildPhoneHref(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    return digits ? `tel:${digits}` : undefined;
}

/** Kênh liên hệ từ dealer API — dùng tạm cho About Us & Contact cho đến khi có API contact riêng. */
export function buildDealerContactChannels(dealer) {
    if (!dealer) return [];

    const channels = [];

    if (dealer.phone) {
        channels.push({
            id: "phone",
            label: "Hotline / Zalo",
            value: dealer.phone,
            href: buildPhoneHref(dealer.phone),
        });
    }

    if (dealer.email) {
        channels.push({
            id: "email",
            label: "Email",
            value: dealer.email,
            href: `mailto:${dealer.email}`,
        });
    }

    return channels;
}
