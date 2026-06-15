import { useEffect, useState } from "react";
import { userOrderService } from "../services/api/userOrderService";
import { formatUserOrder, parseUserOrderList } from "../utils/userOrderUtils";

let cachedOrders = null;
let inflightRequest = null;

async function loadUserOrders() {
    if (cachedOrders) return cachedOrders;

    if (!inflightRequest) {
        inflightRequest = userOrderService
            .getAll()
            .then((response) => {
                cachedOrders = parseUserOrderList(response).map(formatUserOrder);
                return cachedOrders;
            })
            .finally(() => {
                inflightRequest = null;
            });
    }

    return inflightRequest;
}

export function useUserOrders() {
    const [orders, setOrders] = useState(cachedOrders ?? []);
    const [loading, setLoading] = useState(!cachedOrders);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        loadUserOrders()
            .then((list) => {
                if (!cancelled) setOrders(list);
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.message ?? "Không thể tải lịch sử đơn hàng");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { orders, loading, error };
}

export async function fetchUserOrderById(id) {
    const raw = await userOrderService.getById(id);
    return formatUserOrder(raw);
}
