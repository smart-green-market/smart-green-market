import { formatCurrency } from "../components/User/Cart/mockData";
import { API_ORIGIN } from "../config/apiConfig";

export const PRODUCT_IMAGE_FALLBACK =
  "https://placehold.co/600x750/e8f5ef/006c49?text=Nông+sản";

export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${API_ORIGIN}${url}`;
  return url;
}

function extractImageUrl(source) {
  if (!source) return null;
  if (typeof source === "string") return resolveMediaUrl(source);
  return resolveMediaUrl(
    source.image_url ?? source.image ?? source.url ?? source.thumbnail ?? null,
  );
}

function buildDealerImages(raw) {
  const collected = [];
  const seen = new Set();

  const pushImage = (img, index) => {
    const image_url = extractImageUrl(img);
    if (!image_url || seen.has(image_url)) return;

    seen.add(image_url);
    collected.push({
      id: img?.id ?? `img-${index}-${image_url}`,
      image_url,
      is_thumbnail: Boolean(img?.is_thumbnail),
      sort_order: img?.sort_order ?? index,
    });
  };

  if (Array.isArray(raw?.images)) {
    raw.images.forEach((img, index) => pushImage(img, index));
  }

  if (Array.isArray(raw?.supplier_product?.images)) {
    raw.supplier_product.images.forEach((img, index) =>
      pushImage(img, index + 100),
    );
  }

  const thumbnail = extractImageUrl(raw?.thumbnail);
  if (thumbnail && !seen.has(thumbnail)) {
    collected.unshift({
      id: raw?.id ?? "thumbnail",
      image_url: thumbnail,
      is_thumbnail: true,
      sort_order: -1,
    });
    seen.add(thumbnail);
  }

  return collected.sort((a, b) => {
    if (a.is_thumbnail && !b.is_thumbnail) return -1;
    if (!a.is_thumbnail && b.is_thumbnail) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

export function getProductImageUrl(primary, fallback = PRODUCT_IMAGE_FALLBACK) {
  const extracted = extractImageUrl(primary);
  if (extracted) return extracted;
  if (fallback === null) return null;
  return resolveMediaUrl(fallback) || PRODUCT_IMAGE_FALLBACK;
}

/** Ưu tiên ảnh gốc trong mảng images, tránh thumbnail nén thấp khi có ảnh lớn hơn */
export function getBestProductImage(product) {
  const images = product?.images ?? [];

  const fullImages = images
    .filter((img) => !img.is_thumbnail)
    .map((img) => extractImageUrl(img))
    .filter(Boolean);

  if (fullImages.length) return fullImages[0];

  const anyImage = images.map((img) => extractImageUrl(img)).find(Boolean);
  if (anyImage) return anyImage;

  return extractImageUrl(product?.thumbnail) || PRODUCT_IMAGE_FALLBACK;
}

export function parseProductList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

export function parseDealerProductList(response) {
  if (Array.isArray(response)) return response;

  const top = response?.results ?? response?.result ?? [];
  if (!Array.isArray(top)) return [];

  if (top.length && Array.isArray(top[0]?.results)) {
    return top.flatMap((page) => page.results ?? []);
  }

  return top;
}

export function getProductPrice(product) {
  if (hasProductDiscount(product) && product?.effective_price != null) {
    return product.effective_price;
  }

  return (
    product?.retail_price ?? product?.wholesale_price ?? product?.price ?? null
  );
}

export function parseDiscountPercent(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return 0;
  return Math.round(parsed);
}

export function getRetailProductPrice(product) {
  const raw =
    product?.retail_price ?? product?.wholesale_price ?? product?.price ?? null;
  if (raw == null || raw === "") return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getEffectiveProductPrice(product) {
  const effective = product?.effective_price;
  if (effective != null && effective !== "") {
    const parsed = Number(effective);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const fallback =
    product?.retail_price ?? product?.wholesale_price ?? product?.price ?? null;
  const parsed = Number(fallback);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getDiscountPercent(product) {
  const fromApi = parseDiscountPercent(product?.discount_percent);
  if (fromApi > 0) return fromApi;

  const retail = getRetailProductPrice(product);
  const effective = getEffectiveProductPrice(product);
  if (retail != null && retail > 0 && effective < retail) {
    return Math.round((1 - effective / retail) * 100);
  }

  return 0;
}

export function hasProductDiscount(product) {
  if (
    product?.has_age_discount === true ||
    product?.has_age_discount === "true"
  ) {
    return true;
  }

  const retail = getRetailProductPrice(product);
  const effective = getEffectiveProductPrice(product);
  if (retail != null && retail > 0 && effective < retail) return true;

  return getDiscountPercent(product) > 0;
}

function resolveCategoryId(raw) {
  if (raw?.category_id != null) return raw.category_id;
  if (raw?.category == null) return null;
  if (typeof raw.category === "object") return raw.category.id;
  return raw.category;
}

function resolveCategoryName(raw) {
  if (raw?.category_name) return raw.category_name;
  if (typeof raw?.category === "object")
    return raw.category?.name ?? "Nông sản";
  return "Nông sản";
}

function normalizeCultivationProcesses(list) {
  if (!Array.isArray(list)) return [];

  return [...list]
    .filter((item) => item && (item.process_name || item.description))
    .sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0))
    .map((item, index) => ({
      id: item.id ?? `step-${index}`,
      stepOrder: item.step_order ?? index + 1,
      name: item.process_name ?? "",
      description: item.description ?? "",
    }));
}

export function formatDealerProduct(raw) {
  const images = buildDealerImages(raw);
  const thumbnail =
    resolveMediaUrl(raw?.thumbnail) ??
    images.find((img) => img.is_thumbnail)?.image_url ??
    images[0]?.image_url ??
    null;

  const retailPrice = raw?.retail_price ?? null;
  const effectivePrice = raw?.effective_price ?? retailPrice;
  const inStock = raw?.in_stock;
  const status =
    typeof inStock === "boolean"
      ? inStock
        ? "active"
        : "inactive"
      : raw?.status;

  return {
    id: raw.id,
    name: raw.title || raw.supplier_product_name || "",
    slug: raw.slug ?? `dp-${raw.id}`,
    unit: raw.unit ?? raw.supplier_product_unit ?? "",
    description: raw.description ?? "",
    retail_price: retailPrice,
    effective_price: effectivePrice,
    discount_amount: raw?.discount_amount ?? null,
    discount_percent: raw?.discount_percent ?? null,
    has_age_discount: raw?.has_age_discount ?? false,
    nearest_expiry_date: raw?.nearest_expiry_date ?? null,
    production_date: raw?.production_date ?? null,
    expiry_date: raw?.expiry_date ?? null,
    days_to_expiry: raw?.days_to_expiry ?? null,
    age_discount_reason: raw?.age_discount_reason ?? "",
    wholesale_price: retailPrice,
    price: effectivePrice ?? retailPrice,
    available_quantity: raw.available_quantity ?? 0,
    in_stock:
      typeof inStock === "boolean"
        ? inStock
        : status === "active" || status === "approved",
    storage_duration_days: raw.storage_duration_days,
    min_storage_temp: raw.min_storage_temp,
    max_storage_temp: raw.max_storage_temp,
    status,
    verified_at:
      raw.status === "active" || raw.status === "approved"
        ? raw.updated_at
        : null,
    verified_by_username: raw.dealer?.account_username ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    images,
    thumbnail,
    category: typeof raw.category === "object" ? raw.category : null,
    category_name: resolveCategoryName(raw),
    category_id: resolveCategoryId(raw),
    supplier_product: raw.supplier_product,
    supplier_product_name: raw.supplier_product_name ?? "",
    supplier_name: raw.supplier_name ?? raw.supplier_product_name ?? "",
    dealer: raw.dealer ?? null,
    dealer_name: raw.dealer?.store_name ?? "",
    rating: raw.rating != null ? Number(raw.rating) : null,
    sold: raw.total_sold ?? raw.sold ?? 0,
    cultivation_processes: normalizeCultivationProcesses(
      raw.cultivation_processes,
    ),
    source: "dealer",
  };
}

/** Chuẩn hóa sản phẩm từ buyerCatalogService (storefront API) */
export function formatBuyerProduct(raw) {
  return formatDealerProduct(raw);
}

/** @deprecated Dùng formatDealerProduct cho luồng User */
export function formatUserProduct(raw) {
  if (raw?.title || raw?.retail_price != null || raw?.dealer) {
    return formatDealerProduct(raw);
  }

  const images = [...(raw?.images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  const thumbnail =
    images.find((img) => img.is_thumbnail)?.image_url ??
    images[0]?.image_url ??
    null;

  return {
    id: raw.id,
    name: raw.name ?? "",
    slug: raw.slug ?? "",
    unit: raw.unit ?? "",
    description: raw.description ?? "",
    retail_price: raw.wholesale_price,
    wholesale_price: raw.wholesale_price,
    price: raw.wholesale_price,
    daily_production_capacity: raw.daily_production_capacity,
    storage_duration_days: raw.storage_duration_days,
    min_storage_temp: raw.min_storage_temp,
    max_storage_temp: raw.max_storage_temp,
    status: raw.status,
    verified_at: raw.verified_at,
    verified_by_username: raw.verified_by_username,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    images,
    thumbnail,
    category: raw.category ?? null,
    category_name: raw.category?.name ?? "",
    category_id: raw.category?.id,
    supplier: raw.supplier ?? null,
    supplier_name: raw.supplier?.company_name ?? "",
    rating: raw.rating != null ? Number(raw.rating) : null,
    sold: raw.sold ?? 0,
    source: "supplier",
  };
}

export function formatUnitLabel(unit) {
  if (!unit) return "";
  return unit.startsWith("/") ? unit : `${unit}`;
}

export function formatStorageDuration(days) {
  if (days == null || days === "") return null;
  const n = Number(days);
  if (Number.isNaN(n)) return null;
  if (n >= 7 && n % 7 === 0) {
    const weeks = n / 7;
    return weeks === 1 ? "1 tuần" : `${weeks} tuần`;
  }
  return `${n} ngày`;
}

export function formatStorageTemperature(min, max) {
  const toInt = (value) => {
    if (value == null || value === "") return null;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return null;
    return Math.round(parsed);
  };

  const minInt = toInt(min);
  const maxInt = toInt(max);

  if (minInt == null && maxInt == null) return null;
  if (minInt != null && maxInt != null) return `${minInt}°C — ${maxInt}°C`;
  if (minInt != null) return `Tối thiểu ${minInt}°C`;
  return `Tối đa ${maxInt}°C`;
}

export function formatProductPrice(price) {
  const value = Number(
    getProductPrice({ retail_price: price, wholesale_price: price, price }),
  );
  if (price == null || price === "" || Number.isNaN(value)) return "Liên hệ";
  return formatCurrency(value);
}

export function isProductInStock(productOrStatus) {
  if (productOrStatus && typeof productOrStatus === "object") {
    if (typeof productOrStatus.in_stock === "boolean") {
      return productOrStatus.in_stock;
    }

    const rawAvail =
      productOrStatus.available_quantity ?? productOrStatus.availableQuantity;
    if (rawAvail != null && rawAvail !== "") {
      const avail = Number(rawAvail);
      if (Number.isFinite(avail)) {
        return avail > 0;
      }
    }

    if (productOrStatus.status != null) {
      return isProductInStock(productOrStatus.status);
    }

    return false;
  }

  const status = productOrStatus;
  return status === "active" || status === "approved";
}

const UNAVAILABLE_PRODUCT_STATUSES = new Set([
  "inactive",
  "pending",
  "rejected",
  "deleted",
  "paused",
]);

/** SP còn được đặt (mua ngay hoặc đặt trước khi hết tồn). */
export function isProductPurchasable(product) {
  if (!product || typeof product !== "object") return false;

  const status = product.status;
  if (status && UNAVAILABLE_PRODUCT_STATUSES.has(status)) {
    return false;
  }

  if (status === "active" || status === "approved") {
    return true;
  }

  if (
    typeof product.in_stock === "boolean" ||
    product.available_quantity != null ||
    product.availableQuantity != null
  ) {
    return true;
  }

  return isProductInStock(product);
}

/** SP đang bán nhưng hết tồn — chỉ đi luồng đặt trước. */
export function isProductPreorderOnly(product) {
  return isProductPurchasable(product) && !isProductInStock(product);
}

export function getStockLabel(status, inStock) {
  if (typeof inStock === "boolean") {
    return inStock ? "Còn hàng" : "Đặt trước";
  }
  if (status === "active" || status === "approved") return "Còn hàng";
  if (status === "inactive" || status === "paused") return "Ngừng bán";
  if (status === "pending") return "Chờ duyệt";
  if (status === "rejected") return "Không khả dụng";
  return "Hết hàng";
}

export function formatDateVi(value) {
  if (!value) return null;

  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function normalizeUnitKey(unit) {
  if (!unit) return "";
  const value = String(unit).trim().toLowerCase().replace(/^\//, "");
  if (value === "bó" || value === "bo") return "bo";
  if (value === "cây" || value === "cay") return "cay";
  return value;
}

export function getUnitFilterKey(unit) {
  return normalizeUnitKey(unit);
}

export function buildUnitFilterOptions(products = []) {
  const map = new Map();

  for (const product of products) {
    const rawUnit = product?.unit ?? product?.rawUnit ?? "";
    const key = getUnitFilterKey(rawUnit);
    if (!key) continue;

    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }

    map.set(key, {
      value: key,
      label: formatUnitLabel(rawUnit || key),
      count: 1,
    });
  }

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "vi"),
  );
}

export function buildSupplierFilterOptions(products) {
  const map = new Map();

  for (const product of products) {
    const name = String(
      product.supplier_name || product.dealer_name || "",
    ).trim();
    if (!name) continue;

    map.set(name, (map.get(name) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => a.label.localeCompare(b.label, "vi"));
}

export function formatAvailableQuantityLabel(quantity, unit, inStock = true) {
  if (!inStock) return "Hết hàng";

  const unitText = String(unit ?? "")
    .replace(/^\//, "")
    .trim();
  const qty = quantity ?? 0;

  return unitText ? `Còn ${qty} ${unitText}` : `Còn ${qty}`;
}

export function toCardProduct(product) {
  const inStock = isProductInStock(product);
  const rawUnit = product.unit ?? "";
  const unitFilterKey = getUnitFilterKey(rawUnit);
  const hasDiscount = hasProductDiscount(product);
  const effectivePrice = getEffectiveProductPrice(product);
  const retailPrice = getRetailProductPrice(product);
  const discountPercent = getDiscountPercent(product);

  return {
    id: product.id,
    name: product.name,
    price: formatProductPrice(effectivePrice),
    originalPrice:
      hasDiscount && retailPrice != null
        ? formatProductPrice(retailPrice)
        : null,
    unit: formatUnitLabel(rawUnit),
    rawUnit,
    unitKey: unitFilterKey,
    unitFilterKey,
    image: product.thumbnail,
    brand: product.category_name || product.supplier_name || "GreenMarket",
    category_name: product.category_name || product.brand || "Nông sản",
    supplier_name:
      product.supplier_name || product.dealer_name || product.brand || "",
    rating: product.rating,
    sold: product.sold,
    in_stock: inStock,
    available_quantity: product.available_quantity ?? 0,
    category_id: product.category_id,
    priceValue: effectivePrice,
    retailPriceValue: retailPrice,
    discountPercent,
    hasDiscount,
  };
}
