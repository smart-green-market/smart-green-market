import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { STORE_DEALER_SLUG_KEY } from "../utils/buyerAuthUtils";
import { buyerDealerService } from "../services/api/Buyer/buyerDealerService";
import NotFoundPage from "../../public/404";
import { Loader2 } from "lucide-react";

export default function StorefrontSlugSync() {
    const { dealerSlug } = useParams();
    const [isValid, setIsValid] = useState(null);

    useEffect(() => {
        let cancelled = false;

        if (dealerSlug) {
            localStorage.setItem(STORE_DEALER_SLUG_KEY, dealerSlug);
            
            buyerDealerService.getDealer(dealerSlug)
                .then(() => {
                    if (!cancelled) setIsValid(true);
                })
                .catch(() => {
                    if (!cancelled) setIsValid(false);
                });
        } else {
            setIsValid(false);
        }

        return () => { cancelled = true; };
    }, [dealerSlug]);

    if (isValid === null) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
            </div>
        );
    }

    if (isValid === false) {
        return <NotFoundPage />;
    }

    return <Outlet />;
}
