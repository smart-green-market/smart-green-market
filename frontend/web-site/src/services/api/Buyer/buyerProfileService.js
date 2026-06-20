import axiosClient from "../axiosClient";

export const buyerProfileService = {
    getProfile: (dealer_slug) =>
        axiosClient
            .get(`/storefronts/${dealer_slug}/me/`)
            .then((res) => res.data),

    // in dealer_slug: string
    // {
    //     "id": 0,
    //     "user": {
    //       "id": 0,
    //       "username": "EyOK63aUjPUjhqmRMA+FG1b3u1uUkE.oAuuQOYHBG+TKF@.v90-OdRsa0isun",
    //       "email": "user@example.com",
    //       "full_name": "string",
    //       "phone": "string",
    //       "avatar_url": "string",
    //       "role": "admin",
    //       "status": "active",
    //       "store_dealer_id": 0,
    //       "store_dealer_slug": "jrFq6bWqvn9q"
    //     },
    //     "favorite_category": 0,
    //     "total_orders": 0,
    //     "total_spent": "164883618.93",
    //     "loyalty_points": 0,
    //     "last_order_at": "2026-06-17T02:55:33.367Z",
    //     "note": "string",
    //     "created_at": "2026-06-17T02:55:33.367Z",
    //     "updated_at": "2026-06-17T02:55:33.367Z"
    //   }
    
    updateProfile: (dealer_slug, data) =>
        axiosClient.put(`/storefronts/${dealer_slug}/me/`, data).then((res) => res.data),

    uploadAvatar: (dealer_slug, file, form = null) => {
        const formData = new FormData();
        formData.append("avatar", file);

        if (form) {
            if (form.full_name?.trim()) formData.append("full_name", form.full_name.trim());
            if (form.phone?.trim()) formData.append("phone", form.phone.trim());
            if (form.note != null) formData.append("note", form.note.trim());
            if (form.favorite_category !== "" && form.favorite_category != null) {
                formData.append("favorite_category", String(form.favorite_category));
            }
        }

        return axiosClient
            .put(`/storefronts/${dealer_slug}/me/`, formData)
            .then((res) => res.data);
    },

    // in dealer_slug: string
    // data{
    //     "id": 0,
    //     "user": {
    //       "id": 0,
    //       "username": "xX2Awm_FrkE_3oKaB2R7vK6AK@B4aw@z.GBW9gipA@",
    //       "email": "user@example.com",
    //       "full_name": "string",
    //       "phone": "string",
    //       "avatar_url": "string",
    //       "role": "admin",
    //       "status": "active",
    //       "store_dealer_id": 0,
    //       "store_dealer_slug": "A5Cz"
    //     },
    //     "favorite_category": 0,
    //     "total_orders": 0,
    //     "total_spent": "",
    //     "loyalty_points": 0,
    //     "last_order_at": "2026-06-17T03:04:18.216Z",
    //     "note": "string",
    //     "created_at": "2026-06-17T03:04:18.216Z",
    //     "updated_at": "2026-06-17T03:04:18.216Z"
    //   }
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    const message =
        error.response?.data?.message || error.message || defaultMessage;
    console.error("API Error:", error);
    return message;
};
