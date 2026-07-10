import axiosClient from "../axiosClient";

export const adminDashboardService = {
  //Lấy thống kê doanh thu toàn nền tảng theo tháng trong vòng 6 tháng gần nhất để vẽ biểu đồ.
  chart: async () => {
    const res = await axiosClient.get("/dashboard/admin/revenue-chart");
    return res.data;
  },

  //   [
  //     {
  //       "month": "string",
  //       "revenue": "-4.9"
  //     }
  //   ]

  //Lấy dữ liệu thống kê tổng quan của toàn nền tảng cho Admin: doanh thu tháng hiện tại, số đại lý và nhà cung cấp đang hoạt động, và số lượng khách hàng đăng ký mới trong tháng.
  summary: async () => {
    const res = await axiosClient.get("/dashboard/admin/summary");
    return res.data;
  },

  //   {
  //     "revenue": {
  //       "this_month": 1231500
  //     },
  //     "active_dealers": 4,
  //     "active_suppliers": 4,
  //     "new_customers_this_month": 1
  //   }

  //Danh sách 10 Đại lý có tổng doanh thu (các đơn hàng đã hoàn tất) cao nhất toàn hệ thống.
  top_dealers: async () => {
    const res = await axiosClient.get("/dashboard/admin/top-dealers");
    return res.data;
  },

  //   [
  //     {
  //       "id": 2,
  //       "store_name": "Cửa hàng Dương Ka",
  //       "total_revenue": 1570100,
  //       "total_orders": 10
  //     }
  //   ]

  //Danh sách 10 Nhà cung cấp có tổng doanh thu (từ các phiếu nhập hàng đã giao/hoàn tất) cao nhất.
  top_suppliers: async () => {
    const res = await axiosClient.get("/dashboard/admin/top-suppliers");
    return res.data;
  },

  //  [
  //   {
  //     "id": 9,
  //     "company_name": "Công ty TNHH Minh Nhựa 01",
  //     "total_revenue": 37893000,
  //     "total_orders": 17
  //   },
  //   {
  //     "id": 16,
  //     "company_name": "Công ty TNHH Dương Ka",
  //     "total_revenue": 4334591,
  //     "total_orders": 2
  //   }
  // ]

  //Lấy danh sách 10 sản phẩm có tổng doanh thu cao nhất, so sánh cả sản phẩm của Đại lý (B2C) và Nhà cung cấp (B2B).
  //sales: Tổng số lượng sản phẩm đã bán
  top_products: async () => {
    const res = await axiosClient.get("/dashboard/admin/top-products");
    return res.data;
  },

  // [
  //   {
  //     "id": 0,
  //     "name": "string",
  //     "category": "string",
  //     "type": "string",
  //     "sales": 0,
  //     "revenue": "573233.41"
  //   }
  // ]
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
