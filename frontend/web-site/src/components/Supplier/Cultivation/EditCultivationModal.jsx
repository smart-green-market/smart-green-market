import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Overlay, ModalBox, Field, inputCls } from "./CreateCultivationModal";
import { farmingProcessService } from "../../../services/api/cultivationService";
import { productService } from "../../../services/api/productService";
import {
  getActiveProducts,
  mergeCurrentProduct,
  parseFieldErrors,
  parseProductList,
  validateCultivationForm,
  handleApiError,
} from "./cultivationUtils";
import { errorsToSummary } from "../../../utils/supplierValidation";

export default function EditCultivationModal({ isOpen, onClose, process, onSuccess, productId }) {
  const isFixedProduct = productId != null && productId !== "";
  const [form, setForm] = useState({});
  const [original, setOriginal] = useState({});
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (isOpen && process) {
      const init = {
        supplier_product: String(process.supplier_product ?? productId ?? ""),
        step_order: String(process.step_order ?? ""),
        process_name: process.process_name ?? "",
        description: process.description ?? "",
      };
      setForm(init);
      setOriginal(init);
      setErrors({});
      setApiError("");
    }
  }, [isOpen, process, productId]);

  useEffect(() => {
    if (!isOpen || !process) return;

    async function fetchProducts() {
      setProductsLoading(true);
      try {
        if (isFixedProduct) {
          const product = await productService.getById(productId);
          setProducts(product ? [product] : []);
        } else {
          const res = await productService.getAll();
          const allProducts = parseProductList(res);
          const activeProducts = getActiveProducts(allProducts);
          setProducts(
            mergeCurrentProduct(activeProducts, allProducts, process.supplier_product),
          );
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách sản phẩm:", err);
        setProducts([]);
        setApiError("Không thể tải danh sách sản phẩm. Vui lòng thử lại!");
      } finally {
        setProductsLoading(false);
      }
    }

    fetchProducts();
  }, [isOpen, process, productId, isFixedProduct]);

  const activeProductIds = useMemo(
    () => getActiveProducts(products).map((p) => Number(p.id)),
    [products],
  );

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(form.supplier_product)),
    [products, form.supplier_product],
  );

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    setApiError("");
    const errs = validateCultivationForm(form, {
      activeProductIds,
      originalProductId: original.supplier_product,
    });
    if (Object.keys(errs).length) {
      setErrors(errs);
      setApiError(errorsToSummary(errs));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        supplier_product: Number(form.supplier_product),
        step_order: Number(form.step_order),
        process_name: form.process_name.trim(),
        description: form.description.trim(),
      };
      await farmingProcessService.update(process.id, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      const apiErrors = err?.response?.data ?? err;
      const { fieldErrors, general } = parseFieldErrors(apiErrors);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      setApiError(
        general || handleApiError(err, "Cập nhật quy trình thất bại. Vui lòng thử lại!"),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !process) return null;

  const isCurrentInactive = selectedProduct && selectedProduct.status !== "active";

  return (
    <Overlay onClose={onClose}>
      <ModalBox>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chỉnh sửa quy trình</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isFixedProduct
                ? "Cập nhật bước quy trình của sản phẩm đang xem"
                : "Chỉ chọn sản phẩm đang được bán khi đổi sản phẩm"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <X size={18} className="text-neutral-500" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
          {apiError && (
            <div className="text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
              {apiError}
            </div>
          )}

          {isDirty && (
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2">
              Bạn có thay đổi chưa lưu.
            </div>
          )}

          {isCurrentInactive && (
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2">
              Sản phẩm hiện tại không còn đang bán. Bạn chỉ có thể giữ nguyên sản phẩm này hoặc
              chuyển sang sản phẩm đang hoạt động.
            </div>
          )}

          <Field label="Sản phẩm">
            {isFixedProduct ? (
              <p className="text-sm text-neutral-800 font-medium">
                {productsLoading ? "Đang tải..." : (selectedProduct?.name ?? "—")}
              </p>
            ) : (
              <select
                value={form.supplier_product}
                onChange={set("supplier_product")}
                disabled={productsLoading}
                className={inputCls(errors.supplier_product)}
              >
                <option value="">
                  {productsLoading ? "Đang tải sản phẩm..." : "Chọn sản phẩm"}
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Số thứ tự bước" required error={errors.step_order}>
              <input
                type="number"
                min="1"
                value={form.step_order}
                onChange={set("step_order")}
                className={inputCls(errors.step_order)}
              />
            </Field>
            <div className="col-span-2">
              <Field label="Tên quy trình" required error={errors.process_name}>
                <input
                  type="text"
                  value={form.process_name}
                  onChange={set("process_name")}
                  className={inputCls(errors.process_name)}
                />
              </Field>
            </div>
          </div>

          <Field label="Mô tả chi tiết" error={errors.description}>
            <textarea
              rows={4}
              value={form.description}
              onChange={set("description")}
              className={`${inputCls(errors.description)} resize-none`}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isDirty || productsLoading}
            className="px-5 py-2 bg-emerald-800 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Đang lưu..." : "Cập nhật"}
          </button>
        </div>
      </ModalBox>
    </Overlay>
  );
}
