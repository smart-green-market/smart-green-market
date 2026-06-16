import axiosClient from "./axiosClient";
import { accountDocumentService } from "./accountDocumentService";
import { extractApiError } from "../../utils/extractApiError";



export const dealerService = {
  getAll: () =>
    axiosClient
      .get("/dealers/")
      .then((res) => res.data.results ?? res.data.result ?? []),
  // "results": [
  //       {
  //         "id": 0,
  //         "account": {
  //           "id": 0,
  //           "username": "",
  //           "email": "user@example.com",
  //           "first_name": "string",
  //           "last_name": "string",
  //           "full_name": "string",
  //           "phone": "string",
  //           "avatar_url": "string",
  //           "role": "admin",
  //           "status": "active",
  //           "created_at": "2026-06-11T03:15:03.329Z",
  //           "updated_at": "2026-06-11T03:15:03.329Z"
  //         },
  //         "store_name": "string",
  //         "store_address": "string",
  //         "description": "string",
  //         "status": "pending",
  //         "verified_by": 0,
  //         "verified_by_username": "string",
  //         "verified_at": "2026-06-11T03:15:03.329Z",
  //         "rejection_reason": "string",
  //         "created_at": "2026-06-11T03:15:03.329Z",
  //         "updated_at": "2026-06-11T03:15:03.329Z"
  //       }
  //     ]
  getById: (id) => axiosClient.get(`/dealers/${id}/`).then((res) => res.data),
  
  create: (data) =>
    axiosClient
      .post("/dealers/", data)
      .then((res) => res.data.data ?? res.data),


  //NTD lấy url cửa hàng đại lý
  getStorefrontLink: () =>
    axiosClient.get("/dealers/me/storefront-link/").then((res) => res.data),

  update: (id, data) =>
    axiosClient.patch(`/dealers/${id}/`, data).then((res) => res.data),

  // {
  //   "store_name": "string",
  //   "store_address": "string",
  //   "description": "string"
  // }

  completeRegistration: async (profile, files) => {
    const payload = {
      store_name: profile.store_name,
      store_address: profile.store_address,
      description: profile.description,
    };

    let dealers = await dealerService.getAll();
    let dealerProfile = dealers?.[0];

    if (dealerProfile?.id) {
      await dealerService.update(dealerProfile.id, payload);
    } else {
      try {
        const created = await dealerService.create(payload);
        const id = created?.id;
        if (!id) {
          throw new Error("Không thể tạo hồ sơ đại lý.");
        }
      } catch (createErr) {
        dealers = await dealerService.getAll();
        dealerProfile = dealers?.[0];
        if (dealerProfile?.id) {
          await dealerService.update(dealerProfile.id, payload);
        } else {
          throw createErr;
        }
      }
    }

    return accountDocumentService.upload(files);
  },
  //   "id": 0,
  //   "account": {
  //     "id": 0,
  //     "username": "wk0027_ClHf0keADloD7Vu6vo3AYgM_kNWHUGeLdyElT2tZvALD-BTsu",
  //     "email": "user@example.com",
  //     "first_name": "string",
  //     "last_name": "string",
  //     "full_name": "string",
  //     "phone": "string",
  //     "avatar_url": "string",
  //     "role": "admin",
  //     "status": "active",
  //     "created_at": "2026-06-11T03:15:47.393Z",
  //     "updated_at": "2026-06-11T03:15:47.393Z"
  //   },
  //   "store_name": "string",
  //   "store_address": "string",
  //   "description": "string",
  //   "status": "pending",
  //   "verified_by": 0,
  //   "verified_by_username": "string",
  //   "verified_at": "2026-06-11T03:15:47.393Z",
  //   "rejection_reason": "string",
  //   "created_at": "2026-06-11T03:15:47.393Z",
  //   "updated_at": "2026-06-11T03:15:47.393Z",
  //   "documents": [
  //     {
  //       "id": 0,
  //       "document_type": "business_license",
  //       "document_type_label": "string",
  //       "file_url": "string",
  //       "status": "pending",
  //       "verified_by": 0,
  //       "verified_by_username": "string",
  //       "verified_at": "2026-06-11T03:15:47.393Z",
  //       "created_at": "2026-06-11T03:15:47.393Z"
  //     }
  //   ],
  //   "products": [ ... ]
  // }

  // Khóa / mở khóa tài khoản đại lý (account.status)
  statusUpdate: (id, data) =>
    axiosClient
      .post(`/dealers/${id}/account-status/`, data)
      .then((res) => res.data),
  // { "status": "active | inactive | banned", "reason": "string" }

  // Duyệt / từ chối hồ sơ đại lý (dealer.status)
  verify: (id, data) =>
    axiosClient.post(`/dealers/${id}/verify/`, data).then((res) => res.data),
  // { "status": "active | rejected", "rejection_reason": "string" }
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  console.error("API Error:", error);
  return extractApiError(error, defaultMessage);
};
