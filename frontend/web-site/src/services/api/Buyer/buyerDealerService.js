import axiosClient from "../axiosClient";

export const buyerDealerService = {
    getDealer: (dealer_slug) =>
        axiosClient
            .get(`/storefronts/${dealer_slug}/`)
            .then((res) => res.data),

    // in dealer_slug: string

    //schema
    // {
    //     "id": 0,
    //     "store_name": "string",
    //     "slug": "xp_uByL7NJJbM-DhLAZsVZDosGO8ZdWQinUQSyOPf4dE7v1dpSB3OzLkUl1XMWngPmuoaHBFsYQrGZMD33TnteqanaNXdtkwZS3E1",
    //     "store_address": "string",
    //     "logo_url": "string",
    //     "description": "string",
    //     "created_at": "2026-06-26T11:09:16.542Z",
    //     "verified_at": "2026-06-26T11:09:16.542Z",
    //     "is_platform_verified": true,
    //     "verification_badges": [
    //       "string"
    //     ],
    //     "contact": {
    //       "full_name": "string",
    //       "phone": "string",
    //       "email": "user@example.com",
    //       "avatar_url": "string"
    //     },
    //     "storefront_path": "string",
    //     "storefront_url": "string",
    //     "stats": {
    //       "active_product_count": 0,
    //       "category_count": 0,
    //       "customer_count": 0,
    //       "completed_order_count": 0,
    //       "total_sold": 0
    //     },
    //     "review_summary": {
    //       "review_count": 0,
    //       "average_rating": 0,
    //       "rating_distribution": {
    //         "additionalProp1": 0,
    //         "additionalProp2": 0,
    //         "additionalProp3": 0
    //       }
    //     },
    //     "delivery_policy": {
    //       "timezone": "string",
    //       "min_lead_hours": 0,
    //       "morning_cutoff_hour": 0,
    //       "max_booking_days": 0,
    //       "shipping_fee": 0,
    //       "min_order_amount": 0,
    //       "slots": [
    //         "string"
    //       ]
    //     }
    //   }
    
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    const message =
        error.response?.data?.message || error.message || defaultMessage;
    console.error("API Error:", error);
    return message;
};
