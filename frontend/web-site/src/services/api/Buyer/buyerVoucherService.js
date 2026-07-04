import axiosClient from "../axiosClient";

export const buyerVoucherService = {
  getVoucherAvailable: (params = {}) =>
    axiosClient.get(`/vouchers/available/`, { params }).then((res) => res.data),
  //Buyer xem voucher khả dụng mà Dealer tạo và Buyer truy cập để lấy voucher về để áp dụng vào đơn hàng.

  // {
  //     "count": 123,
  //     "next": "http://api.example.org/accounts/?page=4",
  //     "previous": "http://api.example.org/accounts/?page=2",
  //     "results": [
  //       {
  //         "id": 0,
  //         "code": "jFvtThTnrkALfutmPTc7K_gHOTkoajr0ZbDT1imyL_pY2b75U-",
  //         "title": "string",
  //         "description": "string",
  //         "discount_type": "percent",
  //         "discount_value": "6768738.49",
  //         "start_date": "2026-07-01T13:59:29.343Z",
  //         "end_date": "2026-07-01T13:59:29.343Z"
  //       }
  //     ]
  //   }

  saveVoucher: (id, data = {}) =>
    axiosClient.post(`/vouchers/${id}/save/`, data).then((res) => res.data),
  //Buyer lưu voucher vào tài khoản của mình.

  // {
  //     "title": "string",
  //     "code": "zUPMEznsdhY3W9QUYiSTJ0xXshWfpuWiWpYVssieUlY8eLOxyr",
  //     "description": "string",
  //     "discount_type": "percent",
  //     "discount_value": "-77154",
  //     "min_order_amount": "-9380662",
  //     "max_discount_amount": "-306.",
  //     "usage_limit": 2147483647,
  //     "usage_limit_per_customer": 2147483647,
  //     "start_date": "2026-07-02T08:18:02.612Z",
  //     "end_date": "2026-07-02T08:18:02.612Z",
  //     "targets": [
  //       {
  //         "target_type": "segment",
  //         "segment": 0
  //       }
  //     ]
  //   }

  unsaveVoucher: (id, params = {}) =>
    axiosClient
      .delete(`/vouchers/${id}/unsave/`, { params })
      .then((res) => res.data),
  //Buyer xóa voucher khỏi tài khoản của mình.

  getAll: (params = {}) =>
    axiosClient.get(`/vouchers/saved/`, { params }).then((res) => res.data),
  //Buyer xem danh sách voucher đã lưu vào tài khoản của mình.

  // {
  //     "count": 123,
  //     "next": "http://api.example.org/accounts/?page=4",
  //     "previous": "http://api.example.org/accounts/?page=2",
  //     "results": [
  //         {
  //         "id": 0,
  //         "code": "string",
  //         "title": "string",
  //         "description": "string",
  //         "discount_type": "string",
  //         "discount_value": "-716163",
  //         "min_order_amount": "6751654483",
  //         "max_discount_amount": "00.",
  //         "start_date": "2026-07-02T08:16:48.913Z",
  //         "end_date": "2026-07-02T08:16:48.913Z",
  //         "is_saved": "string",
  //         "saved_at": "2026-07-02T08:16:48.913Z"
  //         }
  //     ]
  //     }

  apply: (data) =>
    axiosClient.post(`/vouchers/apply/`, data).then((res) => {
      const payload = res.data;
      if (payload && typeof payload === "object" && payload.data != null) {
        return payload.data;
      }
      return payload;
    }),
  // Xác thực các điều kiện áp dụng voucher và trả về thông tin giảm giá.

  // Schema
  // {
  //     "voucher_code": "SALE50K",
  //     "items": [
  //       {
  //         "dealer_product_id": 45,
  //         "quantity": 3
  //       },
  //       {
  //         "dealer_product_id": 88,
  //         "quantity": 1
  //       }
  //     ]
  //   }

  // OUT
  // {
  //     "voucher": {
  //       "id": 0,
  //       "code": "string",
  //       "title": "string",
  //       "discount_type": "string",
  //       "discount_value": ".03",
  //       "min_order_amount": "523086925314"
  //     },
  //     "order_total": "6162",
  //     "discount_amount": "4",
  //     "final_total": "5476.2"
  //   }
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
