import axiosClient from "../axiosClient";
import { extractApiError } from "../../../utils/extractApiError";

export const buyerProfileService = {
  getProfile: (dealer_slug) =>
    axiosClient.get(`/storefronts/${dealer_slug}/me/`).then((res) => res.data),

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
    axiosClient
      .patch(`/storefronts/${dealer_slug}/me/`, data)
      .then((res) => res.data),

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
  console.error("API Error:", error);
  return extractApiError(error, defaultMessage);
};
