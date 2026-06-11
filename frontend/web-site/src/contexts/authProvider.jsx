import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { authService } from "../services/api/authAdminService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    const [loading, setLoading] = useState(true);

    // LOGIN DÙNG CHUNG
    // Bổ sung tham số expectedRole để biết form đăng nhập nào đang gọi hàm này
    const login = async (username, password, expectedRole = "admin") => {
        try {
            const response = await authService.login({
                username,
                password,
            });

            const accessToken = response.access;

            if (!accessToken) {
                return {
                    success: false,
                    message: "API không trả về access token",
                };
            }

            localStorage.setItem("access_token", accessToken);

            const me = response.account;

            // KIỂM TRA QUYỀN TRUY CẬP ĐỘNG
            // if (me.role !== expectedRole) {
            //     localStorage.removeItem("access_token");
            //     return {
            //         success: false,
            //         message: `Tài khoản này không có quyền đăng nhập vào khu vực ${expectedRole === "supplier" ? "Nhà cung cấp" : "Quản trị"}`,
            //     };
            // }

            // Sửa lỗi đăng nhập vào khu vực không đúng
            if (me.role !== expectedRole) {
                localStorage.removeItem("access_token");
                let roleName = "Quản trị";
               if (expectedRole === "supplier") roleName = "Nhà cung cấp";                          
               if (expectedRole === "dealer") roleName = "Đại lý";
                return {
                    success: false,
                  message: `Tài khoản này không có quyền đăng nhập vào khu vực ${expectedRole === "supplier" ? "Nhà cung cấp" : "Quản trị"}`,
                   message: `Tài khoản này không có quyền đăng nhập vào khu vực ${roleName}`,
                };
            }

            setUser(me);
            localStorage.setItem("user", JSON.stringify(me));

            // ĐIỀU HƯỚNG TỰ ĐỘNG DỰA THEO ROLE
            if (me.role === "admin") {
                navigate("/quan-tri");
            } else if (me.role === "supplier") {
                navigate("/nha-cung-cap");
            } else if (me.role === "dealer") {
                navigate("/dai-ly");
            } else {
                navigate("/"); // Mặc định cho User bình thường
            }

            return { success: true };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message:
                    error.response?.data?.detail ||
                    error.response?.data?.message ||
                    "Đăng nhập thất bại",
            };
        }
    };
    // LOGOUT
    // ... [Phần khai báo và hàm login giữ nguyên] ...

    // LOGOUT DÙNG CHUNG (ĐÃ FIX LỖI VÒNG LẶP)
    const logout = useCallback(async () => {
        // Lấy role trực tiếp từ localStorage để KHÔNG làm re-render component
        const savedUser = localStorage.getItem("user");
        const currentUser = savedUser ? JSON.parse(savedUser) : null;
        const currentRole = currentUser?.role;

        try {
            // Gọi API logout (nếu có)
            await authService.logout();
        } catch (error) {
            console.error("Lỗi khi logout API:", error);
        } finally {
            // Xóa dữ liệu cũ
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            setUser(null);

            // ĐIỀU HƯỚNG TỰ ĐỘNG DỰA THEO ROLE
            if (currentRole === "supplier") {
                navigate("/nha-cung-cap/login");
            } else if (currentRole === "admin") {
                navigate("/admin/login");
            }else if (currentRole === "dealer") {
                navigate("/dai-ly/login");
            } else {
                navigate("/");
            }
        }
    }, [navigate]); // <-- SỬA: Đã xóa chữ 'user' khỏi mảng này

    // INIT SESSION (ĐÃ FIX LỖI VÒNG LẶP)
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem("access_token");
                if (!token) {
                    setLoading(false);
                    return;
                }

                const savedUser = localStorage.getItem("user");
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
            } catch (error) {
                console.error("Lỗi khởi tạo session:", error);
                // Dọn dẹp local storage nếu có lỗi (tránh kẹt token cũ)
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []); // <-- SỬA QUAN TRỌNG: Để mảng rỗng [] để CHỈ CHẠY 1 LẦN khi tải lại trang

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth phải dùng trong AuthProvider"
        );
    }

    return context;
};