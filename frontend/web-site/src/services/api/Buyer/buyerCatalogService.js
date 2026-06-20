import axiosClient from "../axiosClient";

export const buyerCatalogService = {
    getCategory: (dealer_slug) =>
        axiosClient
            .get(`/storefronts/${dealer_slug}/categories/`)
            .then((res) => res.data?.results ?? []),

    // in dealer_slug: string
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
    //         "name": "string",
    //         "description": "string",
    //         "scope": "system",
    //         "status": "pending",
    //         "sort_order": 2147483647,
    //         "verified_by": 0,
    //         "verified_by_username": "string",
    //         "verified_at": "2026-06-17T02:56:06.242Z",
    //         "rejection_reason": "string",
    //         "created_at": "2026-06-17T02:56:06.242Z",
    //         "updated_at": "2026-06-17T02:56:06.242Z",
    //         "product_count": 0
    //       }
    //     ]
    //   }

    getProducts: (dealer_slug, params = {}) =>
        axiosClient
            .get(`/storefronts/${dealer_slug}/products/`, { params })
            .then((res) => res.data),

    getProduct: (dealer_slug, params = {}) =>
        buyerCatalogService
            .getProducts(dealer_slug, params)
            .then((data) => data?.results ?? []),

    // in dealer_slug: string
    //sortBy: category, ordering (price, name, updated_at, stock (mặc định: updated_at))
    //search: string ( tên SP, mô tả, tên NCC gốc, tên danh mục)
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
    //         "title": "string",
    //         "description": "string",
    //         "retail_price": "39983.8",
    //         "thumbnail": "string",
    //         "category": {
    //           "id": 0,
    //           "name": "string",
    //           "sort_order": 2147483647
    //         },
    //         "unit": "string",
    //         "available_quantity": 0,
    //         "in_stock": true,
    //         "created_at": "2026-06-17T02:56:51.428Z",
    //         "updated_at": "2026-06-17T02:56:51.428Z",
    //         "images": [
    //           {
    //             "id": 0,
    //             "dealer_product": 0,
    //             "image_url": "string",
    //             "is_thumbnail": true,
    //             "sort_order": 2147483647,
    //             "created_at": "2026-06-17T02:56:51.428Z"
    //           }
    //         ]
    //       }
    //     ]
    //   }

    getProductById: (dealer_slug, product_id) =>
        axiosClient
            .get(`/storefronts/${dealer_slug}/products/${product_id}/`)
            .then((res) => res.data),

    // in dealer_slug: string, product_id: number
    // {
    //     "id": 0,
    //     "title": "string",
    //     "description": "string",
    //     "retail_price": "09639077",
    //     "thumbnail": "string",
    //     "category": {
    //       "id": 0,
    //       "name": "string",
    //       "sort_order": 2147483647
    //     },
    //     "unit": "string",
    //     "available_quantity": 0,
    //     "in_stock": true,
    //     "created_at": "2026-06-17T02:58:13.529Z",
    //     "updated_at": "2026-06-17T02:58:13.529Z",
    //     "images": [
    //       {
    //         "id": 0,
    //         "dealer_product": 0,
    //         "image_url": "string",
    //         "is_thumbnail": true,
    //         "sort_order": 2147483647,
    //         "created_at": "2026-06-17T02:58:13.529Z"
    //       }
    //     ],
    //     "supplier_product_name": "string",
    //     "supplier_name": "string",
    //     "storage_duration_days": 0,
    //     "min_storage_temp": "",
    //     "max_storage_temp": "-51"
    //   }
    
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    const message =
        error.response?.data?.message || error.message || defaultMessage;
    console.error("API Error:", error);
    return message;
};
