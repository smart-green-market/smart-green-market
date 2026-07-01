import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { fmtPrice } from "../utils";

/* ─── Table header — dùng 1 lần bên ngoài, trên danh sách ─── */
export function ItemTableHeader({ canEdit }) {
  return (
    <div className={`grid gap-3 px-5 py-2.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wide bg-neutral-50 border-b border-neutral-100 ${
      canEdit
        ? "grid-cols-[40px_1fr_90px_100px_110px_90px]"
        : "grid-cols-[40px_1fr_90px_100px_110px]"
    }`}>
      <div />
      <div>Sản phẩm</div>
      <div className="text-right pr-3">Đơn giá</div>
      <div className="text-center">Số lượng</div>
      <div className="text-right">Thành tiền</div>
      {canEdit && <div className="text-center">Thao tác</div>}
    </div>
  );
}

/* ─── Item row ─── */
export default function ItemRow({
  item,
  canEdit,
  onApprove,
  onReject,
  onReset,
  statusOrder,
  isDirty = false,        // true nếu số lượng đã sửa local nhưng chưa lưu lên server
  onQuantityChange,       // (itemId, newQty) => void — chỉ cập nhật state ở cha, KHÔNG gọi API ở đây
}) {
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState("");
  const [saveErr, setSaveErr]   = useState("");
  const inputRef                = useRef(null);

  useEffect(() => {
    if (editing) {
      setDraft(String(item.quantity ?? ""));
      setSaveErr("");
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, item.quantity]);

  const commitEdit = () => {
    const parsed = parseFloat(draft);
    if (isNaN(parsed) || parsed <= 0) {
      setSaveErr("Số lượng không hợp lệ");
      return;
    }
    setEditing(false);
    if (parsed === parseFloat(item.quantity)) return;
    // Không gọi API ở đây — chỉ báo lên cha để đánh dấu "chưa lưu".
    // Cha gom các thay đổi lại, gọi API một lần khi bấm nút "Cập nhật".
    onQuantityChange?.(item.id, parsed);
  };

  const cancelEdit = () => { setEditing(false); setSaveErr(""); };

  // Subtotal tính lại từ draft nếu đang edit
  const displayQty      = editing ? (parseFloat(draft) || 0) : Number(item.quantity);
  const displaySubtotal = displayQty * Number(item.unit_price);

  const isApproved = item.item_status === "approved";
  const isRejected = item.item_status === "rejected";

  // Màu nền row
  const rowBg = isRejected ? "bg-red-50/50" : isApproved ? "bg-emerald-50/30" : isDirty ? "bg-amber-50/40" : "bg-white";

  return (
    <div className={`${rowBg} border-b border-neutral-100 last:border-0 transition-colors`}>
      <div className={`grid gap-3 items-center px-5 py-3 ${
        canEdit
          ? "grid-cols-[40px_1fr_90px_100px_110px_90px]"
          : "grid-cols-[40px_1fr_90px_100px_110px]"
      }`}>

        {/* Thumbnail */}
        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
          {item.product_thumbnail_url
            ? <img src={item.product_thumbnail_url} alt={item.product_name} className="w-full h-full object-cover" />
            : <span className="text-base">🥬</span>
          }
        </div>

        {/* Tên + ghi chú */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</p>
          {item.note && (
            <p className="text-xs text-neutral-400 italic truncate mt-0.5">{item.note}</p>
          )}
          {isRejected && (item.reject_reason || item.rejection_reason) && (
            <p className="text-xs text-red-600 mt-0.5 line-clamp-2">
              Lý do: {item.reject_reason || item.rejection_reason}
            </p>
          )}
          {/* Badge trạng thái khi không canEdit */}
          {!canEdit && (
            <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              isApproved ? "bg-emerald-100 text-emerald-700" :
              isRejected ? "bg-red-100 text-red-600" :
              statusOrder !== "pending" ? "bg-emerald-100 text-emerald-700" : "text-neutral-400"
            }`}>
              {isApproved ? "✓ Đã duyệt" :
               isRejected ? "✗ Từ chối" :
               statusOrder !== "pending" ? "✓ Đã duyệt" : ""}
            </span>
          )}
        </div>

        {/* Đơn giá */}
        <div className="text-right pr-3">
          <p className="text-sm font-medium text-neutral-700">
            {fmtPrice(item.unit_price)}/{item.product_unit}
          </p>
        </div>

        {/* Số lượng — có thể edit */}
        <div className="flex flex-col items-center gap-0.5">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="number"
                min="0.01"
                step="any"
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setSaveErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                className="w-16 px-2 py-1 text-sm text-center border border-emerald-400 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/30 font-semibold"
              />
              <button type="button" onClick={commitEdit}
                className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors">
                <Check className="w-3 h-3" />
              </button>
              <button type="button" onClick={cancelEdit}
                className="w-6 h-6 rounded-md bg-neutral-200 text-neutral-600 flex items-center justify-center hover:bg-neutral-300 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 group">
                <span className={`text-sm font-semibold ${isDirty ? "text-amber-700" : "text-gray-900"}`}>
                  {Number(item.quantity).toLocaleString("vi-VN")}
                </span>
                {canEdit && (
                  <button type="button" onClick={() => setEditing(true)}
                    className="opacity-60 group-hover:opacity-100 p-1 rounded-md border border-neutral-200 text-neutral-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                    title="Sửa số lượng">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {isDirty && (
                <span className="text-[9px] font-semibold text-amber-500 uppercase tracking-wide">Chưa lưu</span>
              )}
            </>
          )}
          {saveErr && <p className="text-[10px] text-red-500 text-center">{saveErr}</p>}
        </div>

        {/* Thành tiền */}
        <div className="text-right">
          <p className={`text-sm font-bold ${(editing || isDirty) ? "text-amber-700" : "text-gray-900"}`}>
            {fmtPrice((editing || isDirty) ? displaySubtotal : item.subtotal)}
          </p>
          {(editing || isDirty) && (
            <p className="text-[10px] text-amber-500">{editing ? "xem trước" : "chưa lưu"}</p>
          )}
        </div>

        {/* Thao tác duyệt / từ chối — chỉ khi canEdit */}
        {canEdit && (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={isApproved ? onReset : onApprove}
              title={isApproved ? "Bỏ duyệt" : "Duyệt"}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors ${
                isApproved
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "border-neutral-200 text-neutral-500 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              ✓
            </button>
            <button
              type="button"
              onClick={isRejected ? onReset : onReject}
              title={isRejected ? "Bỏ từ chối" : "Từ chối"}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors ${
                isRejected
                  ? "bg-red-500 border-red-500 text-white"
                  : "border-neutral-200 text-neutral-500 hover:border-red-400 hover:text-red-600 hover:bg-red-50"
              }`}
            >
              ✗
            </button>
          </div>
        )}

      </div>
    </div>
  );
}