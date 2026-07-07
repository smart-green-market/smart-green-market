import { useEffect, useMemo, useState } from "react";
import ConfirmModal from "../../common/ConfirmModal";

const PREORDER_MAX_BOOKING_DAYS = 120;

function getPreorderDateBounds() {
  const today = new Date();
  const min = today.toISOString().slice(0, 10);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + PREORDER_MAX_BOOKING_DAYS - 1);
  return { min, max: maxDate.toISOString().slice(0, 10) };
}

export default function PreOrderProposeModal({
  open,
  items = [],
  submitting = false,
  onClose,
  onSubmit,
}) {
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("morning");
  const [note, setNote] = useState("");
  const [quantities, setQuantities] = useState({});
  const dateBounds = useMemo(() => getPreorderDateBounds(), [open]);

  useEffect(() => {
    if (!open) return;
    setDate("");
    setSlot("morning");
    setNote("");
    const initial = {};
    items.forEach((item) => {
      initial[String(item.id)] = item.requested_quantity ?? item.requestedQuantity ?? 1;
    });
    setQuantities(initial);
  }, [open, items]);

  const handleConfirm = async () => {
    const itemQuantities = {};
    items.forEach((item) => {
      itemQuantities[String(item.id)] = Number(quantities[String(item.id)] ?? 0);
    });
    await onSubmit({
      proposed_delivery_date: date || undefined,
      proposed_delivery_slot: date ? slot : undefined,
      item_quantities: itemQuantities,
      note: note.trim(),
    });
  };

  const hasQuantityChange = items.some((item) => {
    const current = Number(quantities[String(item.id)] ?? 0);
    const requested = Number(item.requested_quantity ?? item.requestedQuantity ?? 0);
    return current > 0 && current !== requested;
  });

  return (
    <ConfirmModal
      isOpen={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Đề xuất điều chỉnh YC đặt trước"
      confirmText="Gửi đề xuất"
      cancelText="Hủy"
      variant="warning"
      showToast={false}
      loading={submitting}
      confirmDisabled={!(hasQuantityChange || date.trim())}
      message={
        <div className="space-y-4 text-sm text-neutral-700">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-stone-200 px-3 py-2">
              <p className="font-medium text-emerald-950">
                {item.product_title ?? item.productTitle}
              </p>
              <label className="mt-2 block text-xs text-neutral-500">
                Số lượng đề xuất (yêu cầu {item.requested_quantity ?? item.requestedQuantity})
              </label>
              <input
                type="number"
                min={1}
                value={quantities[String(item.id)] ?? ""}
                onChange={(e) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [String(item.id)]: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block font-medium">Ngày giao mới (tùy chọn)</label>
            <input
              type="date"
              min={dateBounds.min}
              max={dateBounds.max}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Có thể chọn trong vòng {PREORDER_MAX_BOOKING_DAYS} ngày kể từ hôm nay.
            </p>
          </div>
          {date ? (
            <div>
              <label className="mb-1 block font-medium">Khung giờ</label>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              >
                <option value="morning">Sáng</option>
                <option value="afternoon">Chiều</option>
              </select>
            </div>
          ) : null}
          <div>
            <label className="mb-1 block font-medium">Ghi chú</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </div>
        </div>
      }
    />
  );
}
