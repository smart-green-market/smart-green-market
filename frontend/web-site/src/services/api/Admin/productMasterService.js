import axiosClient from "../axiosClient";

export const productMasterService = {

  getAll: async () => {
    const res = await axiosClient.get("/product-masters/");
    return res.data;
  },

// Catalog sản phẩm chuẩn (Product Master).

// Lọc theo danh mục: ?category_id={id} — dropdown sau khi NCC chọn category system.

// Toàn bộ catalog: GET /api/product-masters/ (không truyền category_id) — trả mọi master active (NCC/Dealer) hoặc mọi trạng thái (Admin).

// NCC/Dealer: chỉ master active thuộc danh mục system active.

  // in - category_id (selectbox có search)

//   {
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
//         "results": [
//           {
//             "id": 0,
//             "category": {
//               "id": 0,
//               "name": "string",
//               "status": "pending",
//               "scope": "system"
//             },
//             "name": "string",
//             "slug": "nQwKcNeL6MihLcQjUighWP7hFK1P3b8GXicfNzjJNptpABymYLGuUAJ",
//             "default_unit": "string",
//             "description": "string",
//             "status": "active",
//             "sort_order": 2147483647
//           }
//         ]
//       }
//     ]
//   }

  getById: async (id) => {
    const res = await axiosClient.get(`/product-masters/${id}/`);
    return res.data;
  },

//   {
//     "id": 0,
//     "category": {
//       "id": 0,
//       "name": "string",
//       "status": "pending",
//       "scope": "system"
//     },
//     "name": "string",
//     "slug": "iQtkXTHgoVcZFmIp15YD29aDwGNTbU72GT-z-jSrYSZsY2gilUf20aJGefDX5-suJzBc6S8BtUbYIT_ssvbH1CGIqujQnw",
//     "default_unit": "string",
//     "description": "string",
//     "status": "active",
//     "sort_order": 2147483647
//   }

  create: async (formData) => {
    const res = await axiosClient.post("/product-masters/", formData);
    return res.data;
  },

  // {
  //   "category": 1, <- Category_id (selectbox có search)
  //   "name": "Cà chua",
  //   "default_unit": "kg",
  //   "description": "Cà chua loại phổ thông",
  //   "sort_order": 0
  // }

  update: async (id, payload) => {
    const res = await axiosClient.patch(`/product-masters/${id}/`, payload);
    return res.data;
  },

  // {
  //   "category": 1, <- Category_id (selectbox có search)
  //   "name": "string",
  //   "default_unit": "string",
  //   "description": "string",
  //   "status": "active",
  //   "sort_order": 2147483647
  // }

  remove: (id) => {
    return axiosClient.delete(`/product-masters/${id}/`).then((res) => res.data);
  },
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
