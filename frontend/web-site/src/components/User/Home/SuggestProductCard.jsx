import StorefrontProductCard from "../Product/StorefrontProductCard";

export default function SuggestProductCard({
    id,
    name = "Rau",
    price = "45.000đ",
    originalPrice = null,
    unit = "/kg",
    image,
    priceValue = 0,
    discountPercent = 0,
    hasDiscount = false,
    unitKey = "kg",
    available_quantity = 0,
    in_stock = true,
}) {
    return (
        <StorefrontProductCard
            id={id}
            name={name}
            price={price}
            originalPrice={originalPrice}
            discountPercent={discountPercent}
            hasDiscount={hasDiscount}
            unit={unit}
            unitKey={unitKey}
            priceValue={priceValue}
            image={image}
            availableQuantity={available_quantity}
            inStock={in_stock}
            showAddToCart
            layout="carousel"
        />
    );
}
