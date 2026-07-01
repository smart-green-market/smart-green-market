import axiosClient from "../axiosClient";
import { normalizeListResponse } from "../../../utils/adminDashboardUtils";

export const seasonService = {
    getAll: async () => {
        const res = await axiosClient.get("/seasons/");
        return normalizeListResponse(res.data);
    },
    // Admin: mọi trạng thái. User khác: chỉ mùa active.

    //Schema:
    // {
    //     "count": 123,
    //     "next": "http://api.example.org/accounts/?page=4",
    //     "previous": "http://api.example.org/accounts/?page=2",
    //     "results": [
    //       {
    //         "count": 0,
    //         "next": "string",
    //         "previous": "string",
    //         "page": 0,
    //         "page_size": 0,
    //         "has_more": true,
    //         "count_status": {
    //           "additionalProp1": 0,
    //           "additionalProp2": 0,
    //           "additionalProp3": 0
    //         },
    //         "results": [
    //           {
    //             "id": 0,
    //             "code": "5aRCxZZJK_4xBQT",
    //             "name": "string",
    //             "description": "string",
    //             "start_month": 32767,
    //             "end_month": 32767,
    //             "sort_order": 2147483647,
    //             "status": "active"
    //           }
    //         ]
    //       }
    //     ]
    //   }

    getById: async (id) => {
        const res = await axiosClient.get(`/seasons/${id}/`);
        return res.data;
      },
    
    //   Schema
    // {
    //     "id": 0,
    //     "code": "4vH0-pSUcDJDFBwdAN6fr6tO4SFVOoJF-HPv-oAzlJw",
    //     "name": "string",
    //     "description": "string",
    //     "start_month": 32767,
    //     "end_month": 32767,
    //     "sort_order": 2147483647,
    //     "status": "active"
    //   }
    
      create: async (formData) => {
        const res = await axiosClient.post("/seasons/", formData);
        return res.data;
      },
    
      // Shema
    //   {
    //     "code": "UOzicOYEPDlVlxXThsF_XwK-xTQhfoZ2xcrPF01gqeTU8n-4Hm",
    //     "name": "string",
    //     "description": "string",
    //     "start_month": 32767,
    //     "end_month": 32767,
    //     "sort_order": 2147483647,
    //     "status": "active"
    //   }
    
      update: async (id, payload) => {
        const res = await axiosClient.patch(`/seasons/${id}/`, payload);
        return res.data;
      },
    
      //Schema
    //   {
    //     "code": "W3Ysz-uKQJfm_MvhUnGwZmnb5chX7Nu",
    //     "name": "string",
    //     "description": "string",
    //     "start_month": 32767,
    //     "end_month": 32767,
    //     "sort_order": 2147483647,
    //     "status": "active"
    //   }
    
      remove: (id) => {
        return axiosClient.delete(`/seasons/${id}/`).then((res) => res.data);
      },
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    const message =
        error.response?.data?.message || error.message || defaultMessage;
    console.error("API Error:", error);
    return message;
};
