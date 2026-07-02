import axiosClient from "../axiosClient";
import { normalizeListResponse } from "../../../utils/adminDashboardUtils";

export const adminVoucherService = {
    getAll: async () => {
        const res = await axiosClient.get("/vouchers/");
        return normalizeListResponse(res.data);
    },
    // Admin xem tất cả. Dealer chỉ thấy voucher của mình.
    // Phân trang (load more): ?page=1&page_size=20 (mặc định page=1, page_size=20, tối đa 100).

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
    //             "dealer": 0,
    //             "created_by": 0,
    //             "title": "string",
    //             "code": "mp5I99eehRu-jB",
    //             "description": "string",
    //             "discount_type": "percent",
    //             "discount_value": "016389940.81",
    //             "min_order_amount": "-1933749.48",
    //             "max_discount_amount": "-635.",
    //             "usage_limit": 2147483647,
    //             "usage_limit_per_customer": 2147483647,
    //             "start_date": "2026-07-02T02:16:03.405Z",
    //             "end_date": "2026-07-02T02:16:03.405Z",
    //             "status": "draft",
    //             "reject_reason": "string",
    //             "targets": [
    //               {
    //                 "id": 0,
    //                 "target_type": "segment",
    //                 "segment": 0
    //               }
    //             ],
    //             "created_at": "2026-07-02T02:16:03.405Z",
    //             "updated_at": "2026-07-02T02:16:03.405Z"
    //           }
    //         ]
    //       }
    //     ]
    //   }

    getById: async (id) => {
        const res = await axiosClient.get(`/vouchers/${id}/`);
        return res.data;
      },
    
    //   Schema
    // {
    //     "id": 0,
    //     "dealer": 0,
    //     "created_by": 0,
    //     "title": "string",
    //     "code": "BPU7D-pMPYDZJaOdpPvfij2vbkNlYEFkO8nC71QW6xnRz",
    //     "description": "string",
    //     "discount_type": "percent",
    //     "discount_value": "-53",
    //     "min_order_amount": "174205.88",
    //     "max_discount_amount": "5562243108",
    //     "usage_limit": 2147483647,
    //     "usage_limit_per_customer": 2147483647,
    //     "start_date": "2026-07-02T02:17:02.958Z",
    //     "end_date": "2026-07-02T02:17:02.958Z",
    //     "status": "draft",
    //     "reject_reason": "string",
    //     "targets": [
    //       {
    //         "id": 0,
    //         "target_type": "segment",
    //         "segment": 0
    //       }
    //     ],
    //     "created_at": "2026-07-02T02:17:02.958Z",
    //     "updated_at": "2026-07-02T02:17:02.958Z"
    //   }
    
    verify: (id, data) =>
        axiosClient.post(`/vouchers/${id}/verify/`, data).then((res) => res.data),
    //rejected bắt buộc reject_reason

    //Schema:
      // {
      //   "status": "active / rejected",
      //   "rejection_reason": "string"
      // }

      delete: (id, params = {}) => axiosClient.delete(`/vouchers/${id}/`, { params }).then((res) => res.data),
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
    const data = error.response?.data;
    const message =
        data?.message ||
        data?.detail ||
        (typeof data === "string" ? data : null) ||
        error.message ||
        defaultMessage;
    console.error("API Error:", error);
    return message;
};
