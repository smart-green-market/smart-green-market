import axiosClient from "../axiosClient";

export const dashBoardSupplierService = {
    
    getRevenueChart: async () => {
    const res = await axiosClient.get("/dashboard/supplier/revenue-chart/");
    return res.data;
    },
    getTopProducts : async () => {
        const res = await axiosClient.get("/dashboard/supplier/top-products/");
        return res.data;
    },
    getTotalProducts : async () => {
        const res = await axiosClient.get("/supplier-products/");
        return res.data.count;
    },

};