import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import ProductImage from "../Product/ProductImage";
import { formatCurrency } from "../Cart/mockData";
import {
    cartItemExceedsStock,
    getCartItemAvailableQuantity,
    normalizeCartQuantity,
} from "../../../utils/cartUtils";

export default function OrderItemRow({
    item,
    quantityDisabled = false,
    onDecreaseQuantity,
    onIncreaseQuantity,
    onSetQuantity,
}) {
    const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
    const quantity = Number(item.quantity ?? 1);
    const lineTotal = unitPrice * quantity;
    const unit = item.unit ?? "kg";
    const availableQuantity = getCartItemAvailableQuantity(item);
    const exceedsStock = cartItemExceedsStock(item);
    const [draftQuantity, setDraftQuantity] = useState(null);
    const quantityAdjustable =
        typeof onDecreaseQuantity === "function" &&
        typeof onIncreaseQuantity === "function" &&
        typeof onSetQuantity === "function";

    const displayedQuantity = draftQuantity ?? quantity;
    const normalizedQuantity = normalizeCartQuantity(displayedQuantity);

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
        const next = normalizeCartQuantity(displayedQuantity);
        setDraftQuantity(null);
        if (next !== quantity) {
            onSetQuantity(item.id, next);
        }
    };

    return (
        <div className="flex items-center gap-4 border-b border-stone-300/20 py-4 last:border-b-0">
            <ProductImage
                src={item.image}
                alt={item.name}
                className="h-14 w-14 rounded-lg"
            />

            <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-base font-semibold text-emerald-950">
                    {item.name}
                </h3>
                {quantityAdjustable ? (
                    <>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-zinc-700">Số lượng:</span>
                        <div className="inline-flex h-9 items-center overflow-hidden rounded-lg border border-stone-300 bg-white">
                            <button
                                type="button"
                                onClick={() => onDecreaseQuantity(item.id)}
                                disabled={quantityDisabled || normalizedQuantity <= 1}
                                className="flex h-full w-9 cursor-pointer items-center justify-center text-emerald-950 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-35"
                                aria-label={`Giảm số lượng ${item.name}`}
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <input
                                type="number"
                                min={1}
                                value={displayedQuantity}
                                onChange={handleQuantityChange}
                                onBlur={handleQuantityBlur}
                                disabled={quantityDisabled}
                                inputMode="numeric"
                                aria-label={`Số lượng ${item.name}`}
                                className="h-full w-14 border-x border-stone-300 bg-white px-1 text-center text-sm font-semibold text-zinc-900 [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                                type="button"
                                onClick={() => onIncreaseQuantity(item.id)}
                                disabled={quantityDisabled}
                                className="flex h-full w-9 cursor-pointer items-center justify-center text-emerald-950 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-35"
                                aria-label={`Tăng số lượng ${item.name}`}
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        <span className="text-sm text-zinc-700">{unit}</span>
                    </div>
                    {availableQuantity != null ? (
                        <p className="mt-1 text-xs text-neutral-500">
                            Tồn kho: {availableQuantity} {unit}
                        </p>
                    ) : null}
                    {exceedsStock ? (
                        <p className="mt-1 text-xs font-medium text-amber-800">
                            Vượt tồn kho sẽ xử lý ở bước thanh toán
                        </p>
                    ) : null}
                    </>
                ) : (
                    <p className="text-sm text-zinc-900">
                        Số lượng: {quantity} {unit}
                    </p>
                )}
            </div>

            <div className="text-right">
                <p className="text-sm text-zinc-900">
                    {formatCurrency(unitPrice)}/{unit}
                </p>
                <p className="text-base font-bold text-emerald-950">
                    {formatCurrency(lineTotal)}
                </p>
            </div>
        </div>
    );
}
