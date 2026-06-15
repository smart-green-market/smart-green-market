import axiosClient from "./axiosClient";

export const settingService = {
  // GET /system-config/ trả về object phẳng (không bọc trong "results")
  get: () => axiosClient.get("/system-config/").then((res) => res.data),

  // {
  //   "max_upload_image_size_mb": 0,
  //   "allowed_image_types": ["string"],
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
  //   "default_deposit_percent": 0
  // }
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
