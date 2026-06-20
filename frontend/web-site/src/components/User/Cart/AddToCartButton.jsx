import { ShoppingCart } from "lucide-react";
import { useCart } from "../../../contexts/cartProvider";
import { showAddToCartFeedback } from "../../../utils/cartAddFeedback";

export default function AddToCartButton({
    product,
    quantity = 1,
    className = "",
    iconClassName = "h-4 w-4",
    showToast = true,
    onAdded,
}) {
    const { addToCart } = useCart();

    const handleClick = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const result = addToCart(product, quantity);
        showAddToCartFeedback(result, { showToast });

        if (result.added) {
            onAdded?.();
        }
    };

    return (
        <button type="button" onClick={handleClick} className={className}>
            <ShoppingCart className={iconClassName} />
        </button>
    );
}
