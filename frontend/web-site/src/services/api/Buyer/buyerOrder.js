import axiosClient from "../axiosClient";

function normalizeOrderItem(item) {
    if (!item) return null;
    return {
        id: item.id,
        dealer_product_id: item.dealer_product_id,
        product_name: item.product_name ?? item.name ?? "",
        product_unit: item.product_unit ?? item.unit ?? "",
        product_thumbnail_url: item.product_thumbnail_url ?? item.thumbnail_url ?? "",
        quantity: item.quantity ?? 0,
        unit_price: item.unit_price ?? item.price ?? 0,
        subtotal: item.subtotal ?? item.line_total ?? 0,
    };
}

function normalizePayment(payment) {
    if (!payment) return null;
    return {
        id: payment.id,
        payment_method: payment.payment_method ?? "",
        payment_type: payment.payment_type ?? "",
        amount: payment.amount ?? 0,
        status: payment.status ?? "",
        paid_at: payment.paid_at ?? null,
        created_at: payment.created_at ?? null,
    };
}

function normalizeStatusHistory(entry) {
    if (!entry) return null;
    return {
        id: entry.id,
        status: entry.status ?? entry.new_status ?? "",
        label: entry.label ?? entry.status ?? entry.new_status ?? "",
        old_status: entry.old_status ?? "",
        new_status: entry.new_status ?? "",
        note: entry.note ?? "",
        changed_by_name: entry.changed_by_name ?? "",
        created_at: entry.created_at ?? null,
    };
}

/** Map 1 đơn từ API list (getAll) — không có items/payments/status_histories */
export function parseBuyerOrderSummary(raw) {
    if (!raw) return null;
    return {
        id: raw.id,
        order_code: raw.order_code ?? "",
        status: raw.status ?? "",
        dealer_name: raw.dealer_name ?? "",
        customer_name: raw.customer_name ?? "",
        payment_method: raw.payment_method ?? "",
        subtotal_amount: raw.subtotal_amount ?? 0,
        discount_amount: raw.discount_amount ?? 0,
        shipping_fee: raw.shipping_fee ?? 0,
        total_amount: raw.total_amount ?? 0,
        item_count: raw.item_count ?? 0,
        delivery_time: raw.delivery_time ?? null,
        delivery_date: raw.delivery_date ?? "",
        delivery_slot: raw.delivery_slot ?? "",
        delivery_slot_name: raw.delivery_slot_name ?? "",
        created_at: raw.created_at ?? null,
    };
}

/** Map chi tiết đơn từ API getById */
export function parseBuyerOrderDetail(raw) {
    if (!raw) return null;
    return {
        ...parseBuyerOrderSummary(raw),
        customer_phone: raw.customer_phone ?? "",
        receiver_name: raw.receiver_name ?? "",
        receiver_phone: raw.receiver_phone ?? "",
        delivery_address: raw.delivery_address ?? "",
        shipping_address: raw.shipping_address ?? "",
        note: raw.note ?? "",
        paid_amount: raw.paid_amount ?? 0,
        debt_amount: raw.debt_amount ?? 0,
        items: (raw.items ?? []).map(normalizeOrderItem).filter(Boolean),
        payments: (raw.payments ?? []).map(normalizePayment).filter(Boolean),
        status_histories: (raw.status_histories ?? []).map(normalizeStatusHistory).filter(Boolean),
        delivered_at: raw.delivered_at ?? null,
        completed_at: raw.completed_at ?? null,
        updated_at: raw.updated_at ?? null,
    };
}

export function parseBuyerOrderList(response) {
    if (Array.isArray(response)) {
        return response.map(parseBuyerOrderSummary).filter(Boolean);
    }
    const results = response?.results ?? [];
    return results.map(parseBuyerOrderSummary).filter(Boolean);
}

