import { formatRelativeTimeVi } from "./adminDashboardUtils";

export const REVIEWS_PAGE_SIZE = 5;

const EMPTY_SUMMARY = {
  average: 0,
  total: 0,
  distribution: [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    percent: 0,
    count: 0,
  })),
};

export function mapProductReviewSummary(data) {
  if (!data) return EMPTY_SUMMARY;

  const total = Number(data.review_count) || 0;
  const average = Number(data.average_rating) || 0;
  const distributionMap = data.rating_distribution || {};

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count =
      Number(distributionMap[String(stars)] ?? distributionMap[stars]) || 0;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return { stars, percent, count };
  });

  return { average, total, distribution };
}

export function mapProductReviewItem(review) {
  const name = review.customer_name?.trim() || "Khách hàng";
  const timeLabel = formatRelativeTimeVi(review.created_at);
  const meta = review.order_code
    ? `Đơn ${review.order_code} • ${timeLabel}`
    : timeLabel;

  return {
    id: review.id,
    name,
    initial: name.charAt(0).toUpperCase(),
    meta,
    rating: Number(review.rating) || 0,
    content: review.comment?.trim() || "",
    images: (review.images || [])
      .map((image) => image.image_url)
      .filter(Boolean),
  };
}

export function getReviewTotalPages(count, pageSize = REVIEWS_PAGE_SIZE) {
  const total = Number(count) || 0;
  const size = Number(pageSize) || REVIEWS_PAGE_SIZE;
  return Math.max(1, Math.ceil(total / size));
}

export function getPendingReviewKey(item) {
  return `${item.order_id}-${item.dealer_product_id}`;
}

export function normalizePendingReviewItem(raw) {
  if (!raw) return null;
  return {
    order_id: raw.order_id,
    order_code: raw.order_code ?? "",
    dealer_product_id: raw.dealer_product_id,
    product_title: raw.product_title ?? "Sản phẩm",
    completed_at: raw.completed_at ?? null,
  };
}

export function normalizeMyReviewItem(raw) {
  if (!raw) return null;

  const imageItems = (raw.images || [])
    .map((image) => {
      if (typeof image === "string") {
        return { id: null, url: image };
      }
      return {
        id: image.id ?? null,
        url: image.image_url ?? image.url ?? "",
      };
    })
    .filter((item) => item.url);

  return {
    id: raw.id,
    order_id: raw.order_id,
    order_code: raw.order_code ?? "",
    dealer_product_id: raw.dealer_product_id,
    product_title: raw.product_title ?? "Sản phẩm",
    rating: Number(raw.rating) || 0,
    comment: raw.comment?.trim() || "",
    images: imageItems.map((item) => item.url),
    imageItems,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

export function parsePendingReviewList(response) {
  const list = Array.isArray(response) ? response : (response?.results ?? []);
  return list.map(normalizePendingReviewItem).filter(Boolean);
}

export function parseMyReviewList(response) {
  if (Array.isArray(response)) {
    const results = response.map(normalizeMyReviewItem).filter(Boolean);
    return {
      results,
      count: results.length,
      page: 1,
      page_size: REVIEWS_PAGE_SIZE,
    };
  }

  const results = (response?.results ?? [])
    .map(normalizeMyReviewItem)
    .filter(Boolean);

  return {
    results,
    count: Number(response?.count) || results.length,
    page: Number(response?.page) || 1,
    page_size: Number(response?.page_size) || REVIEWS_PAGE_SIZE,
  };
}

export function buildReviewFormData({
  order_id,
  dealer_product_id,
  rating,
  comment,
  imageFiles,
}) {
  const formData = new FormData();
  formData.append("order_id", String(order_id));
  formData.append("dealer_product_id", String(dealer_product_id));
  formData.append("rating", String(rating));
  if (comment?.trim()) {
    formData.append("comment", comment.trim());
  }
  imageFiles.forEach((file) => {
    formData.append("images", file);
  });
  return formData;
}

export function validateReviewForm({ rating, imageFiles }) {
  if (!rating || rating < 1 || rating > 5) {
    return "Vui lòng chọn số sao đánh giá.";
  }

  const files = (imageFiles ?? []).filter(Boolean);
  if (files.length === 0) {
    return "Vui lòng tải lên ít nhất 1 ảnh đánh giá.";
  }

  return "";
}

export function validateUpdateReviewForm({
  rating,
  existingImageCount,
  newImageFiles,
}) {
  if (!rating || rating < 1 || rating > 5) {
    return "Vui lòng chọn số sao đánh giá.";
  }

  const existing = Number(existingImageCount) || 0;
  const added = (newImageFiles ?? []).filter(Boolean).length;
  const total = existing + added;

  if (total === 0) {
    return "Vui lòng giữ ít nhất 1 ảnh đánh giá.";
  }

  if (total > 5) {
    return "Chỉ được tối đa 5 ảnh đánh giá.";
  }

  return "";
}

export function buildReviewImagesFormData(imageFiles) {
  const formData = new FormData();
  (imageFiles ?? []).filter(Boolean).forEach((file) => {
    formData.append("images", file);
  });
  return formData;
}
