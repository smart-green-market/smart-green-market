import axiosClient from "../axiosClient";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseSerializedValue = (value) => {
  if (typeof value !== "string") return value;
  const normalized = value.trim();
  if (!normalized) return null;
  try {
    return JSON.parse(normalized);
  } catch {
    return value;
  }
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return ["true", "1", "yes", "warning", "warn"].includes(
    String(value || "")
      .trim()
      .toLowerCase(),
  );
};

const toPercent = (value) => {
  const number = toNumber(value, 0);
  return number >= 0 && number <= 1 ? number * 100 : number;
};

export const normalizeLossHistory = (value) => {
  const parsed = parseSerializedValue(value);
  const source = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.loss)
      ? parsed.loss
      : Array.isArray(parsed?.loss_history)
        ? parsed.loss_history
        : Array.isArray(parsed?.history)
          ? parsed.history
          : Array.isArray(parsed?.values)
            ? parsed.values
            : parsed && typeof parsed === "object"
              ? Object.entries(parsed).map(([epoch, loss]) => ({ epoch, loss }))
              : [];

  return source
    .map((item, index) => {
      const isObject = item && typeof item === "object";
      const loss = toNumber(
        isObject ? (item.loss ?? item.value ?? item.metric) : item,
        null,
      );
      const epoch = toNumber(
        isObject ? (item.epoch ?? item.step ?? item.index) : index + 1,
        index + 1,
      );
      return { epoch, loss };
    })
    .filter((item) => item.loss != null);
};

export const normalizeDealerCoverage = (value) => {
  const parsed = parseSerializedValue(value);
  const source = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.dealers)
      ? parsed.dealers
      : Array.isArray(parsed?.results)
        ? parsed.results
        : Array.isArray(parsed?.coverage)
          ? parsed.coverage
          : parsed && typeof parsed === "object"
            ? Object.entries(parsed).map(([key, detail]) =>
                detail && typeof detail === "object"
                  ? { coverage_key: key, ...detail }
                  : { coverage_key: key, coverage: detail },
              )
            : [];

  return source.map((item, index) => {
    const dealer =
      item?.dealer && typeof item.dealer === "object" ? item.dealer : {};
    const totalProducts = toNumber(
      item?.total_products ??
        item?.total_items ??
        item?.catalog_items ??
        item?.item_count,
      0,
    );
    const covered = toNumber(
      item?.covered ??
        item?.covered_items ??
        item?.recommended_items ??
        item?.items_with_recommendations,
      0,
    );
    const missingCount = toNumber(
      item?.missing_count ?? item?.missing_items,
      Math.max(0, totalProducts - covered),
    );
    const warningMessage =
      item?.warning_message || item?.warning || item?.message || "";

    return {
      ...item,
      id:
        item?.id ??
        item?.dealer_id ??
        dealer?.id ??
        item?.coverage_key ??
        index,
      dealer_id: item?.dealer_id ?? dealer?.id ?? item?.coverage_key ?? null,
      dealer_name:
        item?.dealer_name ||
        item?.store_name ||
        dealer?.store_name ||
        dealer?.name ||
        `Đại lý #${item?.dealer_id ?? dealer?.id ?? item?.coverage_key ?? index + 1}`,
      coverage_pct: toPercent(
        item?.coverage_pct ??
          item?.coverage ??
          item?.catalog_coverage ??
          item?.coverage_percent ??
          item?.coverage_ratio,
      ),
      total_products: totalProducts,
      covered,
      missing_count: missingCount,
      has_warning:
        toBoolean(
          item?.has_warning ?? item?.has_warnings ?? item?.warning_status,
        ) ||
        Boolean(warningMessage) ||
        missingCount > 0,
      warning_message: warningMessage,
    };
  });
};

export const normalizeTrainingSession = (payload = {}) => {
  const dealerCoverage = normalizeDealerCoverage(
    payload?.dealer_coverage_detail,
  );
  return {
    ...payload,
    id: payload?.id ?? null,
    model_name: payload?.model_name || "Item2Vec",
    run_date: payload?.run_date ?? payload?.created_at ?? null,
    epochs_run: toNumber(payload?.epochs_run, 0),
    final_loss: toNumber(payload?.final_loss, null),
    catalog_coverage: toPercent(payload?.catalog_coverage),
    total_items_trained: toNumber(payload?.total_items_trained, 0),
    status: String(payload?.status || "unknown").toLowerCase(),
    has_warnings:
      toBoolean(payload?.has_warnings) ||
      dealerCoverage.some((dealer) => dealer.has_warning),
    loss_history: normalizeLossHistory(payload?.loss_history),
    dealer_coverage_detail: dealerCoverage,
  };
};

export const normalizeTrainingHistory = (payload, fallbackPageSize = 10) => {
  const results = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
      ? payload.results
      : [];
  return {
    count: toNumber(payload?.count, results.length),
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
    page: Math.max(1, toNumber(payload?.page, 1)),
    page_size: Math.max(1, toNumber(payload?.page_size, fallbackPageSize)),
    has_more: Boolean(payload?.has_more ?? payload?.next),
    count_status: payload?.count_status ?? {},
    results: results.map(normalizeTrainingSession),
  };
};

