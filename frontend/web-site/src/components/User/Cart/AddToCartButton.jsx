import { ShoppingCart } from "lucide-react";
import { useCart } from "../../../contexts/cartProvider";
import { appToast } from "../../common/toast";

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
        addToCart(product, quantity);
        if (showToast) {
            appToast.success("Đã thêm vào giỏ hàng");
        }
        onAdded?.();
    };

    return (
        <button type="button" onClick={handleClick} className={className}>
            <ShoppingCart className={iconClassName} />
        </button>
    );
}
