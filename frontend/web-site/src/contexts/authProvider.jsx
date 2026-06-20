import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { authService } from "../services/api/authAdminService";
import { authBuyerService } from "../services/api/Buyer/authBuyerService";
import { clearAuthStorage, getAccessToken, saveAuthTokens } from "../services/token/authTokenStorage";
import { clearBuyerAuth, getStoredDealerSlug } from "../utils/buyerAuthUtils";

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

            saveAuthTokens({
                access: accessToken,
                refresh: response.refresh,
            });

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
                clearAuthStorage();
                let roleName = "Quản trị";
                if (expectedRole === "supplier") roleName = "Nhà cung cấp";
                if (expectedRole === "dealer") roleName = "Đại lý";
                return {
                    success: false,
                    message: `Tài khoản này không có quyền đăng nhập vào khu vực ${roleName}`,
                };
            }

            const userWithProfile = {
                ...me,
                dealer_profile: response.dealer_profile || null,
                supplier_profile: response.supplier_profile || null,
            };

            setUser(userWithProfile);
            localStorage.setItem("user", JSON.stringify(userWithProfile));

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
        const savedUser = localStorage.getItem("user");
        const currentUser = savedUser ? JSON.parse(savedUser) : null;
        const currentRole = currentUser?.role;
        const isBuyer =
            currentRole === "buyer" || currentUser?.auth_scope === "storefront";
        const buyerSlug =
            currentUser?.store_dealer_slug || getStoredDealerSlug();

        try {
            if (isBuyer) {
                await authBuyerService.logout();
            } else {
                await authService.logout();
            }
        } catch (error) {
            console.error("Lỗi khi logout API:", error);
        } finally {
            if (isBuyer) {
                clearBuyerAuth();
            } else {
                clearAuthStorage();
            }
            setUser(null);

            if (currentRole === "supplier") {
                navigate("/nha-cung-cap/dang-nhap");
            } else if (currentRole === "admin") {
                navigate("/quan-tri/dang-nhap");
            } else if (currentRole === "dealer") {
                navigate("/dai-ly/dang-nhap");
            } else if (isBuyer) {
                navigate(
                    buyerSlug
                        ? `/cua-hang/${encodeURIComponent(buyerSlug)}/trang-chu`
                        : "/",
                    { replace: true },
                );
            } else {
                navigate("/");
            }
        }
    }, [navigate]);

    // INIT SESSION (ĐÃ FIX LỖI VÒNG LẶP)
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = getAccessToken();
                if (!token) {
                    return;
                }

                const savedUser = localStorage.getItem("user");
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
            } catch (error) {
                console.error("Lỗi khởi tạo session:", error);
                clearAuthStorage();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const syncSession = useCallback(() => {
        const saved = localStorage.getItem("user");
        setUser(saved ? JSON.parse(saved) : null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                loading,
                syncSession,
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