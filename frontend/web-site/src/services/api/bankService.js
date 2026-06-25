import axiosClient from "./axiosClient";

export const bankService = {
  getAll: () =>
    axiosClient.get("/banks/").then((res) => {
      const data = res.data;
      return data?.result ?? data?.results ?? data?.data ?? (Array.isArray(data) ? data : []);
    }),
};
