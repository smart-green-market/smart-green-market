import axiosClient from "../axiosClient";

export const adminDashboardService = {
  // Lấy chuỗi doanh thu Đại lý (B2C) và giá trị nhập hàng Nhà cung cấp (B2B).
  chart: async () => {
    const res = await axiosClient.get("/dashboard/admin/revenue-chart");
    return res.data;
  },

  // Lấy dữ liệu tổng quan của Admin.
  summary: async () => {
    const res = await axiosClient.get("/dashboard/admin/summary");
    return res.data;
  },

  //   {
  //     "revenue": {
  //       "this_month_dealer": 1231500,
  //       "this_month_supplier": 4560000
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

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const pickNumericValue = (item, keys) => {
  for (const key of keys) {
    if (item?.[key] != null && item[key] !== "") {
      return Number(item[key]) || 0;
    }
  }
  return 0;
};

const hasAnyKey = (items, keys) =>
  items.some((item) =>
    keys.some((key) => Object.prototype.hasOwnProperty.call(item ?? {}, key)),
  );

const normalizeSeries = (items, valueKeys) =>
  items.map((item, index) => ({
    id: item?.id ?? item?.month ?? index,
    month: item?.month ?? item?.label ?? "",
    revenue: pickNumericValue(item, valueKeys),
  }));

export const normalizeAdminRevenueChart = (payload) => {
  const sharedItems = asArray(payload);
  const dealerItems = asArray(
    payload?.dealer ??
      payload?.dealers ??
      payload?.b2c ??
      payload?.dealer_revenue,
  );
  const supplierItems = asArray(
    payload?.supplier ??
      payload?.suppliers ??
      payload?.b2b ??
      payload?.supplier_revenue,
  );

  const dealerKeys = [
    "dealer_revenue",
    "revenue_dealer",
    "this_month_dealer",
    "b2c_revenue",
    "revenue",
    "value",
  ];
  const supplierKeys = [
    "supplier_revenue",
    "revenue_supplier",
    "this_month_supplier",
    "b2b_revenue",
    "purchase_value",
    "revenue",
    "value",
  ];

  const dealerSource = dealerItems.length ? dealerItems : sharedItems;
  const supplierSource = supplierItems.length ? supplierItems : sharedItems;
  const sharedSupplierKeys = supplierKeys.filter(
    (key) => !["revenue", "value"].includes(key),
  );
  const hasSupplierSeries =
    supplierItems.length > 0 || hasAnyKey(sharedItems, sharedSupplierKeys);

  return {
    dealers: normalizeSeries(dealerSource, dealerKeys),
    suppliers: hasSupplierSeries
      ? normalizeSeries(supplierSource, supplierKeys)
      : [],
    hasSupplierSeries,
  };
};

// Xử lý bug
export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  console.error("API Error:", error);
  return message;
};
