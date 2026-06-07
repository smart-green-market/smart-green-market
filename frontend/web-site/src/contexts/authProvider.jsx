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

  // LOGIN
  const login = async (username, password) => {
    try {
      // STEP 1 LOGIN
      const response = await authService.login({
        username,
        password,
      });

      console.log("LOGIN RESPONSE:", response);

      const accessToken = response.access;

      if (!accessToken) {
        return {
          success: false,
          message: "API không trả về access token",
        };
      }

      localStorage.setItem("access_token", accessToken);

      // STEP 2 GET ME
      const me = response.account;

      console.log("ME RESPONSE:", me);

      // CHECK ROLE
      if (me.role !== "admin") {
        localStorage.removeItem("access_token");

        return {
          success: false,
          message: "Bạn không có quyền truy cập Admin",
        };
      }

      setUser(me);

      localStorage.setItem("user", JSON.stringify(me));

      navigate("/quan-tri");

      return {
        success: true,
      };
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
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem("access_token");

      localStorage.removeItem("user");

      setUser(null);

      navigate("/admin/login");
    }
  }, [navigate]);

  // INIT SESSION
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
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [logout]);

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
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth phải dùng trong AuthProvider");
  }

  return context;
};
