import axiosClient from "./axiosClient";
import { accountDocumentService } from "./accountDocumentService";
import { extractApiError } from "../../utils/extractApiError";

const DEALER_PROFILE_ID_KEY = "dealer_profile_id";

function persistProfileId(id) {
  if (id != null) {
    localStorage.setItem(DEALER_PROFILE_ID_KEY, String(id));
  }
}

function readCachedProfileId() {
  return localStorage.getItem(DEALER_PROFILE_ID_KEY);
}

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

  // --- DEALER (đăng ký / tự quản lý hồ sơ)
  getMine: () => axiosClient.get("/dealers/me/").then((res) => res.data),

  create: (data) =>
    axiosClient
      .post("/dealers/", data)
      .then((res) => res.data.data ?? res.data),

  resolveMyProfile: async () => {
    try {
      const profile = await axiosClient
        .get("/dealers/me/")
        .then((res) => res.data);
      if (profile?.id) {
        persistProfileId(profile.id);
        return profile;
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        throw err;
      }
    }

    const cachedId = readCachedProfileId();
    if (cachedId) {
      try {
        const profile = await axiosClient
          .get(`/dealers/${cachedId}/`)
          .then((res) => res.data);
        if (profile?.id) {
          return profile;
        }
      } catch (err) {
        if (err.response?.status === 404) {
          localStorage.removeItem(DEALER_PROFILE_ID_KEY);
        } else {
          throw err;
        }
      }
    }

    return null;
  },

  update: (id, data) =>
    axiosClient.put(`/dealers/${id}/`, data).then((res) => res.data),

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

    let dealerProfile = await dealerService.resolveMyProfile();

    if (dealerProfile?.id) {
      await dealerService.update(dealerProfile.id, payload);
      persistProfileId(dealerProfile.id);
    } else {
      try {
        const created = await dealerService.create(payload);
        const id = created?.id;
        if (!id) {
          throw new Error("Không thể tạo hồ sơ đại lý.");
        }
        persistProfileId(id);
      } catch (createErr) {
        dealerProfile = await dealerService.resolveMyProfile();
        if (dealerProfile?.id) {
          await dealerService.update(dealerProfile.id, payload);
          persistProfileId(dealerProfile.id);
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
