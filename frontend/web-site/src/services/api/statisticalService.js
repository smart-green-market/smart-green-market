import axiosClient from "./axiosClient";

const statisticalService = {
  getDealerStats: (params) => {
    return axiosClient.get("/statistical/dealer/statistics/", { params }).then(res => res.data);
  }
};

export default statisticalService;
