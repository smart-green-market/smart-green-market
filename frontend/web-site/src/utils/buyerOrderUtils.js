export const CHECKOUT_SHIPPING_FEE = 10000;

export function parseDeliverySlots(response) {
    const dates = response?.dates ?? response?.results ?? [];

    if (!Array.isArray(dates)) return [];

    return dates
        .map((entry) => {
            const slots = (entry.slots ?? [])
                .filter((slot) => slot.available !== false)
                .map((slot) => ({
                    id: slot.id ?? slot.slot ?? "",
                    name: slot.name ?? slot.label ?? slot.slot_name ?? slot.id ?? "",
                    available: slot.available !== false,
                }))
                .filter((slot) => slot.id);

            return {
                date: entry.date ?? "",
                label: entry.label ?? entry.date ?? "",
                slots,
            };
        })
        .filter((entry) => entry.date && entry.slots.length > 0);
}

export function buildCreateOrderPayload({
    items,
    customerAddressId,
    deliveryDate,
    deliverySlot,
    note,
}) {
    return {
        items: items.map((item) => ({
            dealer_product_id: item.id,
            quantity: item.quantity,
        })),
        customer_address_id: customerAddressId,
        delivery_date: deliveryDate,
        delivery_slot: deliverySlot,
        ...(note?.trim() ? { note: note.trim() } : {}),
    };
}
