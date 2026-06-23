import { formatAvailableQuantityLabel } from "../../../utils/userProductUtils";

export default function ProductCardMeta({
    availableQuantity = 0,
    unit = "",
    inStock = true,
}) {
    const stockLabel = formatAvailableQuantityLabel(
        availableQuantity,
        unit,
        inStock,
    );

    return (
        <span className={`text-xs ${inStock ? "text-emerald-700" : "text-red-500"}`}>
            {stockLabel}
        </span>
    );
}
