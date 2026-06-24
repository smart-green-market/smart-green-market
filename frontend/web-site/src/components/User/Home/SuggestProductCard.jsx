import StorefrontProductCard from "../Product/StorefrontProductCard";

export default function SuggestProductCard({
    id,
    name = "Rau",
    price = "45.000đ",
    unit = "/kg",
    image,
    priceValue = 0,
    unitKey = "kg",
    available_quantity = 0,
    in_stock = true,
}) {
    return (
        <StorefrontProductCard
            id={id}
            name={name}
            price={price}
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
