import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useAuth } from "./authProvider";
import { useDealerSlug } from "../hooks/useStorefrontPaths";
import {
    buildCartItemFromProduct,
    getBuyerCartId,
    loadCartFromSession,
    resolveCartOwner,
    saveCartToSession,
} from "../utils/cartUtils";
import { isBuyerUser } from "../utils/buyerAuthUtils";
import {
    clearProductSpamEntry,
    registerDuplicateAddAttempt,
    resetCartSpamGuard,
} from "../utils/cartSpamGuard";

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const { user } = useAuth();
    const dealerSlug = useDealerSlug();
    const buyerId = getBuyerCartId(user);

    const cartOwner = useMemo(
        () => resolveCartOwner(user, dealerSlug),
        [user, dealerSlug, buyerId],
    );

    const [items, setItems] = useState(() =>
        loadCartFromSession(cartOwner.slug, cartOwner.buyerId),
    );

    const ownerKeyRef = useRef(cartOwner.key);

    useEffect(() => {
        if (ownerKeyRef.current === cartOwner.key) return;

        ownerKeyRef.current = cartOwner.key;
        resetCartSpamGuard();
        setItems(loadCartFromSession(cartOwner.slug, cartOwner.buyerId));
    }, [cartOwner.key, cartOwner.slug, cartOwner.buyerId]);

    useEffect(() => {
        saveCartToSession(items, cartOwner.slug, cartOwner.buyerId);
    }, [items, cartOwner.slug, cartOwner.buyerId]);

    const addToCart = useCallback(
        (product, quantity = 1) => {
            if (!isBuyerUser(user)) {
                return { added: false, reason: "auth_required", showToast: true };
            }

            const productId = product?.id;
            if (productId == null) {
                return { added: false, reason: "invalid", showToast: false };
            }

            const nextItem = buildCartItemFromProduct(product, quantity);
            let result = { added: true, showToast: true };

            setItems((prev) => {
                const exists = prev.some(
                    (item) => String(item.id) === String(productId),
                );
                if (exists) {
                    result = registerDuplicateAddAttempt(productId);
                    return prev;
                }

                clearProductSpamEntry(productId);
                return [...prev, nextItem];
            });

            return result;
        },
        [user],
    );

    const isInCart = useCallback(
        (productId) =>
            items.some((item) => String(item.id) === String(productId)),
        [items],
    );

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

    const itemCount = items.length;

    const value = useMemo(
        () => ({
            items,
            totalQuantity,
            itemCount,
            cartOwnerKey: cartOwner.key,
            addToCart,
            isInCart,
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
            itemCount,
            cartOwner.key,
            addToCart,
            isInCart,
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
