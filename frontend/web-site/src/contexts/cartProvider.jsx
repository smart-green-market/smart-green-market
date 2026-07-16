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
    normalizeCartQuantity,
    resolveCartOwner,
    saveCartToSession,
} from "../utils/cartUtils";
import { isBuyerUser } from "../utils/buyerAuthUtils";
import { isProductPurchasable, isProductInStock } from "../utils/userProductUtils";
import {
    clearProductSpamEntry,
    registerDuplicateAddAttempt,
    resetCartSpamGuard,
} from "../utils/cartSpamGuard";
import { recordAddToCartInteraction } from "../utils/buyerInteractionUtils";

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
                recordAddToCartInteraction(dealerSlug, product, user);
                return { added: false, reason: "auth_required", showToast: true };
            }

            const productId = product?.id;
            if (productId == null) {
                return { added: false, reason: "invalid", showToast: false };
            }

            if (!isProductPurchasable(product)) {
                return { added: false, reason: "unavailable", showToast: true };
            }

            const nextItem = buildCartItemFromProduct(product, quantity);
            const preorderOnly = !isProductInStock(product);
            let result = {
                added: true,
                showToast: true,
                preorderOnly,
            };

            setItems((prev) => {
                const exists = prev.some(
                    (item) => String(item.id) === String(productId),
                );
                if (exists) {
                    result = registerDuplicateAddAttempt(productId);
                    return prev;
                }

                clearProductSpamEntry(productId);
                result = { added: true, showToast: true };
                recordAddToCartInteraction(dealerSlug, product, user);
                return [...prev, nextItem];
            });

            return result;
        },
        [user, dealerSlug],
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
            prev.map((item) => {
                if (String(item.id) !== String(id)) return item;

                return { ...item, quantity: item.quantity + 1 };
            }),
        );
    }, []);

    const decreaseQuantity = useCallback((id) => {
        setItems((prev) =>
            prev.map((item) =>
                String(item.id) === String(id)
                    ? {
                          ...item,
                          quantity: normalizeCartQuantity(item.quantity - 1),
                      }
                    : item,
            ),
        );
    }, []);

    const setItemQuantity = useCallback((id, value) => {
        setItems((prev) =>
            prev.map((item) => {
                if (String(item.id) !== String(id)) return item;

                return {
                    ...item,
                    quantity: normalizeCartQuantity(value),
                };
            }),
        );
    }, []);

    const syncItemsWithCatalog = useCallback((catalogProducts) => {
        if (!Array.isArray(catalogProducts) || catalogProducts.length === 0) {
            return;
        }

        const catalogById = new Map(
            catalogProducts.map((product) => [String(product.id), product]),
        );

        setItems((prev) =>
            prev.map((item) => {
                const catalogProduct = catalogById.get(String(item.id));
                if (!catalogProduct) return item;

                const inStock = isProductInStock(catalogProduct);
                const rawAvailable =
                    catalogProduct.available_quantity ??
                    item.availableQuantity ??
                    null;
                const parsed =
                    rawAvailable != null && rawAvailable !== ""
                        ? Number(rawAvailable)
                        : null;
                const availableQuantity = inStock
                    ? Number.isFinite(parsed)
                        ? parsed
                        : null
                    : 0;

                return {
                    ...item,
                    inStock,
                    availableQuantity,
                };
            }),
        );
    }, []);

    const toggleSelectItem = useCallback((id) => {
        setItems((prev) =>
            prev.map((item) => {
                if (String(item.id) !== String(id)) return item;

                return { ...item, selected: !item.selected };
            }),
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
            setItemQuantity,
            syncItemsWithCatalog,
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
            setItemQuantity,
            syncItemsWithCatalog,
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
