import { formatCurrency } from "../components/User/Cart/mockData";

const API_ORIGIN = "https://smart-green-market-api.onrender.com";

export function resolveMediaUrl(url) {
    if (!url || typeof url !== "string") return null;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${API_ORIGIN}${url}`;
    return url;
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

function buildDealerImages(raw) {
    if (Array.isArray(raw?.images) && raw.images.length) {
        return [...raw.images]
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((img) => ({
                ...img,
                image_url: resolveMediaUrl(img.image_url),
            }));
    }

    const thumbnail = resolveMediaUrl(raw?.thumbnail);
    if (thumbnail) {
        return [
            {
                id: raw.id,
                image_url: thumbnail,
                is_thumbnail: true,
                sort_order: 0,
            },
        ];
    }

    return [];
}

export function getProductPrice(product) {
    return product?.retail_price ?? product?.wholesale_price ?? product?.price ?? null;
}

function resolveCategoryId(raw) {
    if (raw?.category_id != null) return raw.category_id;
    if (raw?.category == null) return null;
    if (typeof raw.category === "object") return raw.category.id;
    return raw.category;
}

function resolveCategoryName(raw) {
    if (raw?.category_name) return raw.category_name;
    if (typeof raw?.category === "object") return raw.category?.name ?? "Nông sản";
    return "Nông sản";
}

export function formatDealerProduct(raw) {
    const images = buildDealerImages(raw);
    const thumbnail =
        resolveMediaUrl(raw?.thumbnail) ??
        images.find((img) => img.is_thumbnail)?.image_url ??
        images[0]?.image_url ??
        null;

    const retailPrice = raw?.retail_price ?? null;
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
        wholesale_price: retailPrice,
        price: retailPrice,
        available_quantity: raw.available_quantity ?? 0,
        in_stock:
            typeof inStock === "boolean"
                ? inStock
                : status === "active" || status === "approved",
        storage_duration_days: raw.storage_duration_days,
        min_storage_temp: raw.min_storage_temp,
        max_storage_temp: raw.max_storage_temp,
        status,
        verified_at: raw.status === "active" || raw.status === "approved" ? raw.updated_at : null,
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
        rating: raw.rating ?? 4.5,
        sold: raw.sold ?? 0,
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
        rating: raw.rating ?? 4.5,
        sold: raw.sold ?? 0,
        source: "supplier",
    };
}

export function formatUnitLabel(unit) {
    if (!unit) return "";
    return unit.startsWith("/") ? unit : `/${unit}`;
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
    if (min == null && max == null) return null;
    if (min != null && max != null) return `${min}°C — ${max}°C`;
    if (min != null) return `Tối thiểu ${min}°C`;
    return `Tối đa ${max}°C`;
}

export function formatProductPrice(price) {
    const value = Number(getProductPrice({ retail_price: price, wholesale_price: price, price }));
    if (price == null || price === "" || Number.isNaN(value)) return "Liên hệ";
    return formatCurrency(value);
}

export function isProductInStock(productOrStatus) {
    if (productOrStatus && typeof productOrStatus === "object") {
        if (typeof productOrStatus.in_stock === "boolean") {
            return productOrStatus.in_stock;
        }
        return isProductInStock(productOrStatus.status);
    }

    const status = productOrStatus;
    return status === "active" || status === "approved";
}

export function getStockLabel(status, inStock) {
    if (typeof inStock === "boolean") {
        return inStock ? "Còn hàng" : "Hết hàng";
    }
    if (status === "active" || status === "approved") return "Còn hàng";
    if (status === "inactive" || status === "paused") return "Ngừng bán";
    if (status === "pending") return "Chờ duyệt";
    if (status === "rejected") return "Không khả dụng";
    return "Hết hàng";
}

export function formatDateVi(value) {
    if (!value) return null;
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

export function toCardProduct(product) {
    const inStock = isProductInStock(product);
    const rawUnit = product.unit ?? "";
    const unitFilterKey = getUnitFilterKey(rawUnit);

    return {
        id: product.id,
        name: product.name,
        price: formatProductPrice(getProductPrice(product)),
        unit: formatUnitLabel(rawUnit),
        rawUnit,
        unitKey: unitFilterKey,
        unitFilterKey,
        image: product.thumbnail,
        brand: product.category_name || product.supplier_name || "GreenMarket",
        rating: product.rating,
        sold: product.sold,
        in_stock: inStock,
        available_quantity: product.available_quantity ?? 0,
        category_id: product.category_id,
        priceValue: Number(getProductPrice(product)) || 0,
    };
}
