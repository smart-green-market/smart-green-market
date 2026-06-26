import axiosClient from "../axiosClient";
import { parseProductList } from "../../../utils/userProductUtils";

export const buyerProductService = {
    getBestSeller: (dealer_slug, params = {}) =>
        axiosClient
            .get(`/storefronts/${dealer_slug}/products/bestsellers/`, { params })
            .then((res) => parseProductList(res.data)),

    // in dealer_slug: string
    //schema
    // [
    //     {
    //       "id": 0,
    //       "title": "string",
    //       "description": "string",
    //       "retail_price": "-51162989",
    //       "thumbnail": "string",
    //       "category": {
    //         "id": 0,
    //         "name": "string",
    //         "sort_order": 2147483647
    //       },
    //       "unit": "string",
    //       "available_quantity": 0,
    //       "in_stock": true,
    //       "created_at": "2026-06-26T11:13:50.308Z",
    //       "updated_at": "2026-06-26T11:13:50.308Z",
    //       "images": [
    //         {
    //           "id": 0,
    //           "dealer_product": 0,
    //           "image_url": "string",
    //           "is_thumbnail": true,
    //           "sort_order": 2147483647,
    //           "created_at": "2026-06-26T11:13:50.308Z"
    //         }
    //       ],
    //       "total_sold": 0
    //     }
    //   ]
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    const message =
        error.response?.data?.message || error.message || defaultMessage;
    console.error("API Error:", error);
    return message;
};
