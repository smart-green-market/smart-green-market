import { useState, useEffect, useRef } from "react";
import { categoryService } from "../../../../../services/api/categoryService";
import { productService } from "../../../../../services/api/productService";
import { productMasterService } from "../../../../../services/api/Admin/productMasterService";
import { extractProductList } from "../constants";

/**
 * Quản lý toàn bộ việc fetch dữ liệu cho modal:
 *   - Danh mục của supplier (system hoặc custom)
 *   - System categories (personal mode)
 *   - Product masters theo danh mục (đã lọc bỏ đang bán)
 *   - Set id product_master đang active/approved của supplier
 *
 * @param {object} params
 * @param {boolean} params.isOpen
 * @param {boolean} params.isPersonal
 * @param {string}  params.categoryId       - form.category (catalog mode)
 * @param {string}  params.systemCategoryId - selectedSystemCategoryId (personal mode)
 * @param {string}  params.selectedProductId
 * @param {function} params.onProductsLoaded - callback(available: Product[], isPersonal: boolean)
 */
export function useProductModalData({
  isOpen,
  isPersonal,
  categoryId,
  systemCategoryId,
  selectedProductId,
  onProductsLoaded,
}) {
  const [categories, setCategories] = useState([]);
  const [systemCategories, setSystemCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSellingIds, setLoadingSellingIds] = useState(false);

  // Ref lưu set id đang bán — không cần re-render khi thay đổi
  const sellingMasterIdsRef = useRef(new Set());

  // ── Reset ref khi modal mở ──────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    sellingMasterIdsRef.current = new Set();
  }, [isOpen, isPersonal]);

  // ── Fetch selling ids (active/approved) ─────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingSellingIds(true);

    productService
      .getAll()
      .then((response) => {
        if (cancelled) return;
        const all = extractProductList(response);
        const SELLING = new Set(["active", "approved"]);
        const ids = new Set(
          all
            .filter((p) => SELLING.has(p.status))
            .map((p) => p.product_master?.id ?? p.product_master ?? null)
            .filter(Boolean)
            .map(String)
        );
        sellingMasterIdsRef.current = ids;
      })
      .catch(() => { if (!cancelled) sellingMasterIdsRef.current = new Set(); })
      .finally(() => { if (!cancelled) setLoadingSellingIds(false); });

    return () => { cancelled = true; };
  }, [isOpen]);

  // ── Fetch danh mục supplier ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    categoryService
      .getsupplierCategories()
      .then((list) => {
        if (cancelled) return;
        const all = list ?? [];
        setCategories(
          isPersonal
            ? all.filter((c) => c.status === "active" && c.scope === "custom")
            : all.filter((c) => c.status === "active" && c.scope === "system")
        );
      })
      .catch(() => { if (!cancelled) setCategories([]); });

    return () => { cancelled = true; };
  }, [isOpen, isPersonal]);

  // ── Fetch system categories (personal mode) ─────────────────
  useEffect(() => {
    if (!isOpen || !isPersonal) return;
    let cancelled = false;

    categoryService
      .getsupplierCategories()
      .then((list) => {
        if (cancelled) return;
        setSystemCategories(
          (list ?? []).filter((c) => c.status === "active" && c.scope === "system")
        );
      })
      .catch(() => { if (!cancelled) setSystemCategories([]); });

    return () => { cancelled = true; };
  }, [isOpen, isPersonal]);

  // ── Fetch product masters theo category, lọc đang bán ───────
  useEffect(() => {
    const targetId = isPersonal ? systemCategoryId : categoryId;

    if (!isOpen || !targetId) {
      setProducts([]);
      return;
    }

    let cancelled = false;
    setLoadingProducts(true);

    productMasterService
      .getByCategory_id(targetId)
      .then((list) => {
        if (cancelled) return;
        const available = (list ?? []).filter(
          (p) => !sellingMasterIdsRef.current.has(String(p.id))
        );
        setProducts(available);
        onProductsLoaded?.(available, isPersonal, selectedProductId);
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          onProductsLoaded?.([], isPersonal, selectedProductId);
        }
      })
      .finally(() => { if (!cancelled) setLoadingProducts(false); });

    return () => { cancelled = true; };
  }, [isOpen, categoryId, systemCategoryId, isPersonal]);

  return {
    categories,
    systemCategories,
    products,
    loadingProducts,
    loadingSellingIds,
  };
}
