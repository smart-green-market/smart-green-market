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
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                inStock
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
            }`}
        >
            {stockLabel}
        </span>
    );
}
