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
    rating = null,
    availableQuantity = 0,
    unit = "",
    inStock = true,
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
            availableQuantity={availableQuantity}
            inStock={inStock}
            rating={rating}
            image={image}
            layout="grid"
        />
    );
}
