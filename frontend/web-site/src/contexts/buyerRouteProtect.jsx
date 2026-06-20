import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./authProvider";
import { isBuyerUser } from "../utils/buyerAuthUtils";
import { useStorefrontPaths } from "../hooks/useStorefrontPaths";

export default function BuyerRouteProtect() {
    const { user, loading } = useAuth();
    const location = useLocation();
    const paths = useStorefrontPaths();

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
            </div>
        );
    }

    if (!isBuyerUser(user)) {
        return (
            <Navigate
                to={paths.login}
                replace
                state={{
                    from: `${location.pathname}${location.search}`,
                    buyNow: location.state?.buyNow,
                }}
            />
        );
    }

    return <Outlet />;
}
