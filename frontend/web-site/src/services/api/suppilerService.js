import axiosClient from "./axiosClient";

export const supplierService = {
  // --- SUPPLIER

  create: (data) =>
    axiosClient.post("/suppliers/", data).then((res) => res.data.data),

  // {
  //   "company_name": "Cong ty Nong San ABC",
  //   "tax_code": "0123456789",
  //   "phone": "0901234567",
  //   "address": "123 Duong X, Quan Y, Ha Noi",
  //   "description": "Chuyen cung cap rau cu huu co"
  // }

  update: (id, data) =>
    axiosClient.patch(`/suppliers/${id}/`, data).then((res) => res.data),

  // {
  //   "company_name": "string",
  //   "tax_code": "string",
  //   "phone": "string",
  //   "address": "string",
  //   "description": "string"
  // }

  // --- ADMIN
  getAll: (params) => axiosClient.get("/suppliers/", { params }).then((res) => {
    if (params && params.page) return res.data;
    return res.data.results || res.data;
  }),

  //[
  //   {
  //     "id": 0,
  //     "company_name": "string",
  //     "tax_code": "string",
  //     "phone": "string",
  //     "address": "string",
  //     "description": "string",
  //     "verification_status": "pending",
  //     "created_at": "2026-06-06T12:58:34.410Z",
  //     "updated_at": "2026-06-06T12:58:34.410Z",
  //     "account": 0
  //   }
  // ]

  getById: (id) => axiosClient.get(`/suppliers/${id}/`).then((res) => res.data),
  getProductById: (id) => axiosClient.get(`/suppliers/${id}/products/`).then((res) => res.data),

  /** Lấy SP của NCC (dealer đặt hàng) — có phân trang. */
  getSupplierProducts: (supplierId, params = {}) =>
    axiosClient.get(`/suppliers/${supplierId}/products/`, { params }).then((res) => res.data),

  // {
  //   "id": 0,
  //   "account": {
  //     "id": 0,
  //     "username": "zctef5Mo6tuT3ZFX75Az7xXnZuECLx",
  //     "email": "user@example.com",
  //     "first_name": "string",
  //     "last_name": "string",
  //     "full_name": "string",
  //     "phone": "string",
  //     "avatar": "string",
  //     "role": "admin",
  //     "status": "active",
  //     "created_at": "2026-06-06T12:59:27.405Z",
  //     "updated_at": "2026-06-06T12:59:27.405Z"
  //   },
  //   "company_name": "string",
  //   "tax_code": "string",
  //   "phone": "string",
  //   "address": "string",
  //   "description": "string",
  //   "verification_status": "pending",
  //   "created_at": "2026-06-06T12:59:27.405Z",
  //   "updated_at": "2026-06-06T12:59:27.405Z",
  //   "documents": [
  //     {
  //       "id": 0,
  //       "document_type": "business_license",
  //       "file_url": "string",
  //       "status": "pending",
  //       "verified_by": 0,
  //       "verified_by_username": "string",
  //       "verified_at": "2026-06-06T12:59:27.405Z",
  //       "created_at": "2026-06-06T12:59:27.405Z"
  //     }
  //   ],
  //   "certifications": [
  //     {
  //       "id": 0,
  //       "name": "string",
  //       "certificate_code": "string",
  //       "issued_by": "string",
  //       "issue_date": "2026-06-06",
  //       "expiry_date": "2026-06-06",
  //       "description": "string",
  //       "file_url": "string",
  //       "status": "pending",
  //       "verified_at": "2026-06-06T12:59:27.405Z",
  //       "rejection_reason": "string",
  //       "created_at": "2026-06-06T12:59:27.405Z",
  //       "updated_at": "2026-06-06T12:59:27.405Z",
  //       "deleted_at": "2026-06-06T12:59:27.405Z",
  //       "supplier": 0,
  //       "verified_by": 0
  //     }
  //   ],
  //   "products": [
  //     {
  //       "id": 0,
  //       "images": [
  //         {
  //           "id": 0,
  //           "supplier_product": 0,
  //           "image_url": "string",
  //           "is_thumbnail": true,
  //           "sort_order": 2147483647,
  //           "created_at": "2026-06-06T12:59:27.405Z"
  //         }
  //       ],
  //       "name": "string",
  //       "slug": "G5weCufUSM1LKbuc2bPEbGRgE0X4ZT",
  //       "unit": "string",
  //       "description": "string",
  //       "storage_duration_days": 2147483647,
  //       "min_storage_temp": "6.98",
  //       "max_storage_temp": ".8",
  //       "status": "pending",
  //       "verified_at": "2026-06-06T12:59:27.405Z",
  //       "rejection_reason": "string",
  //       "created_at": "2026-06-06T12:59:27.405Z",
  //       "updated_at": "2026-06-06T12:59:27.405Z",
  //       "supplier": 0,
  //       "category": 0,
  //       "verified_by": 0
  //     }
  //   ]
  // }

  status: (id, data) =>
    axiosClient
      .post(`/suppliers/${id}/account-status/`, data)
      .then((res) => res.data),

  // {
  //   "status": "active / inactive / banned",
  //   "reason": "string"
  // }

  verify: (id, data) =>
    axiosClient.post(`/suppliers/${id}/verify/`, data).then((res) => res.data),

  // id
  getbyIdSupplier: (id) => {
    return axiosClient.get(`/suppliers/${id}/documents/`);
  },

  // --- ADMIN FINANCE
  getFinanceOverview: (params = {}) =>
    axiosClient
      .get("/suppliers/finance-overview/", { params })
      .then((res) => res.data),
  // {
  //   "total_system_revenue": "1000000000",
  //   "total_cash_in": "800000000",
  //   "total_cash_out": "200000000",
  //   "total_commission": "50000000",
  //   "average_commission_rate": "5.5",
  //   "supplier_count": 12
  // }

  getFinanceList: (params = {}) =>
    axiosClient.get("/suppliers/finance/", { params }).then((res) => res.data),
  // Phân trang: ?page=1&page_size=5&search=&verification_status=
  // {
  //   "count": 12,
  //   "next": "...",
  //   "previous": null,
  //   "results": [{
  //     "id": 1,
  //     "company_name": "Cong ty ABC",
  //     "tax_code": "0123456789",
  //     "verification_status": "approved",
  //     "total_revenue": "500000000",
  //     "cash_in": "400000000",
  //     "cash_out": "100000000",
  //     "commission_rate": "5",
  //     "commission_amount": "25000000",
  //     "net_revenue": "475000000",
  //     "order_count": 42,
  //     "cash_flow": [{ "month": "2026-01", "in": 10000000, "out": 2000000 }]
  //   }]
  // }
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
