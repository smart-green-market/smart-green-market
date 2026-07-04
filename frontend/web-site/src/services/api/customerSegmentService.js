import axiosClient from "./axiosClient";

export const customerSegmentService = {
  getAll: (params) =>
    axiosClient.get("/customer-segments/", { params }).then((res) => res.data),
};
