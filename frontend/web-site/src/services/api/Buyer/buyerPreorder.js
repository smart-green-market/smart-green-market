import axiosClient from "../axiosClient";

export const buyerPreorder = {
  checkStock: (dealerSlug, items) =>
    axiosClient
      .post(`/storefronts/${dealerSlug}/check-stock/`, { items })
      .then((res) => res.data),

  getAll: (dealerSlug, params = {}) =>
    axiosClient
      .get(`/storefronts/${dealerSlug}/preorder-requests/`, { params })
      .then((res) => res.data),

  getById: (dealerSlug, id) =>
    axiosClient
      .get(`/storefronts/${dealerSlug}/preorder-requests/${id}/`)
      .then((res) => res.data),

  create: (dealerSlug, data) =>
    axiosClient
      .post(`/storefronts/${dealerSlug}/preorder-requests/`, data)
      .then((res) => res.data),

  accept: (dealerSlug, id) =>
    axiosClient
      .post(`/storefronts/${dealerSlug}/preorder-requests/${id}/accept/`)
      .then((res) => res.data),

  reject: (dealerSlug, id, data) =>
    axiosClient
      .post(`/storefronts/${dealerSlug}/preorder-requests/${id}/reject/`, data)
      .then((res) => res.data),
};

export { handleApiError } from "./buyerOrder";
