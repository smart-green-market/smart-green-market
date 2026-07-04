import { supplierService } from "../suppilerService";
import {
    normalizeFinanceListResponse,
    normalizeFinanceOverview,
} from "../../../utils/supplierFinanceUtils";
import {
    getMockFinanceList,
    getMockFinanceOverview,
} from "./supplierFinanceMockData";

export const PAGE_SIZE = 5;

/** Bật mock khi backend chưa có API. Đặt false khi đã triển khai endpoint thật. */
const USE_MOCK = true;

async function fetchOverviewFromApi(params) {
    const data = await supplierService.getFinanceOverview(params);
    return normalizeFinanceOverview(data);
}

async function fetchListFromApi(params) {
    const data = await supplierService.getFinanceList({
        page_size: PAGE_SIZE,
        ...params,
    });
    return normalizeFinanceListResponse(data);
}

export const adminSupplierFinanceService = {
    getOverview: async (params = {}) => {
        if (USE_MOCK) {
            const data = await getMockFinanceOverview(params);
            return normalizeFinanceOverview(data);
        }
        return fetchOverviewFromApi(params);
    },

    getList: async (params = {}) => {
        if (USE_MOCK) {
            const data = await getMockFinanceList({
                page_size: PAGE_SIZE,
                ...params,
            });
            return normalizeFinanceListResponse(data);
        }
        return fetchListFromApi(params);
    },
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
