import ProductImage from "../Product/ProductImage";
import { formatCurrency } from "../Cart/mockData";

export default function OrderItemRow({ item }) {
    const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
    const quantity = Number(item.quantity ?? 1);
    const lineTotal = unitPrice * quantity;
    const unit = item.unit ?? "kg";

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
                <p className="text-sm text-zinc-900">
                    Số lượng: {quantity} {unit}
                </p>
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
