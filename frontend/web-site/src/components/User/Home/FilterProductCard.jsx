import StorefrontProductCard from "../Product/StorefrontProductCard";

export default function FilterProductCard({
    id,
    name = "Sản phẩm",
    price = "0đ",
    rating = 4.5,
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
            unit={unit}
            availableQuantity={availableQuantity}
            inStock={inStock}
            rating={rating}
            image={image}
            layout="grid"
        />
    );
}
