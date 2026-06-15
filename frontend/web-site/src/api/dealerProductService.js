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
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    console.error("API Error:", error);
    return extractApiError(error, defaultMessage);
};
