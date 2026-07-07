import React, { useState, useEffect } from "react";
import { ButtonSpinner } from "../UI/SupplierSpinner";
import { X, Tag } from "lucide-react";
import { toast } from "sonner";
import { categoryService } from "../../../services/api/categoryService";
import { productService } from "../../../services/api/productService";
import { quantityDiscountService } from "../../../services/api/quantityDiscountService";
import { formatQuantityDiscountApiError } from "../../../utils/quantityDiscountUtils";
import {
  buildQuantityDiscountPayload,
  handleQuantityScopeChange,
  mapPolicyToFormData,
  validateQuantityDiscountForm,
} from "./quantityDiscountPolicyUtils";

export default function EditQuantityDiscountModal({ isOpen, policyId, onClose, onSuccess }) {
  const [formData, setFormData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !policyId) return;
    setIsLoading(true);
    Promise.all([
      quantityDiscountService.getById(policyId),
      categoryService.getAll({ limit: 100, status: "active" }),
      productService.getAll({ limit: 100 }),
    ])
      .then(([policy, catData, prodData]) => {
        setFormData(mapPolicyToFormData(policy));
        setCategories(Array.isArray(catData) ? catData : catData?.results || []);
        setProducts(Array.isArray(prodData) ? prodData : prodData?.results || []);
      })
      .catch((error) => toast.error(formatQuantityDiscountApiError(error)))
      .finally(() => setIsLoading(false));
  }, [isOpen, policyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateQuantityDiscountForm(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      setIsSubmitting(true);
      await quantityDiscountService.update(policyId, buildQuantityDiscountPayload(formData));
      toast.success("Cập nhật thành công");
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
            <h2 className="text-lg font-bold">Sửa chính sách giảm theo số lượng</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-neutral-400" /></button>
        </div>

        {isLoading || !formData ? (
          <PageSpinner />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold">Tên chính sách *</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full mt-1 px-4 py-2 border rounded-xl text-sm"
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
                <TierRows tiers={formData.tiers} onChange={(tiers) => setFormData((p) => ({ ...p, tiers }))} />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                />
                Đang kích hoạt
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-xl">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-emerald-700 text-white rounded-xl disabled:opacity-50">
                  {isSubmitting ? <ButtonSpinner label="Đang lưu..." /> : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function TierRows({ tiers, onChange }) {
  const updateTier = (index, field, value) => {
    onChange(tiers.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier)));
  };
  return (
    <div className="space-y-2">
      {tiers.map((tier, index) => (
        <div key={index} className="grid grid-cols-3 gap-2">
          <input
            type="number"
            value={tier.min_quantity}
            onChange={(e) => updateTier(index, "min_quantity", e.target.value)}
            placeholder="Từ SL"
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <select
            value={tier.discount_type}
            onChange={(e) => updateTier(index, "discount_type", e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="percent">%</option>
            <option value="fixed">Số tiền</option>
          </select>
          <input
            type="number"
            value={tier.discount_value}
            onChange={(e) => updateTier(index, "discount_value", e.target.value)}
            placeholder="Mức giảm"
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      ))}
    </div>
  );
}
