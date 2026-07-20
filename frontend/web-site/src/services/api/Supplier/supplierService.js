import axiosClient from "../axiosClient";

export const supplierService = {
  getDealers: (supplierId, params = {}) => {
    return axiosClient.get(`/suppliers/${supplierId}/dealers/`, { params }).then((res) => res.data);
  }
};

export default supplierService;
