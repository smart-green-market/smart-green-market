import axiosClient from "../axiosClient";
import { parseProductList } from "../../../utils/userProductUtils";

export const buyerProductService = {
  getBestSeller: (dealer_slug, params = {}) =>
    axiosClient
      .get(`/storefronts/${dealer_slug}/products/bestsellers/`, { params })
      .then((res) => parseProductList(res.data)),

  // in dealer_slug: string
  //schema
  // [
  //     {
  //       "id": 0,
  //       "title": "string",
  //       "description": "string",
  //       "retail_price": "-51162989",
  //       "thumbnail": "string",
  //       "category": {
  //         "id": 0,
  //         "name": "string",
  //         "sort_order": 2147483647
  //       },
  //       "unit": "string",
  //       "available_quantity": 0,
  //       "in_stock": true,
  //       "created_at": "2026-06-26T11:13:50.308Z",
  //       "updated_at": "2026-06-26T11:13:50.308Z",
  //       "images": [
  //         {
  //           "id": 0,
  //           "dealer_product": 0,
  //           "image_url": "string",
  //           "is_thumbnail": true,
  //           "sort_order": 2147483647,
  //           "created_at": "2026-06-26T11:13:50.308Z"
  //         }
  //       ],
  //       "total_sold": 0
  //     }
  //   ]

  getRelated: (dealer_slug, id, params = {}) =>
    axiosClient
      .get(`/storefronts/${dealer_slug}/products/${id}/related/`, { params })
      .then((res) => parseProductList(res.data)),
  //Buyer xem danh sách sản phẩm gợi ý liên quan của một SP trên gian hàng. Ưu tiên related_product_ids đã cấu hình; nếu chưa có thì fallback các SP cùng danh mục. Chỉ trả sản phẩm active. Không cần đăng nhập.

  // in dealer_slug: string, product_id: int, limit: Số sản phẩm trả về (mặc định 10, tối đa 20)
  //schema
  // [
  //     {
  //       "id": 0,
  //       "title": "string",
  //       "description": "string",
  //       "retail_price": "-93325.",
  //       "effective_price": "string",
  //       "discount_amount": "string",
  //       "discount_percent": "string",
  //       "has_age_discount": "string",
  //       "nearest_expiry_date": "string",
  //       "age_discount_reason": "string",
  //       "thumbnail": "string",
  //       "category": {
  //         "id": 0,
  //         "name": "string",
  //         "sort_order": 2147483647
  //       },
  //       "unit": "string",
  //       "available_quantity": 0,
  //       "in_stock": true,
  //       "created_at": "2026-07-04T14:53:11.559Z",
  //       "updated_at": "2026-07-04T14:53:11.559Z",
  //       "images": [
  //         {
  //           "id": 0,
  //           "dealer_product": 0,
  //           "image_url": "string",
  //           "is_thumbnail": true,
  //           "sort_order": 2147483647,
  //           "created_at": "2026-07-04T14:53:11.559Z"
  //         }
  //       ]
  //     }
  //   ]
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
