import axiosClient from "./axiosClient";

export const productService = {
  // ADMIN
  getAll: async () => {
    const res = await axiosClient.get("/supplier-products/");
    return res.data;
  },

  // {
  //   "count": 123,
  //   "next": "http://api.example.org/accounts/?page=4",
  //   "previous": "http://api.example.org/accounts/?page=2",
  //   "results": [
  //     {
  //       "count": 0,
  //       "next": "string",
  //       "previous": "string",
  //       "page": 0,
  //       "page_size": 0,
  //       "has_more": true,
  //       "results": [
  //         {
  //           "id": 0,
  //           "name": "string",
  //           "slug": "1e7i__3p-RJYcPNbklxKHObFk9RFoVYwGGG49m_VIm3XdAH4R",
  //           "unit": "string",
  //           "description": "string",
  //           "storage_duration_days": 2147483647,
  //           "min_storage_temp": "996.7",
  //           "max_storage_temp": "-1",
  //           "status": "pending",
  //           "verified_by": 0,
  //           "verified_by_username": "string",
  //           "verified_at": "2026-06-08T05:28:34.682Z",
  //           "rejection_reason": "string",
  //           "created_at": "2026-06-08T05:28:34.682Z",
  //           "updated_at": "2026-06-08T05:28:34.682Z",
  //           "images": [
  //             {
  //               "id": 0,
  //               "supplier_product": 0,
  //               "image_url": "string",
  //               "is_thumbnail": true,
  //               "sort_order": 2147483647,
  //               "created_at": "2026-06-08T05:28:34.682Z"
  //             }
  //           ],
  //           "supplier": {
  //             "id": 0,
  //             "company_name": "string",
  //             "tax_code": "string",
  //             "phone": "string",
  //             "address": "string",
  //             "verification_status": "pending",
  //             "account_username": "string",
  //             "account_full_name": "string"
  //           },
  //           "category": {
  //             "id": 0,
  //             "name": "string",
  //             "status": "pending"
  //           }
  //         }
  //       ]
  //     }
  //   ]
  // }

  getById: async (id) => {
    const res = await axiosClient.get(`/supplier-products/${id}/`);
    return res.data;
  },

  addProduct: async (formData) => {
    // Sửa lại thành:
    const res = await axiosClient.post("/supplier-products/", formData);
    // Đã xóa bỏ { headers: { "Content-Type": "multipart/form-data" } }
    return res.data;
  },
  addImageProduct: async (formData) => {
    const res = await axiosClient.post("/supplier-product-images/", formData);
    return res.data;
  },

  updateImageProduct: async (id, formData) => {
    const res = await axiosClient.patch(
      `/supplier-product-images/${id}/`,
      formData,
    );
    return res.data;
  },

  deleteImageProduct: async (id) => {
    try {
      const res = await axiosClient.delete(`/supplier-product-images/${id}/`);
      return res.data;
    } catch (err) {
      // Ảnh đã bị xóa trước đó hoặc id không còn — bỏ qua để không chặn luồng lưu
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  updateProduct: async (id, payload) => {
    const res = await axiosClient.patch(`/supplier-products/${id}/`, payload);
    return res.data;
  },

  /** Supplier tạm ngừng / mở lại bán hàng */
  updateSellingStatus: async (id, status) => {
    const res = await axiosClient.patch(`/supplier-products/${id}/`, {
      status,
    });
    return res.data;
  },

  lockSelling: async (id) => {
    const res = await axiosClient.patch(`/supplier-products/${id}/`, {
      status: "inactive",
    });
    return res.data;
  },

  unlockSelling: async (id) => {
    const res = await axiosClient.patch(`/supplier-products/${id}/`, {
      status: "active",
    });
    return res.data;
  },

  deleteProduct: async (id) => {
    const res = await axiosClient.delete(`/supplier-products/${id}`);
    return res.data;
  },

  verify: (id, data) => {
    const formData = new FormData();
    formData.append("status", data.status);
    formData.append("rejection_reason", data.rejection_reason || "");

    return axiosClient
      .post(`/supplier-products/${id}/verify/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => res.data);
    //   {
    //     "status": "approved / rejected",
    //     "rejection_reason": "string"
    //   }
  },
  remove: (id) => {
    return axiosClient
      .delete(`/supplier-products/${id}/`)
      .then((res) => res.data);
  },
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
