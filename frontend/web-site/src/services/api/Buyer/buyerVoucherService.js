import axiosClient from "../axiosClient";

export const buyerVoucherService = {
  getAll: (params = {}) =>
    axiosClient.get(`/vouchers/available/`, { params }).then((res) => res.data),
  //Lấy danh sách các voucher đang hoạt động cho cửa hàng checkout.

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
