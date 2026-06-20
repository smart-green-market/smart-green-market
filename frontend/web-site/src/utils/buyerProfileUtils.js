import { resolveMediaUrl } from "./userProductUtils";

export function normalizeBuyerProfile(raw) {
    const user = raw?.user ?? {};

    return {
        id: raw?.id,
        user: {
            id: user.id,
            email: user.email ?? "",
            full_name: user.full_name ?? "",
            phone: user.phone ?? "",
            avatar_url: resolveMediaUrl(user.avatar_url),
            username: user.username ?? "",
            status: user.status ?? "",
        },
        favorite_category:
            raw?.favorite_category != null ? Number(raw.favorite_category) : null,
        total_orders: raw?.total_orders ?? 0,
        total_spent: raw?.total_spent ?? "0",
        loyalty_points: raw?.loyalty_points ?? 0,
        last_order_at: raw?.last_order_at ?? null,
        note: raw?.note ?? "",
        created_at: raw?.created_at ?? null,
        updated_at: raw?.updated_at ?? null,
    };
}

export function buildBuyerProfileForm(profile) {
    return {
        full_name: profile?.user?.full_name ?? "",
        phone: profile?.user?.phone ?? "",
        note: profile?.note ?? "",
        favorite_category:
            profile?.favorite_category != null
                ? String(profile.favorite_category)
                : "",
    };
}

export function buildBuyerProfileUpdatePayload(form, profile) {
    const payload = {};

    const fullName = form.full_name?.trim() ?? "";
    const phone = form.phone?.trim() ?? "";
    const note = form.note?.trim() ?? "";
    const favoriteCategory =
        form.favorite_category === "" || form.favorite_category == null
            ? null
            : Number(form.favorite_category);

    if (fullName !== (profile?.user?.full_name ?? "")) {
        payload.full_name = fullName;
    }

    if (phone !== (profile?.user?.phone ?? "")) {
        payload.phone = phone;
    }

    if (note !== (profile?.note ?? "")) {
        payload.note = note;
    }

    const currentFavorite = profile?.favorite_category ?? null;
    if (favoriteCategory !== currentFavorite) {
        payload.favorite_category = favoriteCategory;
    }

    return payload;
}

export function appendBuyerProfileFormData(formData, form) {
    if (form.full_name?.trim()) {
        formData.append("full_name", form.full_name.trim());
    }
    if (form.phone?.trim()) {
        formData.append("phone", form.phone.trim());
    }
    if (form.note != null) {
        formData.append("note", form.note.trim());
    }
    if (form.favorite_category !== "" && form.favorite_category != null) {
        formData.append("favorite_category", String(form.favorite_category));
    }
}

export function syncBuyerUserStorage(profile) {
    const saved = localStorage.getItem("user");
    if (!saved) return;

    try {
        const current = JSON.parse(saved);
        localStorage.setItem(
            "user",
            JSON.stringify({
                ...current,
                full_name: profile?.user?.full_name ?? current.full_name,
                phone: profile?.user?.phone ?? current.phone,
                avatar_url: profile?.user?.avatar_url ?? current.avatar_url,
            }),
        );
    } catch {
        // ignore invalid storage
    }
}

export function formatBuyerSpent(value) {
    const amount = Number(value);
    if (Number.isNaN(amount)) return "0 ₫";
    return `${amount.toLocaleString("vi-VN")} ₫`;
}

export function formatBuyerDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}
