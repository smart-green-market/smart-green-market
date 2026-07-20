import axiosClient from "../axiosClient";

const SEGMENT_DEFINITIONS = [
  { code: "VIP", label: "Khách hàng VIP", fields: ["vip_count", "VIP", "vip"] },
  {
    code: "POTENTIAL",
    label: "Khách hàng tiềm năng",
    fields: ["potential_count", "POTENTIAL", "potential"],
  },
  {
    code: "PASSIVE",
    label: "Khách hàng thụ động",
    fields: ["passive_count", "PASSIVE", "passive"],
  },
  {
    code: "CHURN_RISK",
    label: "Có nguy cơ rời bỏ",
    fields: [
      "churn_risk_count",
      "risk_count",
      "at_risk_count",
      "CHURN_RISK",
      "RISK",
      "AT_RISK",
      "churn_risk",
      "risk",
    ],
  },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pickValue = (sources, fields) => {
  for (const source of sources) {
    for (const field of fields) {
      if (source?.[field] != null) return source[field];
    }
  }
  return 0;
};

export const normalizeSegmentCounts = (payload = {}) => {
  const sources = [
    payload?.segment_counts,
    payload?.segments,
    payload?.counts,
    payload?.customer_counts,
    payload,
  ];

  return SEGMENT_DEFINITIONS.map((definition) => ({
    code: definition.code,
    label: definition.label,
    count: toNumber(pickValue(sources, definition.fields)),
  }));
};

export const normalizeSegmentationRecord = (payload = {}) => {
  const segmentCounts = normalizeSegmentCounts(payload);
  const countedCustomers = segmentCounts.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const dealer =
    payload?.dealer && typeof payload.dealer === "object" ? payload.dealer : {};

  return {
    ...payload,
    id:
      payload?.id ??
      `${payload?.dealer_id ?? dealer?.id ?? "dealer"}-${payload?.created_at ?? "latest"}`,
    dealer_id: toNumber(payload?.dealer_id ?? dealer?.id, null),
    dealer_name:
      payload?.dealer_name ||
      payload?.store_name ||
      dealer?.store_name ||
      dealer?.name ||
      "",
    total_customers: toNumber(
      payload?.total_customers ?? payload?.customer_count,
      countedCustomers,
    ),
    silhouette_score: toNumber(
      payload?.silhouette_score ?? payload?.sc ?? payload?.score,
      null,
    ),
    created_at:
      payload?.created_at ?? payload?.run_at ?? payload?.timestamp ?? null,
    formatted_created_at: payload?.formatted_created_at ?? "",
    segment_counts: segmentCounts,
  };
};

export const normalizeSegmentationHistory = (
  payload,
  fallbackPageSize = 10,
) => {
  const results = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
      ? payload.results
      : [];

  return {
    count: toNumber(payload?.count, results.length),
    page: Math.max(1, toNumber(payload?.page, 1)),
    page_size: Math.max(1, toNumber(payload?.page_size, fallbackPageSize)),
    has_more: Boolean(payload?.has_more ?? payload?.next),
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
    count_status: payload?.count_status ?? {},
    results: results.map(normalizeSegmentationRecord),
  };
};

export const normalizeSegmentationResult = (payload = {}) => {
  const record = normalizeSegmentationRecord(payload);
  return {
    ...record,
    success: payload?.success !== false,
    message: payload?.message || "Phân loại khách hàng hoàn tất.",
  };
};

export const adminSegmentAiService = {
  // POST /api/customer-segmentation/
  // Request: { dealer_id: number, t_days: number }
  // Response: success, message, customer_count/total_customers,
  // silhouette_score và số khách hàng trong từng phân khúc.
  customerSegmentation: ({ dealer_id, t_days }) =>
    axiosClient
      .post("/customer-segmentation/", {
        dealer_id: Number(dealer_id),
        t_days: Number(t_days),
      })
      .then((response) => normalizeSegmentationResult(response.data)),
  // Admin chạy phân khúc khách hàng (RFM + K-Means) - MỚI
  // Nhận dealer_id và t_days từ frontend, gọi pipeline AI phân khúc khách hàng và lưu kết quả xuống database.

  // in:
  //   {
  //     "dealer_id": 1,
  //     "t_days": 1
  //     }

  // response
  // {
  // "success": true,
  // "message": "string",
  // "customer_count": 0,
  // "segment_counts": {
  //     "additionalProp1": 0,
  //     "additionalProp2": 0,
  //     "additionalProp3": 0
  // },
  // "silhouette_score": 0
  // }

  // GET /api/admin/segmentation-history/?page=1&page_size=10
  // Lịch sử phân loại của toàn hệ thống để Admin giám sát Silhouette Score.
  getAdminHistory: ({ page = 1, page_size = 10 } = {}) =>
    axiosClient
      .get("/admin/segmentation-history/", { params: { page, page_size } })
      .then((response) =>
        normalizeSegmentationHistory(response.data, page_size),
      ),
  // Admin giám sát điểm số Sihouette toàn hệ thống (Phân trang)
  // Lấy danh sách phân trang (load từng trang) tất cả dữ liệu phân cụm AI của mọi đại lý để Admin đánh giá mô hình.

  // {
  //   "count": 0,
  //   "next": "string",
  //   "previous": "string",
  //   "page": 0,
  //   "page_size": 0,
  //   "has_more": true,
  //   "count_status": {
  //     "additionalProp1": 0,
  //     "additionalProp2": 0,
  //     "additionalProp3": 0
  //   },
  //   "results": [
  //     {
  //       "id": 0,
  //       "dealer_id": 2147483647,
  //       "silhouette_score": 0,
  //       "total_customers": 2147483647,
  //       "created_at": "2026-07-18T00:59:19.523Z",
  //       "formatted_created_at": "string"
  //     }
  //   ]
  // }

  // GET /api/dealer/segmentation-history/?dealer_id={id}
  // Các phiên phân loại trong 60 ngày gần nhất, API sắp xếp tăng dần.
  getDealerHistory: (dealerId) => {
    const normalizedDealerId = toNumber(dealerId, null);
    if (normalizedDealerId == null) {
      return Promise.reject(new Error("ID Đại lý không hợp lệ."));
    }

    return axiosClient
      .get("/dealer/segmentation-history/", {
        params: { dealer_id: normalizedDealerId },
      })
      .then((response) => {
        const items = Array.isArray(response.data)
          ? response.data
          : (response.data?.results ?? []);
        return items
          .filter(
            (item) =>
              item?.dealer_id == null ||
              toNumber(item.dealer_id, null) === normalizedDealerId,
          )
          .map((item) =>
            normalizeSegmentationRecord({
              ...item,
              dealer_id: item?.dealer_id ?? normalizedDealerId,
            }),
          )
          .sort(
            (left, right) =>
              new Date(left.created_at || 0).getTime() -
              new Date(right.created_at || 0).getTime(),
          );
      });
  },
  // Lịch sử phân nhóm khách hàng trong 60 ngày gần nhất của Dealer
  //Trả về toàn bộ các phiên phân cụm AI trong vòng 60 ngày qua, sắp xếp tuần tự tăng dần phục vụ vẽ biểu đồ miền.

  // in: dealer_id (ID của đại lý cần lấy lịch sử)

  // [
  //   {
  //     "id": 0,
  //     "total_customers": 2147483647,
  //     "vip_count": 2147483647,
  //     "potential_count": 2147483647,
  //     "passive_count": 2147483647,
  //     "risk_count": 2147483647,
  //     "silhouette_score": 0,
  //     "created_at": "2026-07-18T00:59:47.463Z",
  //     "formatted_created_at": "string"
  //   }
  // ]
};

export const handleSegmentAiError = (
  error,
  defaultMessage = "Không thể tải dữ liệu phân loại khách hàng.",
) => {
  const data = error?.response?.data;
  return (
    data?.message ||
    data?.detail ||
    data?.error ||
    (typeof data === "string" ? data : null) ||
    error?.message ||
    defaultMessage
  );
};
