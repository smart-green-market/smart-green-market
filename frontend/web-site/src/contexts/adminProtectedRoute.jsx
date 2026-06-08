import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "./authProvider";

export default function AdminProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-neutral-500">
                Đang tải...
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return (
            <Navigate
                to="/admin/login"
                replace
            />
        );
    }

    return <Outlet />;
}
