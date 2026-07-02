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

  //schema
  // {
  //     "count": 0,
  //     "next": "string",
  //     "previous": "string",
  //     "page": 0,
  //     "page_size": 0,
  //     "has_more": true,
  //     "count_status": {
  //       "additionalProp1": 0,
  //       "additionalProp2": 0,
  //       "additionalProp3": 0
  //     },
  //     "results": [
  //       {
  //         "id": 0,
  //         "title": "string",
  //         "description": "string",
  //         "retail_price": "-199469566.46", --> Giá gốc
  //         "effective_price": "string", --> Giá sau giảm
  //         "discount_amount": "string", --> Số tiền được giảm
  //         "discount_percent": "string", --> Phần trăm giảm
  //         "has_age_discount": "string", --> Có đang giảm giá hay không
  //         "nearest_expiry_date": "string", --> Ngày hết hạn gần nhất
  //         "age_discount_reason": "string", --> Lý do giảm giá
  //         "thumbnail": "string",
  //         "category": {
  //           "id": 0,
  //           "name": "string",
  //           "sort_order": 2147483647
  //         },
  //         "unit": "string",
  //         "available_quantity": 0,
  //         "in_stock": true,
  //         "created_at": "2026-06-28T07:52:47.211Z",
  //         "updated_at": "2026-06-28T07:52:47.211Z",
  //         "images": [
  //           {
  //             "id": 0,
  //             "dealer_product": 0,
  //             "image_url": "string",
  //             "is_thumbnail": true,
  //             "sort_order": 2147483647,
  //             "created_at": "2026-06-28T07:52:47.211Z"
  //           }
  //         ]
  //       }
  //     ]
  //   }

  getProductById: (dealer_slug, product_id) =>
    axiosClient
      .get(`/storefronts/${dealer_slug}/products/${product_id}/`)
      .then((res) => res.data),

  getRelatedProducts: (dealer_slug, product_id, params = {}) =>
    axiosClient
      .get(`/storefronts/${dealer_slug}/products/${product_id}/related/`, { params })
      .then((res) => res.data ?? []),

  // in dealer_slug: string, product_id: number
  //Schema
  // {
  //     "id": 0,
  //     "title": "string",
  //     "description": "string",
  //         "retail_price": "-199469566.46", --> Giá gốc
  //         "effective_price": "string", --> Giá sau giảm
  //         "discount_amount": "string", --> Số tiền được giảm
  //         "discount_percent": "string", --> Phần trăm giảm
  //         "has_age_discount": "string", --> Có đang giảm giá hay không
  //         "nearest_expiry_date": "string", --> Ngày hết hạn gần nhất
  //         "age_discount_reason": "string", --> Lý do giảm giá
  //     "thumbnail": "string",
  //     "category": {
  //       "id": 0,
  //       "name": "string",
  //       "sort_order": 2147483647
  //     },
  //     "unit": "string",
  //     "available_quantity": 0,
  //     "in_stock": true,
  //     "created_at": "2026-06-28T09:06:56.638Z",
  //     "updated_at": "2026-06-28T09:06:56.638Z",
  //     "images": [
  //       {
  //         "id": 0,
  //         "dealer_product": 0,
  //         "image_url": "string",
  //         "is_thumbnail": true,
  //         "sort_order": 2147483647,
  //         "created_at": "2026-06-28T09:06:56.638Z"
  //       }
  //     ],
  //     "supplier_product_name": "string",
  //     "supplier_name": "string",
  //     "storage_duration_days": 0,
  //     "min_storage_temp": "-611",
  //     "max_storage_temp": "-0",
  //     "cultivation_processes": [
  //       {
  //         "id": 0,
  //         "step_order": 2147483647,
  //         "process_name": "string",
  //         "description": "string"
  //       }
  //     ]
  //   }
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
