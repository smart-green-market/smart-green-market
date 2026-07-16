import { useEffect, useMemo, useState } from "react";
import ConfirmModal from "../../common/ConfirmModal";
import {
  STOCK_CHOICE,
  getDefaultStockChoices,
  hasUnresolvedShortfall,
} from "../../../utils/buyerPreorderUtils";

export default function StockShortfallModal({
  open,
  mergedItems = [],
  submitting = false,
  onClose,
  onConfirm,
}) {
  const [choices, setChoices] = useState({});

  useEffect(() => {
    if (!open) return;
    setChoices(getDefaultStockChoices(mergedItems));
  }, [open, mergedItems]);

  const shortfallItems = useMemo(
    () => mergedItems.filter((row) => row.needsChoice),
    [mergedItems],
  );

  const unresolved = hasUnresolvedShortfall(mergedItems, choices);

  const handleChoice = (productId, value) => {
    setChoices((prev) => ({ ...prev, [String(productId)]: value }));
  };

  return (
    <ConfirmModal
      isOpen={open}
      onClose={onClose}
      onConfirm={() => onConfirm(choices)}
      title="Một số sản phẩm thiếu hoặc hết tồn"
      confirmText="Tiếp tục đặt hàng"
      cancelText="Quay lại"
      variant="warning"
      showToast={false}
      loading={submitting}
      confirmDisabled={unresolved}
      message={
        <div className="space-y-4 text-sm text-neutral-700">
          <p>
            Vui lòng chọn cách xử lý cho từng sản phẩm thiếu hoặc hết hàng. Bạn có thể
            đặt phần còn trong kho, gửi yêu cầu đặt trước, hoặc bỏ sản phẩm khỏi đơn.
          </p>

          <div className="space-y-3">
            {shortfallItems.map(({ item, stock }) => (
              <div
                key={item.id}
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <p className="font-semibold text-emerald-950">{item.name}</p>
                <p className="mt-1 text-xs text-neutral-600">
                  Yêu cầu {item.quantity} {item.unit ?? ""} • Còn{" "}
                  {stock?.availableQuantity ?? 0} • Thiếu {stock?.shortfall ?? 0}
                </p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {stock?.canOrderAvailable ? (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2">
                      <input
                        type="radio"
                        name={`stock-choice-${item.id}`}
                        checked={choices[String(item.id)] === STOCK_CHOICE.ORDER_AVAILABLE}
                        onChange={() =>
                          handleChoice(item.id, STOCK_CHOICE.ORDER_AVAILABLE)
                        }
                      />
                      <span>
                        Đặt {stock.orderAvailableQuantity} có sẵn
                      </span>
                    </label>
                  ) : null}

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2">
                    <input
                      type="radio"
                      name={`stock-choice-${item.id}`}
                      checked={choices[String(item.id)] === STOCK_CHOICE.PREORDER}
                      onChange={() => handleChoice(item.id, STOCK_CHOICE.PREORDER)}
                    />
                    <span>Đặt trước {item.quantity}</span>
                  </label>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2">
                    <input
                      type="radio"
                      name={`stock-choice-${item.id}`}
                      checked={choices[String(item.id)] === STOCK_CHOICE.REMOVE}
                      onChange={() => handleChoice(item.id, STOCK_CHOICE.REMOVE)}
                    />
                    <span>Bỏ khỏi đơn</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {unresolved ? (
            <p className="text-xs text-amber-800">
              Vui lòng chọn phương án cho từng sản phẩm thiếu hàng.
            </p>
          ) : null}
        </div>
      }
    />
  );
}
