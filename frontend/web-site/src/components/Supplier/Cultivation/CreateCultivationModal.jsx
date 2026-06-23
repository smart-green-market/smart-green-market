import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { farmingProcessService } from "../../../services/api/cultivationService";
import { productService } from "../../../services/api/productService";
import {
  getActiveProducts,
  parseFieldErrors,
  parseProductList,
  validateCultivationForm,
  handleApiError,
} from "./cultivationUtils";
import { errorsToSummary } from "../../../utils/supplierValidation";

const EMPTY = { supplier_product: "", step_order: "", process_name: "", description: "" };

export default function CreateCultivationModal({ isOpen, onClose, onSuccess, productId }) {
  const isFixedProduct = productId != null && productId !== "";
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...EMPTY,
        supplier_product: isFixedProduct ? String(productId) : "",
      });
      setErrors({});
      setApiError("");
    }
  }, [isOpen, productId, isFixedProduct]);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchProducts() {
      setProductsLoading(true);
      try {
        if (isFixedProduct) {
          const product = await productService.getById(productId);
          setProducts(product ? [product] : []);
        } else {
          const res = await productService.getAll();
          setProducts(getActiveProducts(parseProductList(res)));
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
  }, [isOpen, productId, isFixedProduct]);

  const activeProductIds = useMemo(() => {
    const ids = getActiveProducts(products).map((p) => Number(p.id));
    if (isFixedProduct) {
      const pid = Number(productId);
      if (!ids.includes(pid)) ids.push(pid);
    }
    return ids;
  }, [products, isFixedProduct, productId]);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(form.supplier_product)),
    [products, form.supplier_product],
  );

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    setApiError("");
    const errs = validateCultivationForm(form, { activeProductIds });
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
      await farmingProcessService.create(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      const apiErrors = err?.response?.data ?? err;
      const { fieldErrors, general } = parseFieldErrors(apiErrors);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      setApiError(general || handleApiError(err, "Tạo quy trình thất bại. Vui lòng thử lại!"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClose={onClose}>
      <ModalBox>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Thêm quy trình canh tác</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isFixedProduct
                ? "Thêm bước quy trình cho sản phẩm đang xem"
                : "Chỉ thêm quy trình cho sản phẩm đang được bán"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <X size={18} className="text-neutral-500" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
          {apiError && <ApiErrorBanner message={apiError} />}

          {!productsLoading && products.length === 0 && (
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2">
              Không có sản phẩm đang hoạt động. Vui lòng niêm yết sản phẩm trước khi thêm quy trình.
            </div>
          )}

          <Field label="Sản phẩm" required error={errors.supplier_product}>
            {isFixedProduct ? (
              <input
                type="text"
                value={productsLoading ? "Đang tải sản phẩm..." : (selectedProduct?.name ?? "—")}
                readOnly
                className={inputCls(errors.supplier_product)}
              />
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
                placeholder="VD: 1"
                className={inputCls(errors.step_order)}
              />
            </Field>
            <div className="col-span-2">
              <Field label="Tên quy trình" required error={errors.process_name}>
                <input
                  type="text"
                  value={form.process_name}
                  onChange={set("process_name")}
                  placeholder="VD: Chuẩn bị đất, Gieo hạt..."
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
              placeholder="Mô tả chi tiết các thao tác trong bước này..."
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
            disabled={loading || productsLoading || products.length === 0}
            className="px-5 py-2 bg-emerald-800 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "Đang lưu..." : "Lưu quy trình"}
          </button>
        </div>
      </ModalBox>
    </Overlay>
  );
}

function ApiErrorBanner({ message }) {
  return (
    <div className="text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
      {message}
    </div>
  );
}

export function Overlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

export function ModalBox({ children }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
      {children}
    </div>
  );
}

export function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export const inputCls = (err) =>
  `w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${
    err
      ? "border-red-400 focus:border-red-500"
      : "border-neutral-200 focus:border-emerald-600"
  }`;
