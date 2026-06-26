import axiosClient from "./axiosClient";

export const settingService = {
  // GET /system-config/ trả về object phẳng (không bọc trong "results")
  get: () => axiosClient.get("/system-config/").then((res) => res.data),

  // {
  //   "max_upload_image_size_mb": 0,
  //   "allowed_image_types": [
  //     "string"
  //   ],
  //   "max_categories_per_supplier": 0,
  //   "max_products_per_supplier": 0,
  //   "max_images_per_product": 0,
  //   "max_images_per_certification": 0,
  //   "max_login_attempts": 0,
  //   "login_lockout_minutes": 0,
  //   "min_order_amount": 0,
  //   "max_order_amount": 0,
  //   "min_deposit_percent": 0,
  //   "max_deposit_percent": 0,
  //   "min_delivery_lead_days": 0,
  //   "default_deposit_percent": 0,
  //   "shipping_fee": 0,
  //   "min_lead_hours": 0,
  //   "morning_cutoff_hour": 0,
  //   "max_booking_days": 0,
  //   "updated_at": "2026-06-26T11:40:43.187Z",
  //   "updated_by": 0,
  //   "updated_by_username": "string"
  // }

  update: (data) =>
    axiosClient.patch("/system-config/", data).then((res) => res.data),

  // Admin chỉnh một phần hoặc toàn bộ tham số nghiệp vụ. Thay đổi có hiệu lực sau khi cache hết hạn (tối đa ~5 phút) hoặc ngay sau request tiếp theo trên cùng worker.
  // Không thể sửa allowed_image_types (cố định trong code).

  //schema
  // {
  //   "max_upload_image_size_mb": 0,
  //   "max_categories_per_supplier": 0,
  //   "max_products_per_supplier": 0,
  //   "max_images_per_product": 0,
  //   "max_images_per_certification": 0,
  //   "max_login_attempts": 0,
  //   "login_lockout_minutes": 0,
  //   "min_order_amount": 0,
  //   "max_order_amount": 0,
  //   "min_deposit_percent": 0,
  //   "max_deposit_percent": 0,
  //   "default_deposit_percent": 0,
  //   "min_delivery_lead_days": 0,
  //   "shipping_fee": 0,
  //   "min_lead_hours": 0,
  //   "morning_cutoff_hour": 0,
  //   "max_booking_days": 0
  // }
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