export const buyerOrder = {
    getAll: (dealer_slug) => axiosClient.get(`/storefronts/${dealer_slug}/orders/`).then((res) => res.data),

            // {
            //     "count": 0,
            //     "next": "string",
            //     "previous": "string",
            //     "page": 0,
            //     "page_size": 0,
            //     "has_more": true,
            //     "results": [
            //       {
            //         "id": 0,
            //         "order_code": "string",
            //         "status": "pending",
            //         "dealer_name": "string",
            //         "customer_name": "string",
            //         "payment_method": "string",
            //         "subtotal_amount": "-15.81",
            //         "discount_amount": "-6947",
            //         "shipping_fee": "8150402772.",
            //         "total_amount": "-3391483",
            //         "item_count": 0,
            //         "delivery_time": "2026-06-20T04:35:49.764Z",
            //         "delivery_date": "string",
            //         "delivery_slot": "string",
            //         "delivery_slot_name": "string",
            //         "created_at": "2026-06-20T04:35:49.764Z"
            //       }
            //     ]
            //   }     

    getById: (dealer_slug, id) => axiosClient.get(`/storefronts/${dealer_slug}/orders/${id}/`).then((res) => res.data),

            // {
            //     "id": 0,
            //     "order_code": "string",
            //     "status": "pending",
            //     "dealer_name": "string",
            //     "customer_name": "string",
            //     "customer_phone": "string",
            //     "payment_method": "string",
            //     "receiver_name": "string",
            //     "receiver_phone": "string",
            //     "delivery_address": "string",
            //     "delivery_time": "2026-06-20T04:36:33.562Z",
            //     "delivery_date": "string",
            //     "delivery_slot": "string",
            //     "delivery_slot_name": "string",
            //     "note": "string",
            //     "shipping_address": "string",
            //     "subtotal_amount": "-55948984",
            //     "discount_amount": "-134724756763.",
            //     "shipping_fee": "-65430456.93",
            //     "total_amount": "44255",
            //     "paid_amount": "866",
            //     "debt_amount": "-03",
            //     "items": [
            //       {
            //         "id": 0,
            //         "dealer_product_id": 0,
            //         "product_name": "string",
            //         "product_unit": "string",
            //         "product_thumbnail_url": "string",
            //         "quantity": 2147483647,
            //         "unit_price": "2323457.07",
            //         "subtotal": "-76496."
            //       }
            //     ],
            //     "payments": [
            //       {
            //         "id": 0,
            //         "payment_method": "cash",
            //         "payment_type": "full",
            //         "amount": "-664680431",
            //         "status": "pending",
            //         "paid_at": "2026-06-20T04:36:33.562Z",
            //         "created_at": "2026-06-20T04:36:33.562Z"
            //       }
            //     ],
            //     "status_histories": [
            //       {
            //         "id": 0,
            //         "status": "pending",
            //         "label": "string",
            //         "old_status": "string",
            //         "new_status": "string",
            //         "note": "string",
            //         "changed_by_name": "string",
            //         "created_at": "2026-06-20T04:36:33.562Z"
            //       }
            //     ],
            //     "delivered_at": "2026-06-20T04:36:33.562Z",
            //     "completed_at": "2026-06-20T04:36:33.562Z",
            //     "created_at": "2026-06-20T04:36:33.562Z",
            //     "updated_at": "2026-06-20T04:36:33.562Z"
            //   }

    create: (dealer_slug, data) => axiosClient.post(`/storefronts/${dealer_slug}/orders/`, data).then((res) => res.data),

    // {
    //     "items": [
    //       {
    //         "dealer_product_id": 1,
    //         "quantity": 2
    //       }
    //     ],
    //     "customer_address_id": 1, Nguồn: addresses[].id (address của buyer)
    //     "delivery_date": "2026-06-20", Nguồn: dates[].date từ delivery-slots
    //     "delivery_slot": "morning", Nguồn: dates[].slots[].id (morning / afternoon)
    //     "note": "Giao buổi sáng"
    //   }
    //Phí ship cố định 10.000 VND, thanh toán COD. Trừ tồn ngay. Trạng thái ban đầu: pending.

    confirmReceived: (dealer_slug, id) =>
        axiosClient.post(`/storefronts/${dealer_slug}/orders/${id}/confirm-received/`).then((res) => res.data),

    // Buyer xác nhận: shipping → delivered (Nhận hàng) hoặc delivered → completed (Hoàn thành).

    //Khung giờ giao hàng
    
    getDelivery: (dealer_slug) => axiosClient.get(`/storefronts/${dealer_slug}/delivery-slots/`).then((res) => res.data),
    //Trả danh sách ngày (2 ngày: hôm nay và ngày mai) và slot Sáng/Chiều. FE không tự tính — chỉ render slot available=true và gửi lại delivery_date+delivery_slot hoặc delivery_time khi đặt hàng.
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    const data = error.response?.data;
    const message =
        data?.message ||
        data?.detail ||
        (typeof data === "string" ? data : null) ||
        error.message ||
        defaultMessage;
    console.error("API Error:", error);
    return message;
};
