import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { quantityDiscountService } from "../../../services/api/quantityDiscountService";
import {
  QUANTITY_DISCOUNT_SCOPE_LABELS,
  formatQuantityDiscountApiError,
  formatTierLabel,
} from "../../../utils/quantityDiscountUtils";

export default function QuantityDiscountDetailModal({ isOpen, policyId, onClose }) {
  const [policy, setPolicy] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !policyId) return;
    setIsLoading(true);
    quantityDiscountService
      .getById(policyId)
      .then(setPolicy)
      .catch((error) => console.error(formatQuantityDiscountApiError(error)))
      .finally(() => setIsLoading(false));
  }, [isOpen, policyId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-bold">Chi tiết chính sách</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-neutral-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {isLoading ? (
            <p className="text-neutral-400 text-sm">Đang tải...</p>
          ) : policy ? (
            <>
              <div>
                <p className="text-xs text-neutral-400 uppercase">Tên</p>
                <p className="font-semibold">{policy.title}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 uppercase">Phạm vi</p>
                <p>{QUANTITY_DISCOUNT_SCOPE_LABELS[policy.scope]}</p>
                {policy.category_name && <p className="text-sm text-neutral-500">{policy.category_name}</p>}
                {policy.supplier_product_name && <p className="text-sm text-neutral-500">{policy.supplier_product_name}</p>}
              </div>
              <div>
                <p className="text-xs text-neutral-400 uppercase mb-2">Bậc giảm</p>
                <ul className="space-y-2">
                  {(policy.tiers || []).map((tier) => (
                    <li key={tier.id} className="text-sm bg-emerald-50 text-emerald-800 px-3 py-2 rounded-lg">
                      {formatTierLabel(tier)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-neutral-400 uppercase">Trạng thái</p>
                <p>{policy.is_active ? "Đang hoạt động" : "Đã tắt"}</p>
              </div>
            </>
          ) : (
            <p className="text-red-500 text-sm">Không tải được dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  );
}
