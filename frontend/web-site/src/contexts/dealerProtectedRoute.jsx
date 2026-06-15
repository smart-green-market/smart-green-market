import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./authProvider";

export default function DealerProtectedRoute() {
    const { user, loading } = useAuth();

    // 1. Chờ kiểm tra trạng thái đăng nhập
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-neutral-500 font-['Geist',sans-serif]">
                Đang tải...
            </div>
        );
    }

    // 2. Nếu chưa đăng nhập HOẶC không phải quyền dealer -> Đẩy về trang đăng nhập dealer
    if (!user || user.role !== "dealer") {
        return <Navigate to="/dai-ly/dang-nhap" replace />;
    }

    // 3. Nếu đúng quyền -> Cho phép truy cập
    return <Outlet />;
}