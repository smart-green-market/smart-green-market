import axiosClient from "./axiosClient";
import { extractApiError } from "../../utils/extractApiError";
import {
    MOCK_DEALER_PRODUCTS,
    getMockDealerProductById,
} from "../../mocks/dealerProductMockData";

function flattenDealerProductResults(data) {
    if (Array.isArray(data)) return data;

    const top = data?.results ?? data?.result ?? [];
    if (!Array.isArray(top)) return [];

    if (top.length && Array.isArray(top[0]?.results)) {
        return top.flatMap((page) => page.results ?? []);
    }

    return top;
}

function useMockFallback(error) {
    console.warn("[dealerProductService] Dùng mock data tạm:", error?.message ?? error);
    return MOCK_DEALER_PRODUCTS;
}

export const dealerProductService = {
    getAll: async () => {
        try {
            const res = await axiosClient.get("/dealer-products/");
            const list = flattenDealerProductResults(res.data);
            return list.length ? list : MOCK_DEALER_PRODUCTS;
        } catch (error) {
            return useMockFallback(error);
        }
    },
    // API
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
    //             "dealer_profile": 0,
    //             "supplier_product": 0,
    //             "category": {
    //               "id": 0,
    //               "name": "string",
    //               "status": "pending"
    //             },
    //             "supplier_product_name": "string",
    //             "supplier_product_unit": "string",
    //             "title": "string",
    //             "description": "string",
    //             "retail_price": "-762000",
    //             "thumbnail": "string",
    //             "status": "pending",
    //             "created_at": "2026-06-15T02:00:23.337Z",
    //             "updated_at": "2026-06-15T02:00:23.337Z",
    //             "images": [
    //               {
    //                 "id": 0,
    //                 "dealer_product": 0,
    //                 "image_url": "string",
    //                 "is_thumbnail": true,
    //                 "sort_order": 2147483647,
    //                 "created_at": "2026-06-15T02:00:23.337Z"
    //               }
    //             ],
    //             "dealer": {
    //               "id": 0,
    //               "store_name": "string",
    //               "store_address": "string",
    //               "status": "pending",
    //               "account_username": "string"
    //             }
    //           }
    //         ]
    //       }
    //     ]
    //   }
    getById: async (id) => {
        try {
            const res = await axiosClient.get(`/dealer-products/${id}/`);
            return res.data;
        } catch (error) {
            const mock = getMockDealerProductById(id);
            if (mock) {
                console.warn("[dealerProductService] getById fallback mock:", id);
                return mock;
            }
            throw error;
        }
    },
    update: async (id, data) => {
        try {
            const res = await axiosClient.patch(`/dealer-products/${id}/`, data);
            return res.data;
        } catch (error) {
            console.error("Lỗi cập nhật sản phẩm đại lý:", error);
            throw error;
        }
    },
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    console.error("API Error:", error);
    return extractApiError(error, defaultMessage);
};
