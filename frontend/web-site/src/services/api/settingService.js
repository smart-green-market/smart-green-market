import axiosClient from "./axiosClient";

export const settingService = {
  // GET /system-config/ trả về object phẳng (không bọc trong "results")
  get: () => axiosClient.get("/system-config/").then((res) => res.data),

  // Dung lượng upload ảnh (<5MB)
  // Số danh mục / sản phẩm / ảnh tối đa
  // Định dạng ảnh cho phép
  // Số lần đăng nhập sai tối đa
  //   {
  //     "max_upload_image_size_mb": 5,
  //     "allowed_image_types": [
  //       ".avif",
  //       ".bmp",
  //       ".gif",
  //       ".heic",
  //       ".heif",
  //       ".jfif",
  //       ".jpeg",
  //       ".jpg",
  //       ".png",
  //       ".tif",
  //       ".tiff",
  //       ".webp"
  //     ],
  //     "max_categories_per_supplier": 5,
  //     "max_products_per_supplier": 100,
  //     "max_images_per_product": 5,
  //     "max_images_per_certification": 5,
  //     "max_login_attempts": 5,
  //     "login_lockout_minutes": 15
  //   }
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
