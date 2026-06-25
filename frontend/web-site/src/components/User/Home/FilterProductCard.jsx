import StorefrontProductCard from "../Product/StorefrontProductCard";

export default function FilterProductCard({
    id,
    name = "Sản phẩm",
    price = "0đ",
    priceValue = 0,
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
