import axiosClient from "../axiosClient";

export const dealerCustumerOrder = {
    getAll: () => axiosClient.get(`/customer-orders/`).then((res) => res.data),

    // {
    //     "count": 123,
    //     "next": "http://api.example.org/accounts/?page=4",
    //     "previous": "http://api.example.org/accounts/?page=2",
    //     "results": [
    //       {
    //         "count": 0,
    //         "next": "string",
    //         "previous": "string",
    //         "page": 0,
    //         "page_size": 0,
    //         "has_more": true,
    //         "results": [
    //           {
    //             "id": 0,
    //             "order_code": "string",
    //             "status": "pending",
    //             "dealer_name": "string",
    //             "customer_name": "string",
    //             "payment_method": "string",
    //             "subtotal_amount": "36985442332",
    //             "discount_amount": "-7100663070",
    //             "shipping_fee": "66",
    //             "total_amount": "-83",
    //             "item_count": 0,
    //             "delivery_time": "2026-06-20T04:44:46.316Z",
    //             "delivery_date": "string",
    //             "delivery_slot": "string",
    //             "delivery_slot_name": "string",
    //             "created_at": "2026-06-20T04:44:46.316Z"
    //           }
    //         ]
    //       }
    //     ]
    //   }

    getById: (id) => axiosClient.get(`/customer-orders/${id}/`).then((res) => res.data),

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
    //     "delivery_time": "2026-06-20T04:45:13.573Z",
    //     "delivery_date": "string",
    //     "delivery_slot": "string",
    //     "delivery_slot_name": "string",
    //     "note": "string",
    //     "shipping_address": "string",
    //     "subtotal_amount": "-696961",
    //     "discount_amount": "-9807831747",
    //     "shipping_fee": "-512473.38",
    //     "total_amount": ".",
    //     "paid_amount": "3056700870",
    //     "debt_amount": "-1470701520.0",
    //     "items": [
    //       {
    //         "id": 0,
    //         "dealer_product_id": 0,
    //         "product_name": "string",
    //         "product_unit": "string",
    //         "product_thumbnail_url": "string",
    //         "quantity": 2147483647,
    //         "unit_price": "-2119",
    //         "subtotal": "-.7"
    //       }
    //     ],
    //     "payments": [
    //       {
    //         "id": 0,
    //         "payment_method": "cash",
    //         "payment_type": "full",
    //         "amount": "-1.56",
    //         "status": "pending",
    //         "paid_at": "2026-06-20T04:45:13.573Z",
    //         "created_at": "2026-06-20T04:45:13.573Z"
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
    //         "created_at": "2026-06-20T04:45:13.573Z"
    //       }
    //     ],
    //     "delivered_at": "2026-06-20T04:45:13.573Z",
    //     "completed_at": "2026-06-20T04:45:13.573Z",
    //     "created_at": "2026-06-20T04:45:13.573Z",
    //     "updated_at": "2026-06-20T04:45:13.573Z"
    //   }

    Confirmed: (id) => axiosClient.post(`/customer-orders/${id}/confirm/`, data).then((res) => res.data),

    //Chuyển pending → confirmed.

    Processing: (id) => axiosClient.post(`/customer-orders/${id}/start-processing/`, data).then((res) => res.data),

    //Chuyển processing → shipping.

    Shipping: (id) => axiosClient.post(`/customer-orders/${id}/ship/`, data).then((res) => res.data),

    //Chuyển processing → shipping.

};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    const message =
        error.response?.data?.message || error.message || defaultMessage;
    console.error("API Error:", error);
    return message;
};
