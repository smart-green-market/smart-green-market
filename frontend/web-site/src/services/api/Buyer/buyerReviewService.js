import axiosClient from "../axiosClient";

export const buyerReviewService = {
    
    // Đánh giá sản phẩm sau đơn completed. Prefix: /api/storefronts/{dealer_slug}/.
    // Buyer: pending-reviews → POST reviews (multipart) → PATCH/DELETE review. Public: GET products/{id}/reviews/ + summary.
    
    getAll: (dealer_slug) => axiosClient.get(`/storefronts/${dealer_slug}/reviews/`).then((res) => res.data),
    //Buyer đánh giá của tôi (danh sách)

    //in dealer_slug: string

    //Schema
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
    //         "dealer_product_id": 0,
    //         "product_title": "string",
    //         "order_id": 0,
    //         "order_code": "string",
    //         "customer_name": "string",
    //         "rating": 5,
    //         "comment": "string",
    //         "images": [
    //           {
    //             "id": 0,
    //             "image_url": "string",
    //             "created_at": "2026-06-23T12:42:13.935Z"
    //           }
    //         ],
    //         "is_mine": "string",
    //         "created_at": "2026-06-23T12:42:13.935Z",
    //         "updated_at": "2026-06-23T12:42:13.935Z"
    //       }
    //     ]
    //   }

    getById: (dealer_slug, id) => axiosClient.get(`/storefronts/${dealer_slug}/reviews/${id}/`).then((res) => res.data),
    //Buyer đánh giá của tôi (chi tiết)

    //in dealer_slug: string, id: int

    //Schema
    // {
    //     "id": 0,
    //     "dealer_product_id": 0,
    //     "product_title": "string",
    //     "order_id": 0,
    //     "order_code": "string",
    //     "customer_name": "string",
    //     "rating": 5,
    //     "comment": "string",
    //     "images": [
    //       {
    //         "id": 0,
    //         "image_url": "string",
    //         "created_at": "2026-06-23T12:43:57.773Z"
    //       }
    //     ],
    //     "is_mine": "string",
    //     "created_at": "2026-06-23T12:43:57.773Z",
    //     "updated_at": "2026-06-23T12:43:57.773Z"
    //   }

    pendingReview: (dealer_slug) => axiosClient.get(`/storefronts/${dealer_slug}/me/reviews/pending-reviews/`).then((res) => res.data),
    //Buyer sản phẩm chờ đánh giá (danh sách)

    //in dealer_slug: string

    //Schema
    // [
    //     {
    //       "order_id": 0,
    //       "order_code": "string",
    //       "dealer_product_id": 0,
    //       "product_title": "string",
    //       "completed_at": "2026-06-23T12:45:05.571Z"
    //     }
    //   ]

    create: (dealer_slug, data) => axiosClient.post(`/storefronts/${dealer_slug}/reviews/`, data).then((res) => res.data),
    //Buyer tạo review
    //in dealer_slug: string

    //body
    // {
    //     "order_id": 0, (Required)
    //     "dealer_product_id": 0, (Required)
    //     "rating": 5, (Required)
    //     "comment": "string",
    //     "images": [ -> có thể add thêm ảnh tối đa 5 ảnh (Add string item)
    //       {
    //         "image_url": "string"
    //       }
    //     ]
    //   }

    //schema
    // {
    //     "id": 0,
    //     "dealer_product_id": 0,
    //     "product_title": "string",
    //     "order_id": 0,
    //     "order_code": "string",
    //     "customer_name": "string",
    //     "rating": 5,
    //     "comment": "string",
    //     "images": [
    //       {
    //         "id": 0,
    //         "image_url": "string",
    //         "created_at": "2026-06-23T12:52:27.769Z"
    //       }
    //     ],
    //     "is_mine": "string",
    //     "created_at": "2026-06-23T12:52:27.769Z",
    //     "updated_at": "2026-06-23T12:52:27.769Z"
    //   }
    
    uploadImage: (dealer_slug, id, data) => axiosClient.post(`/storefronts/${dealer_slug}/reviews/${id}/images/`, data).then((res) => res.data),
    //Buyer tải lên ảnh review
    //in dealer_slug: string, id: int

    //body: images (array string)
    //schema:
    // [
    //     {
    //       "id": 0,
    //       "image_url": "string",
    //       "created_at": "2026-06-23T12:56:42.107Z"
    //     }
    //   ]

    update: (dealer_slug, id, data) => axiosClient.patch(`/storefronts/${dealer_slug}/reviews/${id}/`, data).then((res) => res.data),
    //Buyer sửa review
    //Chi tiết / sửa / xóa review của buyer.

    //in dealer_slug: string, id: int

    //body:
    // {
    //     "rating": 5,
    //     "comment": "string",
    //}

    //schema:
    // {
    //     "id": 0,
    //     "dealer_product_id": 0,
    //     "product_title": "string",
    //     "order_id": 0,
    //     "order_code": "string",
    //     "customer_name": "string",
    //     "rating": 5,
    //     "comment": "string",
    //     "images": [
    //       {
    //         "id": 0,
    //         "image_url": "string",
    //         "created_at": "2026-06-23T12:57:45.465Z"
    //       }
    //     ],
    //     "is_mine": "string",
    //     "created_at": "2026-06-23T12:57:45.465Z",
    //     "updated_at": "2026-06-23T12:57:45.465Z"
    //   }

    delete: (dealer_slug, id) => axiosClient.delete(`/storefronts/${dealer_slug}/reviews/${id}/`).then((res) => res.data),
    //Buyer xóa review
    //in dealer_slug: string, id: int

    deleteImage: (dealer_slug, id, image_id) => axiosClient.delete(`/storefronts/${dealer_slug}/reviews/${id}/images/${image_id}/`).then((res) => res.data),
    //Buyer xóa ảnh review
    //in dealer_slug: string, id: int, image_id: int

    // PUBLIC

    productReviews: (dealer_slug, product_id) => axiosClient.get(`/storefronts/${dealer_slug}/products/${product_id}/reviews/`).then((res) => res.data),
    // Review công khai trên trang chi tiết SP.
    // Phân trang (load more): ?page=1&page_size=20 (mặc định page=1, page_size=20, tối đa 100).

    //in dealer_slug: string, product_id: int

    //Schema
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
    //         "dealer_product_id": 0,
    //         "product_title": "string",
    //         "order_id": 0,
    //         "order_code": "string",
    //         "customer_name": "string",
    //         "rating": 5,
    //         "comment": "string",
    //         "images": [
    //           {
    //             "id": 0,
    //             "image_url": "string",
    //             "created_at": "2026-06-23T12:47:36.680Z"
    //           }
    //         ],
    //         "is_mine": "string",
    //         "created_at": "2026-06-23T12:47:36.680Z",
    //         "updated_at": "2026-06-23T12:47:36.680Z"
    //       }
    //     ]
    //   }

    productRating: (dealer_slug, product_id) => axiosClient.get(`/storefronts/${dealer_slug}/products/${product_id}/reviews/summary`).then((res) => res.data),
    //Tổng rating sản phẩm
    //Tổng hợp rating — hiển thị sao trung bình.

    //in dealer_slug: string, product_id: int

    //Schema
    // {
    //     "dealer_product_id": 0,
    //     "review_count": 0,
    //     "average_rating": 0,
    //     "rating_distribution": {
    //       "additionalProp1": 0,
    //       "additionalProp2": 0,
    //       "additionalProp3": 0
    //     }
    //   }
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    const message =
        error.response?.data?.message || error.message || defaultMessage;
    console.error("API Error:", error);
    return message;
};
