import axiosClient from "./axiosClient";

const dashboardService = {
  getSummary: () => {
    return axiosClient.get("/dashboard/dealer/summary/").then(res => res.data);
  },
  getRevenueChart: () => {
    return axiosClient.get("/dashboard/dealer/revenue-chart/").then(res => res.data);
  },
  getTopProducts: () => {
    return axiosClient.get("/dashboard/dealer/top-products/").then(res => res.data);
  },
  getPurchaseSummary: () => {
    return axiosClient.get("/dashboard/dealer/purchase-summary/").then(res => res.data);
  },
};

export default dashboardService;
