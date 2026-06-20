export const MAX_BUYER_ADDRESSES = 5;

export function parseAddressList(response) {
    if (Array.isArray(response)) return response;

    const top = response?.results ?? response?.data ?? [];
    if (!Array.isArray(top)) return [];

    if (top.length && Array.isArray(top[0]?.results)) {
        return top.flatMap((page) => page.results ?? []);
    }

    return top;
}

export function normalizeBuyerAddress(raw) {
    return {
        id: raw.id,
        customer: raw.customer,
        receiver_name: raw.receiver_name ?? "",
        receiver_phone: raw.receiver_phone ?? "",
        address: raw.address ?? "",
        is_default: Boolean(raw.is_default),
        created_at: raw.created_at ?? null,
        updated_at: raw.updated_at ?? null,
    };
}

export function buildAddressForm(address) {
    return {
        receiver_name: address?.receiver_name ?? "",
        receiver_phone: address?.receiver_phone ?? "",
        address: address?.address ?? "",
        is_default: Boolean(address?.is_default),
    };
}

export function buildAddressPayload(form) {
    return {
        receiver_name: form.receiver_name?.trim() ?? "",
        receiver_phone: form.receiver_phone?.trim() ?? "",
        address: form.address?.trim() ?? "",
        is_default: Boolean(form.is_default),
    };
}

export function formatAddressDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
