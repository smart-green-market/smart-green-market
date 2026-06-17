import axiosClient from "../axiosClient";

export const buyerAddressService = {
    getAll: (dealer_slug) =>
        axiosClient
            .get(`/storefronts/${dealer_slug}/addresses/`)
            .then((res) => res.data),

    getById: (dealer_slug, id) =>
        axiosClient
            .get(`/storefronts/${dealer_slug}/addresses/${id}/`)
            .then((res) => res.data),

    create: (dealer_slug, data) =>
        axiosClient
            .post(`/storefronts/${dealer_slug}/addresses/`, data)
            .then((res) => res.data),

    update: (dealer_slug, id, data) =>
        axiosClient
            .put(`/storefronts/${dealer_slug}/addresses/${id}/`, data)
            .then((res) => res.data),

    delete: (dealer_slug, id) =>
        axiosClient
            .delete(`/storefronts/${dealer_slug}/addresses/${id}/`)
            .then((res) => res.data),
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    const message =
        error.response?.data?.message || error.message || defaultMessage;
    console.error("API Error:", error);
    return message;
};
