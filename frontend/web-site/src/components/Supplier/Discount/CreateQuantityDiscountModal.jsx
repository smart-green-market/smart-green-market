import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { categoryService } from "../../../services/api/categoryService";
import { productService } from "../../../services/api/productService";
import { quantityDiscountService } from "../../../services/api/quantityDiscountService";
import { formatQuantityDiscountApiError } from "../../../utils/quantityDiscountUtils";
import {
  INITIAL_QUANTITY_DISCOUNT_FORM,
  buildQuantityDiscountPayload,
  handleQuantityScopeChange,
  validateQuantityDiscountForm,
} from "./quantityDiscountPolicyUtils";

function TierEditor({ tiers, onChange }) {
  const updateTier = (index, field, value) => {
    const next = tiers.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier));
    onChange(next);
  };

  const addTier = () => {
    onChange([...tiers, { min_quantity: "", discount_type: "percent", discount_value: "" }]);
  };

  const removeTier = (index) => {
    if (tiers.length <= 1) return;
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {tiers.map((tier, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-end bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
          <div className="col-span-4">
            <label className="text-xs font-medium text-neutral-600">Từ số lượng</label>
            <input
              type="number"
              min="1"
              value={tier.min_quantity}
              onChange={(e) => updateTier(index, "min_quantity", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
              placeholder="VD: 100"
            />
          </div>
          <div className="col-span-3">
            <label className="text-xs font-medium text-neutral-600">Loại</label>
            <select
              value={tier.discount_type}
              onChange={(e) => updateTier(index, "discount_type", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white"
            >
              <option value="percent">%</option>
              <option value="fixed">Số tiền</option>
            </select>
          </div>
          <div className="col-span-4">
            <label className="text-xs font-medium text-neutral-600">Mức giảm</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tier.discount_value}
              onChange={(e) => updateTier(index, "discount_value", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
              placeholder={tier.discount_type === "percent" ? "10" : "5000"}
            />
          </div>
          <div className="col-span-1 flex justify-end">
            <button
              type="button"
              onClick={() => removeTier(index)}
              disabled={tiers.length <= 1}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addTier}
        className="flex items-center gap-1 text-sm text-emerald-700 font-medium hover:underline"
      >
        <Plus className="w-4 h-4" /> Thêm bậc giảm
      </button>
    </div>
  );
}

export default function CreateQuantityDiscountModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState(INITIAL_QUANTITY_DISCOUNT_FORM);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(INITIAL_QUANTITY_DISCOUNT_FORM);
    categoryService.getAll({ limit: 100, status: "active" }).then((data) => {
      setCategories(Array.isArray(data) ? data : data?.results || []);
    }).catch(() => setCategories([]));
    productService.getAll({ limit: 100 }).then((data) => {
      setProducts(Array.isArray(data) ? data : data?.results || []);
    }).catch(() => setProducts([]));
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateQuantityDiscountForm(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      setIsSubmitting(true);
      await quantityDiscountService.create(buildQuantityDiscountPayload(formData));
      toast.success("Tạo chính sách thành công");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(formatQuantityDiscountApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold">Tạo chính sách giảm theo số lượng</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-neutral-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold">Tên chính sách *</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                className="w-full mt-1 px-4 py-2 border rounded-xl text-sm"
                placeholder="VD: Ưu đãi đặt số lượng lớn"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Phạm vi</label>
                <select
                  value={formData.scope}
                  onChange={(e) => setFormData((p) => handleQuantityScopeChange(p, e.target.value))}
                  className="w-full mt-1 px-4 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="all">Tất cả sản phẩm</option>
                  <option value="category">Theo danh mục</option>
                  <option value="supplier_product">Sản phẩm cụ thể</option>
                </select>
              </div>
              {formData.scope === "category" && (
                <div>
                  <label className="text-sm font-semibold">Danh mục *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    className="w-full mt-1 px-4 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="">-- Chọn --</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {formData.scope === "supplier_product" && (
                <div>
                  <label className="text-sm font-semibold">Sản phẩm *</label>
                  <select
                    value={formData.supplier_product}
                    onChange={(e) => setFormData((p) => ({ ...p, supplier_product: e.target.value }))}
                    className="w-full mt-1 px-4 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="">-- Chọn --</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Các bậc giảm giá *</label>
              <p className="text-xs text-neutral-500 mb-3">VD: đặt từ 100 đơn vị → giảm 10%</p>
              <TierEditor
                tiers={formData.tiers}
                onChange={(tiers) => setFormData((p) => ({ ...p, tiers }))}
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
              />
              Kích hoạt ngay
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-xl">Hủy</button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm bg-emerald-700 text-white rounded-xl disabled:opacity-50"
              >
                {isSubmitting ? <ButtonSpinner label="Đang lưu..." /> : "Tạo chính sách"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
