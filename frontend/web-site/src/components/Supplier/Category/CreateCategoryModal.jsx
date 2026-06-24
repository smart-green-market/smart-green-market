import { useState } from "react";
import { categoryService } from "../../../services/api/categoryService";
import {
  parseSupplierApiErrors,
  validateCategoryForm,
  errorsToSummary,
  extractSupplierApiMessage,
} from "../../../utils/supplierValidation";

// ================================================================
// INITIAL STATE
// ================================================================
const INITIAL_FORM = {
  name: "",
  description: "",
  sort_order: 0,
};

// ================================================================
// AddCategoryModal
// Props:
//   onClose   — () => void
//   onSuccess — (newCategory) => void
// ================================================================
export default function AddCategoryModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleField = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const handleSubmit = async () => {
    setApiError("");
    const errs = validateCategoryForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setApiError(errorsToSummary(errs));
      return;
    }

    // Payload đúng theo API spec
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      sort_order: Number(form.sort_order),
    };

    try {
      setSubmitting(true);
      const newCategory = await categoryService.create(payload);
      onSuccess?.(newCategory);
      onClose();
    } catch (err) {
      const { fieldErrors, general, summary } = parseSupplierApiErrors(err?.response?.data, {
        fallback: "Thêm danh mục thất bại. Vui lòng kiểm tra lại thông tin.",
      });
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      setApiError(general || summary || extractSupplierApiMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  // ---- RENDER ----
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={handleBackdrop}
    >
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden">

        {/* ---- Header ---- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Thêm danh mục</h3>
              <p className="text-xs text-gray-400 mt-0.5">Tạo danh mục sản phẩm mới</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ---- Body ---- */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* API error banner */}
          {apiError && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {apiError}
            </div>
          )}

          {/* Tên danh mục */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Tên danh mục <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleField("name", e.target.value)}
              placeholder="Ví dụ: Rau củ quả"
              disabled={submitting}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-all outline-none
                focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400
                disabled:bg-gray-50 disabled:text-gray-400
                ${errors.name ? "border-red-300 bg-red-50" : "border-gray-200"}`}
            />
            {errors.name && <FieldError msg={errors.name} />}
          </div>

          {/* Mô tả */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Mô tả
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleField("description", e.target.value)}
              placeholder="Mô tả ngắn về danh mục này..."
              rows={3}
              disabled={submitting}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm transition-all outline-none resize-none
                focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400
                disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Thứ tự sắp xếp */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Thứ tự sắp xếp <span className="text-red-400">*</span>
              <span className="ml-1.5 font-normal text-gray-300 normal-case tracking-normal">
                (số càng nhỏ hiện trước)
              </span>
            </label>
            <input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => handleField("sort_order", e.target.value)}
              placeholder="0"
              disabled={submitting}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-all outline-none
                focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400
                disabled:bg-gray-50 disabled:text-gray-400
                ${errors.sort_order ? "border-red-300 bg-red-50" : "border-gray-200"}`}
            />
            {errors.sort_order && <FieldError msg={errors.sort_order} />}
          </div>

        </div>

        {/* ---- Footer ---- */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600
              hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ flex: 2 }}
            className={`px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-all
              flex items-center justify-center gap-2
              ${submitting ? "bg-[#52B788] cursor-not-allowed" : "bg-[#2D6A4F] hover:bg-[#1B4332]"}`}
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang lưu...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm danh mục
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

// ---- helper nhỏ để render error dưới field ----
function FieldError({ msg }) {
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  );
}