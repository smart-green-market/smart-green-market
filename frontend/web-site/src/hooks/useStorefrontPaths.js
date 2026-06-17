import { useParams } from "react-router-dom";
import { getStoredDealerSlug } from "../utils/buyerAuthUtils";

export function useDealerSlug() {
    const { dealerSlug } = useParams();
    return dealerSlug || getStoredDealerSlug() || "";
}

export function useStorefrontPaths() {
    const slug = useDealerSlug();
    const prefix = slug ? `/cua-hang/${encodeURIComponent(slug)}` : "";

    return {
        slug,
        entry: "/",
        home: prefix ? `${prefix}/trang-chu` : "/",
        product: (id) => (prefix ? `${prefix}/san-pham/${id}` : "/"),
        search: (query = "", extraParams = {}) => {
            const path = prefix ? `${prefix}/tim-kiem` : "/";
            const params = new URLSearchParams();
            const trimmed = String(query).trim();
            if (trimmed) params.set("q", trimmed);
            Object.entries(extraParams).forEach(([key, value]) => {
                if (value != null && value !== "") params.set(key, value);
            });
            const qs = params.toString();
            return qs ? `${path}?${qs}` : path;
        },
        cart: prefix ? `${prefix}/gio-hang` : "/",
        login: prefix ? `${prefix}/dang-nhap` : "/",
        register: prefix ? `${prefix}/dang-ky` : "/",
        account: prefix ? `${prefix}/tai-khoan` : "/",
        orderStatus: prefix ? `${prefix}/theo-doi-don-hang` : "/",
    };
}
