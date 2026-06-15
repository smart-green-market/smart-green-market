import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./authProvider";

export default function SupplierProtectedRoute() {
    const { user, loading } = useAuth();

    // 1. Chờ kiểm tra trạng thái đăng nhập
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-neutral-500">
                Đang tải...
            </div>
        );
    }

    // 2. Nếu chưa đăng nhập HOẶC không phải quyền supplier -> Đẩy về trang đăng nhập supplier
    if (!user || user.role !== "supplier") {
        return (
            <Navigate
                to="/nha-cung-cap/dang-nhap" // Đường dẫn trang login của Supplier (bạn có thể đổi tùy ý)
                replace
            />
        );
    }

    // 3. Nếu đúng quyền supplier -> Cho phép truy cập các trang con
    return <Outlet />;
}