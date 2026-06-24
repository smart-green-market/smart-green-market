import axiosClient from "../axiosClient";

export const interactionService = {
    interaction: async (dealer_slug, { dealer_product_id, action }) => {
        const res = await axiosClient.post(
            `/storefronts/${dealer_slug}/interactions/`,
            {
                dealer_product_id: Number(dealer_product_id),
                action,
            },
        );
        return res.data;
    },

    // Buyer ghi nhận view (+2 điểm, debounce 5 phút/SP) hoặc add_cart (+3 điểm, tối đa 1 lần/SP).
    // purchase (+5) tự ghi khi POST .../orders/ thành công.
    // engagement_score = view_count×2 + add_cart_count×3 + purchase_count×5

    // Body:
    // { "dealer_product_id": 12, "action": "view" | "add_cart" }
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    const message =
        error.response?.data?.message || error.message || defaultMessage;
    console.error("API Error:", error);
    return message;
};
