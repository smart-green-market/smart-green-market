import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
    cartItemExceedsStock,
    getCartItemAvailableQuantity,
    isCartItemPreorderOnly,
    normalizeCartQuantity,
} from "../../../utils/cartUtils";
import { formatCurrency } from "./mockData";

export default function CartItemRow({
    item,
    onToggleSelect,
    onDecrease,
    onIncrease,
    onSetQuantity,
    onRemove,
}) {
    const availableQuantity = getCartItemAvailableQuantity(item);
    const preorderOnly = isCartItemPreorderOnly(item);
    const exceedsStock = cartItemExceedsStock(item);
    const [draftQuantity, setDraftQuantity] = useState(item.quantity);

    useEffect(() => {
        setDraftQuantity(item.quantity);
    }, [item.quantity]);

    const normalizedQuantity = normalizeCartQuantity(draftQuantity);

    const handleQuantityChange = (event) => {
        const raw = event.target.value;
        if (raw === "") {
            setDraftQuantity("");
            return;
        }

        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) return;

        setDraftQuantity(Math.max(1, parsed));
    };

    const handleQuantityBlur = () => {
        const next = normalizeCartQuantity(draftQuantity);
        setDraftQuantity(next);
        if (next !== item.quantity) {
            onSetQuantity(item.id, next);
        }
    };

    return (
        <div
            className={`grid grid-cols-[40px_1.6fr_1fr_1fr_1fr] items-center gap-4 border-t border-stone-300/10 p-6 first:border-t-0 ${preorderOnly ? "bg-amber-50/50" : ""}`}
        >
            <div>
                <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => onToggleSelect(item.id)}
                    className="h-4 w-4 rounded border-stone-400 text-teal-800 focus:ring-teal-700"
                />
            </div>

            <div className="flex items-center gap-4">
                <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 rounded-lg border border-zinc-200 object-cover"
                />
                <div>
                    <h3 className="text-base font-bold text-emerald-950">
                        {item.name}
                    </h3>
                    {availableQuantity != null ? (
                        <p className="mt-1 text-xs text-neutral-500">
                            Tồn kho: {availableQuantity} {item.unit}
                        </p>
                    ) : null}
                    {exceedsStock ? (
                        <p className="mt-1 text-xs text-amber-800">
                            Vượt tồn — sẽ xử lý ở bước thanh toán
                        </p>
                    ) : null}
                    <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="cursor-pointer mt-2 inline-flex items-center gap-1 text-sm text-red-700 hover:text-red-800"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa
                    </button>
                </div>
            </div>

            <div className="text-center text-base text-neutral-700">
                {formatCurrency(item.price)}/{item.unit}
            </div>

            <div className="flex justify-center">
                <div className="inline-flex h-10 items-center overflow-hidden rounded-lg border border-stone-300">
                    <button
                        type="button"
                        onClick={() => onDecrease(item.id)}
                        disabled={normalizedQuantity <= 1}
                        className="px-3 text-emerald-950 disabled:opacity-40 cursor-pointer "
                        aria-label={`Giảm số lượng ${item.name}`}
                    >
                        <Minus className="h-4 w-4" />
                    </button>
                    <input
                        type="number"
                        min={1}
                        value={draftQuantity}
                        onChange={handleQuantityChange}
                        onBlur={handleQuantityBlur}
                        inputMode="numeric"
                        aria-label={`Số lượng ${item.name}`}
                        className="w-12 border-x border-stone-300 bg-white py-2 text-center text-base font-semibold text-zinc-900 [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                        type="button"
                        onClick={() => onIncrease(item.id)}
                        className="px-3 text-emerald-950 cursor-pointer disabled:opacity-40"
                        aria-label={`Tăng số lượng ${item.name}`}
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="text-right text-base font-bold text-teal-800">
                {formatCurrency(item.price * item.quantity)}
            </div>
        </div>
    );
}
