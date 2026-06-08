import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/authProvider";
import AdminProtectedRoute from "./contexts/adminProtectedRoute";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import { HomePage } from "./pages/User/Home";
import {
  AdminLoginPage, 
  SettingPage,
  SupplierPage,
  CategoryPage,
  ProductPage,
  CertificationPage,
  DocumentPage,
  NotificationPage,
} from "./pages/Admin";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/admin/login" element={<AdminLoginPage />} />

                    {/* User */}
                    <Route path="/" element={<UserLayout />}>
                        <Route index element={<HomePage />} />
                        <Route path="trang-chu" element={<HomePage />} />
                    </Route>

                    {/* Admin */}
                    <Route element={<AdminProtectedRoute />}>
                        <Route path="/quan-tri" element={<AdminLayout />}>
                            <Route path="cau-hinh" element={<SettingPage />} />
                            <Route path="nha-cung-cap" element={<SupplierPage />} />
                            <Route path="danh-muc" element={<CategoryPage />} />
                            <Route path="san-pham" element={<ProductPage />} />
                            <Route path="chung-chi" element={<CertificationPage />} />
                            <Route path="giay-to" element={<DocumentPage />} />
                            <Route path="thong-bao" element={<NotificationPage />} />
                        </Route>
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}