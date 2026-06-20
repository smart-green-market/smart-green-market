import axiosClient from "./axiosClient";

export const dealerProductImage = {
  // USER
  getAll: () => axiosClient.get("/dealer-product-images/").then((res) => res.data.results),

  // {
  //   "count": 123,
  //   "next": "http://api.example.org/accounts/?page=4",
  //   "previous": "http://api.example.org/accounts/?page=2",
  //   "results": [
  //     {
  //       "id": 0,
  //       "dealer_product": 0,
  //       "image_url": "string",
  //       "is_thumbnail": true,
  //       "sort_order": 2147483647,
  //       "created_at": "2026-06-20T04:25:23.167Z"
  //     }
  //   ]
  // }

  getById: (id) => axiosClient.get(`/dealer-product-images/${id}/`).then((res) => res.data),

//  {
//   "id": 0,
//   "dealer_product": 0,
//   "image_url": "string",
//   "is_thumbnail": true,
//   "sort_order": 2147483647,
//   "created_at": "2026-06-20T04:25:39.344Z"
// }

  create: (data) => axiosClient.post("/dealer-product-images/", data).then((res) => res.data),

  // {
  //   "dealer_product": 0,
  //   "image_url": "string", Chọn file ảnh (avif, bmp, gif, heic, heif, jfif, jpeg, jpg, png, tif, tiff, webp — tối đa 5MB)
  //   "is_thumbnail": true,
  // }

  update: (id, data) => axiosClient.put(`/dealer-product-images/${id}/`, data).then((res) => res.data),
  
  // {
  //   "dealer_product": 0,
  //   "image_url": "string", Chọn file ảnh (avif, bmp, gif, heic, heif, jfif, jpeg, jpg, png, tif, tiff, webp — tối đa 5MB)
  //   "is_thumbnail": true,
  // }
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
