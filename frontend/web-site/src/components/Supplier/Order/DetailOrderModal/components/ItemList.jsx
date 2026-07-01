import { useState } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";
import ItemRow, { ItemTableHeader } from "./ItemRow";

/* ─── Danh sách item — gom các thay đổi số lượng lại, chỉ gọi API 1 lần khi bấm "Cập nhật" ─── */
export default function ItemList({
  items,
  canEdit,
  statusOrder,
  onApprove,         // (itemId) => void
  onReject,          // (itemId) => void
  onReset,           // (itemId) => void
  onSaveQuantities,  // async (changes: { id, quantity }[]) => void — gọi API 1 lần cho tất cả thay đổi
}) {
  const [pending, setPending] = useState({}); // { [itemId]: newQty }
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const pendingCount = Object.keys(pending).length;

  const handleQuantityChange = (id, qty) => {
    setPending((prev) => ({ ...prev, [id]: qty }));
    setError("");
  };

  const handleDiscardAll = () => {
    setPending({});
    setError("");
  };

  const handleSaveAll = async () => {
    if (pendingCount === 0) return;
    const changes = Object.entries(pending).map(([id, quantity]) => ({ id, quantity }));
    setSaving(true);
    setError("");
    try {
      await onSaveQuantities(changes);
      setPending({});
    } catch {
      setError("Lưu thất bại, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <div className="border border-neutral-100 rounded-xl overflow-hidden">
        <ItemTableHeader canEdit={canEdit} />
        {items.map((item) => {
          const hasPending = item.id in pending;
          // Hiện số lượng đang chờ lưu (nếu có) thay cho số lượng gốc từ server
          const displayItem = hasPending ? { ...item, quantity: pending[item.id] } : item;
          return (
            <ItemRow
              key={item.id}
              item={displayItem}
              canEdit={canEdit}
              statusOrder={statusOrder}
              isDirty={hasPending}
              onApprove={() => onApprove(item.id)}
              onReject={() => onReject(item.id)}
              onReset={() => onReset(item.id)}
              onQuantityChange={handleQuantityChange}
            />
          );
        })}
      </div>

      {/* Thanh "Cập nhật" — chỉ hiện khi có ít nhất 1 item đang chờ lưu */}
      {pendingCount > 0 && (
        <div className="sticky bottom-4 mt-3 z-10">
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-amber-200 rounded-xl shadow-lg shadow-amber-900/5">
            <p className="text-sm font-medium text-amber-700">
              {pendingCount} sản phẩm đã đổi số lượng, chưa áp dụng
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscardAll}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Hủy hết
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {saving
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Save className="w-3.5 h-3.5" />
                }
                {saving ? "Đang áp dụng..." : `Áp dụng (${pendingCount})`}
              </button>
            </div>
          </div>
          {error && <p className="mt-1.5 text-xs text-red-500 text-right">{error}</p>}
        </div>
      )}
    </div>
  );
}