export const aiTrainingServicer = {
  trainRelatedProducts: () =>
    axiosClient.post("/train-related-products/").then((res) => res.data),
  // Chỉ admin. Chạy pipeline huấn luyện mô hình gợi ý sản phẩm liên quan từ lịch sử đơn hàng và cập nhật kết quả xuống database.

  // response
  // {
  //   "success": true,
  //   "message": "Thành công: Đã huấn luyện mô hình và cập nhật danh sách gợi ý."
  // }

  reloadRelatedProducts: () =>
    axiosClient.post("/sync-related-products/").then((res) => res.data),
  // API POST (LUỒNG 2): Chỉ thực hiện tính toán độ tương đồng Cosine từ file ma trận trọng số .keras để lưu xuống CSDL mà không cần huấn luyện lại. Tốc độ siêu nhanh (< 1s).
  // response
  // {
  //   "success": true,
  //   "message": "string"
  // }

  customerSegment: (params = {}) =>
    axiosClient.get("/customer-segments/", { params }).then((res) => res.data),
  // Admin và Dealer xem tất cả nhóm khách hàng (segment hệ thống dùng chung).
  // GET /api/customer-segments/?page=1&page_size=20
  // Phân trang (load more): mặc định page=1, page_size=20, tối đa 100.

  // {
  //   "count": 123,
  //   "next": "http://api.example.org/accounts/?page=4",
  //   "previous": "http://api.example.org/accounts/?page=2",
  //   "page": 1,
  //   "page_size": 5,
  //   "has_more": true,
  //   "results": [
  //     {
  //       "id": 0,
  //       "code": "string",
  //       "name": "string",
  //       "description": "string",
  //       "is_system": true,
  //       "created_at": "2026-07-16T11:40:06.601Z",
  //       "updated_at": "2026-07-16T11:40:06.601Z"
  //     }
  //   ]
  // }

  customerSegmentDetail: (id) =>
    axiosClient.get(`/customer-segments/${id}/`).then((res) => res.data),
  //ViewSet để quản lý phân nhóm khách hàng (CustomerSegment). Segment là tài nguyên dùng chung toàn hệ thống; membership gán qua CustomerSegmentMember. Admin có toàn quyền. Dealer chỉ có quyền xem (list/retrieve).
  //in id
  //{
  //   "id": 0,
  //   "code": "string",
  //   "name": "string",
  //   "description": "string",
  //   "is_system": true,
  //   "created_at": "2026-07-16T11:50:07.996Z",
  //   "updated_at": "2026-07-16T11:50:07.996Z"
  // }

  getTrainRelatedProducts: ({ page = 1, page_size = 10 } = {}) =>
    axiosClient
      .get("/train-related-products/", { params: { page, page_size } })
      .then((res) => normalizeTrainingHistory(res.data, page_size)),
  // Admin xem danh sách lịch sử huấn luyện AI (Phân trang)
  // Trả về danh sách các phiên huấn luyện Item2Vec, bao gồm loss, coverage tổng thể, và chi tiết coverage theo từng Dealer. Dùng để vẽ biểu đồ Loss/Coverage và phát hiện Dealer có vấn đề.

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
  //       "model_name": "string",
  //       "run_date": "2026-07-19T15:18:27.163Z",
  //       "epochs_run": 2147483647,
  //       "final_loss": 0,
  //       "catalog_coverage": 0,
  //       "total_items_trained": 2147483647,
  //       "status": "string",
  //       "has_warnings": "string",
  //       "dealer_coverage_detail": "string"
  //     }
  //   ]
  // }

  getTrainRelatedProductDetail: (id) => {
    const normalizedId = toNumber(id, null);
    if (normalizedId == null) {
      return Promise.reject(new Error("ID phiên huấn luyện không hợp lệ."));
    }
    return axiosClient
      .get(`/train-related-products/${normalizedId}/`)
      .then((res) => normalizeTrainingSession(res.data));
  },
  // Admin xem chi tiết phiên huấn luyện AI
  // Trả về toàn bộ thông tin chi tiết của một phiên huấn luyện, bao gồm mảng loss qua từng epoch (để vẽ biểu đồ đường) và danh sách Dealer bị cảnh báo thiếu gợi ý.
  //in id

  // {
  //   "id": 0,
  //   "model_name": "string",
  //   "run_date": "2026-07-19T15:19:37.665Z",
  //   "epochs_run": 2147483647,
  //   "final_loss": 0,
  //   "catalog_coverage": 0,
  //   "total_items_trained": 2147483647,
  //   "status": "string",
  //   "loss_history": "string",
  //   "dealer_coverage_detail": "string"
  // }
};

export const handleApiError = (error, defaultMessage = "Có lỗi xảy ra") => {
  const data = error.response?.data;
  const message =
    data?.message ||
    data?.detail ||
    (typeof data === "string" ? data : null) ||
    error.message ||
    defaultMessage;
  console.error("API Error:", error);
  return message;
};
