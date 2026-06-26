import { useEffect, useState } from "react";
import {
  buyerCatalogService,
  handleApiError as handleCatalogApiError,
} from "../services/api/Buyer/buyerCatalogService";
import {
  buyerProductService,
  handleApiError as handleProductApiError,
} from "../services/api/Buyer/buyerProductService";
import { formatBuyerProduct, toCardProduct } from "../utils/userProductUtils";
import { useDealerSlug } from "./useStorefrontPaths";

const catalogCache = new Map();

function getCacheKey(slug, suffix = "") {
  return `${slug}${suffix}`;
}

async function loadCatalog(slug) {
  const key = getCacheKey(slug);
  if (catalogCache.has(key)) return catalogCache.get(key);

  const [categories, productRows] = await Promise.all([
    buyerCatalogService.getCategory(slug),
    buyerCatalogService.getProduct(slug),
  ]);

  const products = (productRows ?? []).map(formatBuyerProduct);
  const payload = { categories: categories ?? [], products };
  catalogCache.set(key, payload);
  return payload;
}

export function useBuyerCatalog() {
  const slug = useDealerSlug();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!slug) {
      setCategories([]);
      setProducts([]);
      setError(
        "Chưa xác định cửa hàng. Vui lòng truy cập qua link cửa hàng đại lý.",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    loadCatalog(slug)
      .then(({ categories: cats, products: list }) => {
        if (cancelled) return;
        setCategories(cats);
        setProducts(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            handleCatalogApiError(err, "Không thể tải dữ liệu cửa hàng"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { slug, categories, products, loading, error };
}

export function useBuyerProductSearch({
  search = "",
  ordering = "-updated_at",
  category = "",
} = {}) {
  const slug = useDealerSlug();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!slug) {
      setProducts([]);
      setError("Chưa xác định cửa hàng.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const params = { ordering };
    const trimmed = String(search).trim();
    if (trimmed) params.search = trimmed;
    if (category) params.category = category;

    buyerCatalogService
      .getProduct(slug, params)
      .then((rows) => {
        if (cancelled) return;
        setProducts((rows ?? []).map(formatBuyerProduct));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(handleCatalogApiError(err, "Không thể tìm kiếm sản phẩm"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, search, ordering, category]);

  return { slug, products, loading, error };
}

export function useBestSellerProducts() {
  const slug = useDealerSlug();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!slug) {
      setProducts([]);
      setError("Chưa xác định cửa hàng.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    buyerProductService
      .getBestSeller(slug)
      .then((rows) => {
        if (cancelled) return;
        setProducts((rows ?? []).map(formatBuyerProduct).map(toCardProduct));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            handleProductApiError(err, "Không thể tải sản phẩm bán chạy"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { slug, products, loading, error };
}

export async function fetchBuyerProductById(slug, id) {
  const raw = await buyerCatalogService.getProductById(slug, id);
  return formatBuyerProduct(raw);
}

export async function fetchRelatedBuyerProducts(
  slug,
  currentId,
  categoryId,
  limit = 4,
) {
  const rows = await buyerCatalogService.getProduct(slug);
  return (rows ?? [])
    .map(formatBuyerProduct)
    .filter(
      (item) =>
        String(item.id) !== String(currentId) &&
        (categoryId ? item.category_id === categoryId : true),
    )
    .slice(0, limit);
}

export function clearBuyerCatalogCache(slug) {
  if (slug) {
    catalogCache.delete(getCacheKey(slug));
    return;
  }
  catalogCache.clear();
}
