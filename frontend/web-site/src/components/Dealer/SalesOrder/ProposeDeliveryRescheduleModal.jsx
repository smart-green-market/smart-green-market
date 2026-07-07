import { useEffect, useState } from "react";
import ConfirmModal from "../../common/ConfirmModal";

export default function ProposeDeliveryRescheduleModal({
  open,
  title = "Đề xuất đổi ngày giao",
  submitting = false,
  onClose,
  onSubmit,
}) {
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("morning");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate("");
    setSlot("morning");
    setReason("");
  }, [open]);

  const handleConfirm = async () => {
    if (!date.trim() || !reason.trim()) {
      throw new Error("Vui lòng nhập đầy đủ ngày giao và lý do.");
    }
    await onSubmit({
      proposed_delivery_date: date,
      proposed_delivery_slot: slot,
      reason: reason.trim(),
    });
  };

  return (
    <ConfirmModal
      isOpen={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={title}
      confirmText="Gửi đề xuất"
      cancelText="Hủy"
      variant="warning"
      showToast={false}
      loading={submitting}
      confirmDisabled={!date.trim() || !reason.trim()}
      message={
        <div className="space-y-4 text-sm text-neutral-700">
          <div>
            <label className="mb-1 block font-medium">Ngày giao mới</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">Khung giờ</label>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            >
              <option value="morning">Sáng (7:00 - 9:00)</option>
              <option value="afternoon">Chiều (16:00 - 19:00)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-medium">Lý do</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Hàng về trễ từ NCC..."
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </div>
        </div>
      }
    />
  );
}
