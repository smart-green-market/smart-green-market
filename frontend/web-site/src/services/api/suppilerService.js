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
    axiosClient.put(`/suppliers/${id}/`, data).then((res) => res.data),

  // {
  //   "company_name": "string",
  //   "tax_code": "string",
  //   "phone": "string",
  //   "address": "string",
  //   "description": "string"
  // }

  // --- ADMIN
  getAll: () => axiosClient.get("/suppliers/").then((res) => res.data.results),

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
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
