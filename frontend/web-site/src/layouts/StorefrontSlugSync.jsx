import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { STORE_DEALER_SLUG_KEY } from "../utils/buyerAuthUtils";

export default function StorefrontSlugSync() {
    const { dealerSlug } = useParams();

    useEffect(() => {
        if (dealerSlug) {
            localStorage.setItem(STORE_DEALER_SLUG_KEY, dealerSlug);
        }
    }, [dealerSlug]);

    return <Outlet />;
}
