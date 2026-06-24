import StorefrontProductCard from "../Product/StorefrontProductCard";
import { formatCurrency } from "./mockData";
import { formatUnitLabel } from "../../../utils/userProductUtils";

export default function SuggestedProductCard({ product }) {
    return (
        <StorefrontProductCard
            id={product.id}
            name={product.name}
            price={formatCurrency(product.price)}
            unit={formatUnitLabel(product.unit)}
            unitKey={product.unit}
            priceValue={Number(product.price) || 0}
            image={product.image}
            availableQuantity={product.available_quantity ?? 99}
            inStock={product.in_stock ?? true}
            showAddToCart
            layout="grid"
        />
    );
}
