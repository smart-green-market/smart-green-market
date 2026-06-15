import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    buildCartItemFromProduct,
    loadCartFromSession,
    saveCartToSession,
} from "../utils/cartUtils";

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => loadCartFromSession());

    useEffect(() => {
        saveCartToSession(items);
    }, [items]);

    const addToCart = useCallback((product, quantity = 1) => {
        const nextItem = buildCartItemFromProduct(product, quantity);

        setItems((prev) => {
            const index = prev.findIndex(
                (item) => String(item.id) === String(nextItem.id),
            );

            if (index === -1) {
                return [...prev, nextItem];
            }

            return prev.map((item, i) =>
                i === index
                    ? {
                          ...item,
                          quantity: item.quantity + nextItem.quantity,
                          selected: true,
                      }
                    : item,
            );
        });
    }, []);

    const removeItem = useCallback((id) => {
        setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
    }, []);

    const increaseQuantity = useCallback((id) => {
        setItems((prev) =>
            prev.map((item) =>
                String(item.id) === String(id)
                    ? { ...item, quantity: item.quantity + 1 }
                    : item,
            ),
        );
    }, []);

    const decreaseQuantity = useCallback((id) => {
        setItems((prev) =>
            prev.map((item) =>
                String(item.id) === String(id)
                    ? { ...item, quantity: Math.max(1, item.quantity - 1) }
                    : item,
            ),
        );
    }, []);

    const toggleSelectItem = useCallback((id) => {
        setItems((prev) =>
            prev.map((item) =>
                String(item.id) === String(id)
                    ? { ...item, selected: !item.selected }
                    : item,
            ),
        );
    }, []);

    const toggleAll = useCallback((selected) => {
        setItems((prev) => prev.map((item) => ({ ...item, selected })));
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const totalQuantity = useMemo(
        () => items.reduce((sum, item) => sum + item.quantity, 0),
        [items],
    );

    const value = useMemo(
        () => ({
            items,
            totalQuantity,
            addToCart,
            removeItem,
            increaseQuantity,
            decreaseQuantity,
            toggleSelectItem,
            toggleAll,
            clearCart,
        }),
        [
            items,
            totalQuantity,
            addToCart,
            removeItem,
            increaseQuantity,
            decreaseQuantity,
            toggleSelectItem,
            toggleAll,
            clearCart,
        ],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart phải được dùng bên trong CartProvider");
    }
    return context;
}
