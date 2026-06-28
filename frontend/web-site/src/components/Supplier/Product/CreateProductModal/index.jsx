import { useState, useEffect } from "react";
import { X } from "lucide-react";

import { productService } from "../../../../services/api/productService";
import {
  parseSupplierApiErrors,
  validateProductForm,
  errorsToSummary,
  extractSupplierApiMessage,
} from "../../../../utils/supplierValidation";
import ConfirmModal from "../../../common/ConfirmModal";

import { useProductModalData } from "./hooks/useProductModalData";
import { getModeTokens, inputCls, selectCls, DEFAULT_FORM } from "./constants";

import ModalHeader        from "./components/ModalHeader";
import ModalFooter        from "./components/ModalFooter";
import BasicInfoSection   from "./components/BasicInfoSection";
import ProductionSection  from "./components/ProductionSection";
import StorageTempSection from "./components/StorageTempSection";
import ImageUploadPanel   from "./components/ImageUploadPanel";
import SidePanel          from "./components/SidePanel";

/**
 * Props:
 *   isOpen    : boolean
 *   onClose   : () => void
 *   onSuccess : (createdProduct) => void
 *   mode      : "catalog" | "personal"
 */
export default function CreateProductModal({ isOpen, onClose, onSuccess, mode = "catalog" }) {
  const isPersonal = mode === "personal";

  // ── Form state ───────────────────────────────────────────────
  const [form, setForm]                 = useState(DEFAULT_FORM);
  const [images, setImages]             = useState([]);
  const [thumbnailIdx, setThumbnailIdx] = useState(0);
  const [saving, setSaving]             = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [error, setError]               = useState(null);
  const [fieldErrors, setFieldErrors]   = useState({});

  // product master selection
  const [selectedProductId, setSelectedProductId]           = useState("");
  const [selectedSystemCategoryId, setSelectedSystemCategoryId] = useState("");

  // ── Reset khi modal mở / đổi mode ───────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setForm(DEFAULT_FORM);
    setImages([]);
    setThumbnailIdx(0);
    setError(null);
    setFieldErrors({});
    setSelectedProductId("");
    setSelectedSystemCategoryId("");
  }, [isOpen, mode]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose, saving]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => { images.forEach((img) => URL.revokeObjectURL(img.preview)); };
  }, [images]);

  // ── Data fetching via hook ───────────────────────────────────
  const { categories, systemCategories, products, loadingProducts, loadingSellingIds } =
    useProductModalData({
      isOpen,
      isPersonal,
      categoryId: form.category,
      systemCategoryId: selectedSystemCategoryId,
      selectedProductId,
      onProductsLoaded: (available, personal, prevId) => {
        if (personal) {
          setSelectedProductId("");
          return;
        }
        // catalog: auto-select first available
        if (available.length > 0) {
          const stillExists = available.some((p) => String(p.id) === prevId);
          if (stillExists) {
            const picked = available.find((p) => String(p.id) === prevId);
            setForm((f) => ({ ...f, name: picked.name }));
          } else {
            setSelectedProductId(String(available[0].id));
            setForm((f) => ({ ...f, name: available[0].name }));
          }
        } else {
          setSelectedProductId("");
          setForm((f) => ({ ...f, name: "" }));
        }
      },
    });

  if (!isOpen) return null;

  // ── Form field helpers ───────────────────────────────────────
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((e) => ({ ...e, [k]: "" }));
    if (error) setError(null);
  };

  const setPositiveNumber = (k, rawVal) =>
    set(k, rawVal.replace(/[^0-9.]/g, ""));

  const setPositiveInteger = (k, rawVal) =>
    set(k, rawVal.replace(/[^0-9]/g, ""));

  const setTemperature = (k, rawVal) =>
    set(k, rawVal.replace(/[^0-9.\-]/g, "").replace(/(?!^)-/g, ""));

  // ── Image handlers ───────────────────────────────────────────
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const toAdd = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...toAdd].slice(0, 5));
  };

  const removeImage = (idx) => {
    URL.revokeObjectURL(images[idx].preview);
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (thumbnailIdx >= next.length) setThumbnailIdx(Math.max(0, next.length - 1));
      return next;
    });
  };

  // ── Select product handler (catalog mode) ────────────────────
  const handleSelectProduct = (id) => {
    setSelectedProductId(id);
    const picked = products.find((p) => String(p.id) === id);
    if (picked) {
      set("name", picked.name);
      if (picked.category) {
        const catId = picked.category.id ?? picked.category;
        if (catId) set("category", String(catId));
      }
    }
  };

  // ── Validate & mở confirm ────────────────────────────────────
  const handleRequestSubmit = () => {
    setError(null);
    const newErrors = {};

    if (!form.category) newErrors.category = "Vui lòng chọn danh mục.";
    if (!isPersonal && !selectedProductId)
      newErrors.product_master = "Vui lòng chọn sản phẩm từ danh mục.";
    if (isPersonal && !form.name.trim())
      newErrors.name = "Vui lòng nhập tên sản phẩm.";

    const price    = parseFloat(form.wholesale_price);
    const capacity = parseFloat(form.daily_production_capacity);
    if (!form.wholesale_price || isNaN(price) || price <= 0)
      newErrors.wholesale_price = "Giá sỉ phải là số dương lớn hơn 0.";
    if (!form.daily_production_capacity || isNaN(capacity) || capacity <= 0)
      newErrors.daily_production_capacity = "Năng suất phải là số dương lớn hơn 0.";

    const allErrs = { ...validateProductForm(form), ...newErrors };
    if (Object.keys(allErrs).length) {
      setFieldErrors(allErrs);
      setError(errorsToSummary(allErrs) || "Vui lòng kiểm tra lại các trường bắt buộc.");
      return;
    }

    setShowConfirm(true);
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);

    // Guard (second validation pass)
    if (!form.category) { setError("Vui lòng chọn danh mục."); return; }
    if (!isPersonal && !selectedProductId) { setError("Vui lòng chọn sản phẩm từ danh mục."); return; }
    if (isPersonal && !form.name.trim()) { setError("Vui lòng nhập tên sản phẩm."); return; }

    const price    = parseFloat(form.wholesale_price);
    const capacity = parseFloat(form.daily_production_capacity);
    const inlineErrors = {};

    if (!form.wholesale_price || isNaN(price) || price <= 0)
      inlineErrors.wholesale_price = "Giá sỉ phải là số dương lớn hơn 0.";
    if (!form.daily_production_capacity || isNaN(capacity) || capacity <= 0)
      inlineErrors.daily_production_capacity = "Năng suất phải là số dương lớn hơn 0.";
    if (form.storage_duration_days !== "") {
      const days = parseInt(form.storage_duration_days, 10);
      if (isNaN(days) || days < 0)
        inlineErrors.storage_duration_days = "Thời hạn bảo quản phải là số nguyên không âm.";
    }
    if (form.min_storage_temp !== "" && form.max_storage_temp !== "") {
      const minT = parseFloat(form.min_storage_temp);
      const maxT = parseFloat(form.max_storage_temp);
      if (!isNaN(minT) && !isNaN(maxT) && minT > maxT)
        inlineErrors.max_storage_temp = "Nhiệt độ tối đa phải lớn hơn hoặc bằng nhiệt độ tối thiểu.";
    }

    const allErrs = { ...validateProductForm(form), ...inlineErrors };
    if (Object.keys(allErrs).length) {
      setFieldErrors(allErrs);
      setError(errorsToSummary(allErrs) || "Vui lòng kiểm tra lại các trường có lỗi.");
      return;
    }

    setFieldErrors({});
    setSaving(true);

    try {
      const payload = {
        category:                   parseInt(form.category, 10),
        unit:                       form.unit,
        wholesale_price:            form.wholesale_price,
        daily_production_capacity:  form.daily_production_capacity,
      };

      if (form.description.trim())       payload.description           = form.description.trim();
      if (form.storage_duration_days !== "") payload.storage_duration_days = parseInt(form.storage_duration_days, 10);
      if (form.min_storage_temp !== "")  payload.min_storage_temp      = parseFloat(form.min_storage_temp);
      if (form.max_storage_temp !== "")  payload.max_storage_temp      = parseFloat(form.max_storage_temp);

      if (isPersonal) {
        payload.name = form.name.trim();
        if (selectedProductId) payload.product_master = parseInt(selectedProductId, 10);
      } else {
        payload.product_master = parseInt(selectedProductId, 10);
      }

      console.log("[CreateProductModal] payload:", JSON.stringify(payload, null, 2));

      const newProduct = await productService.addProduct(payload);
      const productId  = newProduct?.id;
      if (!productId) throw new Error("Không lấy được ID sản phẩm vừa tạo.");

      if (images.length > 0) {
        await Promise.all(
          images.map((img, index) => {
            const fd = new FormData();
            fd.append("supplier_product", productId);
            fd.append("images",           img.file, img.file.name);
            fd.append("is_thumbnail",     index === thumbnailIdx ? "true" : "false");
            fd.append("sort_order",       index);
            return productService.addImageProduct(fd);
          })
        );
      }

      onSuccess?.(newProduct);
      onClose();
    } catch (err) {
      console.error("[CreateProductModal] error:", err?.response?.status, err?.response?.data);
      const parsed = parseSupplierApiErrors(err?.response?.data, {
        fallback: "Lưu sản phẩm thất bại. Vui lòng kiểm tra lại thông tin.",
      });
      if (Object.keys(parsed.fieldErrors).length) setFieldErrors(parsed.fieldErrors);
      setError(
        parsed.general ||
        parsed.summary ||
        extractSupplierApiMessage(err) ||
        err?.message ||
        "Lỗi không xác định, vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  // ── UI tokens ────────────────────────────────────────────────
  const { headerColor, accentColor, ringColor, btnColor, tipBg, tipText, tipTitle } =
    getModeTokens(isPersonal);

  const inputClsMode  = inputCls.replace("focus:ring-green-600", ringColor);
  const selectClsMode = selectCls.replace("focus:ring-green-600", ringColor);

  // Shared props cho các section
  const sharedFieldProps = { form, set, fieldErrors, saving, inputClsMode, selectClsMode, accentColor };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          onClick={() => !saving && onClose()}
        />

        <div
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ animation: "modalIn 0.18s ease-out both", maxHeight: "92vh" }}
        >
          {/* Header */}
          <ModalHeader
            isPersonal={isPersonal}
            headerColor={headerColor}
            saving={saving}
            onClose={onClose}
          />

          <div className="h-px bg-neutral-100 mx-6 flex-shrink-0" />

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            {/* Error banner */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 flex items-start gap-2">
                <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-[1fr_236px] gap-4">
              {/* Cột trái */}
              <div className="flex flex-col gap-4">
                <BasicInfoSection
                  {...sharedFieldProps}
                  isPersonal={isPersonal}
                  categories={categories}
                  products={products}
                  systemCategories={systemCategories}
                  loadingProducts={loadingProducts}
                  loadingSellingIds={loadingSellingIds}
                  selectedProductId={selectedProductId}
                  selectedSystemCategoryId={selectedSystemCategoryId}
                  onSelectProduct={handleSelectProduct}
                  onSelectSystemCategory={(id) => {
                    setSelectedSystemCategoryId(id);
                    setSelectedProductId("");
                  }}
                  setFieldErrors={setFieldErrors}
                />

                <ProductionSection
                  {...sharedFieldProps}
                  isPersonal={isPersonal}
                  setPositiveNumber={setPositiveNumber}
                  setPositiveInteger={setPositiveInteger}
                />

                <StorageTempSection
                  {...sharedFieldProps}
                  setTemperature={setTemperature}
                />
              </div>

              {/* Cột phải */}
              <div className="flex flex-col gap-3">
                <ImageUploadPanel
                  images={images}
                  thumbnailIdx={thumbnailIdx}
                  saving={saving}
                  accentColor={accentColor}
                  onUpload={handleImageUpload}
                  onRemove={removeImage}
                  onSetThumbnail={setThumbnailIdx}
                />

                <SidePanel
                  isPersonal={isPersonal}
                  accentColor={accentColor}
                  tipBg={tipBg}
                  tipText={tipText}
                  tipTitle={tipTitle}
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-neutral-100 mx-6 flex-shrink-0" />

          {/* Footer */}
          <ModalFooter
            saving={saving}
            loadingSellingIds={loadingSellingIds}
            btnColor={btnColor}
            onClose={onClose}
            onSubmit={handleRequestSubmit}
          />
        </div>

        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.96) translateY(10px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
        `}</style>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        title={isPersonal ? "Xác nhận thêm sản phẩm cá nhân" : "Xác nhận thêm sản phẩm"}
        message={
          isPersonal
            ? `Sản phẩm "${form.name}" sẽ được gửi lên để admin xét duyệt. Bạn có chắc chắn muốn tiếp tục?`
            : "Sản phẩm sẽ được thêm vào danh sách chờ duyệt. Bạn có chắc chắn muốn tiếp tục?"
        }
        confirmText="Xác nhận lưu"
        cancelText="Kiểm tra lại"
        variant="warning"
        successMessage="Thêm sản phẩm thành công! Vui lòng chờ admin phê duyệt."
        errorMessage="Thêm sản phẩm thất bại. Vui lòng thử lại."
      />
    </>
  );
}
