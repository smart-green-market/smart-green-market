import { useEffect, useState } from "react";
import { dealerProductService } from "../services/api/dealerProductService";
import { formatDealerProduct, parseDealerProductList } from "../utils/userProductUtils";

let cachedProducts = null;
let inflightRequest = null;

async function loadDealerProducts() {
    if (cachedProducts) return cachedProducts;

    if (!inflightRequest) {
        inflightRequest = dealerProductService
            .getAll()
            .then((response) => {
                cachedProducts = parseDealerProductList(response).map(formatDealerProduct);
                return cachedProducts;
            })
            .finally(() => {
                inflightRequest = null;
            });
    }

    return inflightRequest;
}

export function useDealerProducts() {
    const [products, setProducts] = useState(cachedProducts ?? []);
    const [loading, setLoading] = useState(!cachedProducts);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        loadDealerProducts()
            .then((list) => {
                if (!cancelled) setProducts(list);
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.message ?? "Không thể tải sản phẩm");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { products, loading, error };
}

export async function fetchDealerProductById(id) {
    const raw = await dealerProductService.getById(id);
    return formatDealerProduct(raw);
}

export async function fetchRelatedDealerProducts(currentId, categoryId, limit = 4) {
    const list = await loadDealerProducts();
    return list
        .filter(
            (item) =>
                String(item.id) !== String(currentId) &&
                (categoryId ? item.category_id === categoryId : true),
        )
        .slice(0, limit);
}
