import StorefrontProductCard from "../Product/StorefrontProductCard";

export default function FilterProductCard({
    id,
    name = "Sản phẩm",
    price = "0đ",
    originalPrice = null,
    priceValue = 0,
    discountPercent = 0,
    hasDiscount = false,
    unitKey = "kg",
    unit = "",
    availableQuantity,
    available_quantity = 0,
    inStock,
    in_stock = true,
    image,
}) {
    return (
        <StorefrontProductCard
            id={id}
            name={name}
            price={price}
            originalPrice={originalPrice}
            discountPercent={discountPercent}
            hasDiscount={hasDiscount}
            priceValue={priceValue}
            unitKey={unitKey}
            unit={unit}
            availableQuantity={availableQuantity ?? available_quantity ?? 0}
            inStock={inStock ?? in_stock ?? true}
            image={image}
            layout="grid"
        />
    );
}
