import { BrowserRouter, Routes, Route } from "react-router-dom";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import SupplierLayout from "./layouts/SupplierLayout";

import  {HomePage}  from "./pages/User/Home";

import InventorySupplierPage from "./pages/Supplier/Inventory";
import ProductSupplierPage from "./pages/Supplier/Product";
import CertificationSupplierPage from "./pages/Supplier/Vertification";
import RegisterPage from "./pages/Supplier/RegisterPage";
import SupplierLoginPage from "./pages/Supplier/SupplierLogin";
import SupplierProtectedRoute from "./contexts/supplierProtectedRoute";

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

import { AuthProvider } from "./contexts/authProvider";
import AdminProtectedRoute from "./contexts/adminProtectedRoute";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<UserLayout />}>
                        <Route index element={<HomePage />} />
                    </Route>
                    {/* Supplier */}
                    <Route element={<SupplierProtectedRoute />}>
                        <Route path="/nha-cung-cap" element={<SupplierLayout />}>
                            <Route index element={
                                <div className="p-8 text-sm text-neutral-400 font-['Geist',sans-serif]">
                                    Chọn mục quản lý từ sidebar.
                                </div>
                            } />
                            <Route path="san-pham" element={<ProductSupplierPage />} />
                            <Route path="ton-kho" element={<InventorySupplierPage/>} />
                            <Route path="chung-nhan" element={<CertificationSupplierPage />} />
                        </Route>
                    </Route>
                    <Route path="/nha-cung-cap/login" element={<SupplierLoginPage />} />
                    <Route path="dang-ky-nha-cung-cap" element={<RegisterPage />} />


                    {/* Admin */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route element={<AdminProtectedRoute />}>
                        <Route path="/quan-tri" element={<AdminLayout />}>
                            <Route path="cau-hinh" element={<SettingPage />} />
                            <Route path="nha-cung-cap" element={<SupplierPage />} />
                            <Route path="danh-muc" element={<CategoryPage />} />
                            <Route path="san-pham" element={<ProductPage />} />
                            <Route path="chung-chi" element={<CertificationPage />} />
                            <Route path="giay-to" element={<DocumentPage />} />
                            <Route path="tat-ca-thong-bao" element={<NotificationPage />} />
                        </Route>
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}