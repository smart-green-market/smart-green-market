import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/authProvider";
    //Protected Routes
import AdminProtectedRoute from "./contexts/adminProtectedRoute";
import SupplierProtectedRoute from "./contexts/supplierProtectedRoute";
import DealerProtectedRoute from "./contexts/dealerProtectedRoute";
    //Layouts
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import SupplierLayout from "./layouts/SupplierLayout";
import UserProfileLayout from "./layouts/UserProfileLayout";
import DealerLayout from "./layouts/DealerLayout";
    //User Pages
import {HomePage, ProductDetailPage, CartPage, OrderPage, PaymentPage, OrderStatusPage, UserProfilePage, ChangePasswordPage, OrderHistoryPage}  from "./pages/User";
    //Supplier Pages
import { OrderSupplierPage, ProductSupplierPage, CertificationSupplierPage, RegisterPage, SupplierLoginPage, SupplierInfoPage, CategorySupplierPage, CultivationSupplierPage,DashboardSupplierPage } from "./pages/Supplier";
    //Admin Pages
import { AdminLoginPage, SettingPage, SupplierPage, CategoryPage, ProductPage, CertificationPage, DocumentPage, NotificationPage, DealerPage,} from "./pages/Admin";



import {
    RegisterDealerPage,
    DealerLoginPage,
    DealerDashboardPage,
    DealerInventoryPage,
    DealerSupplierPage,
    DealerCategoryPage,
    DealerSalesOrderPage,
    DealerPurchaseOrderPage,
    DealerCreatePurchaseOrderPage,
    DealerPurchaseOrderDetailPage,
    DealerSupplierDetailPage,
    DealerCategoryDetail,
    DealerInfoPage,
} from "./pages/Dealer";


export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* User */}
                    <Route path="/" element={<UserLayout />}>
                        <Route index element={<HomePage />} />
                        <Route path="trang-chu" element={<HomePage />} />
                        <Route path="san-pham/:id" element={<ProductDetailPage />} />
                        <Route path="gio-hang" element={<CartPage />} />
                        <Route path="dat-hang" element={<OrderPage />} />
                        <Route path="thanh-toan" element={<PaymentPage />} />
                        <Route path="theo-doi-don-hang" element={<OrderStatusPage />} />
                        <Route path="tai-khoan" element={<UserProfileLayout />}>
                            <Route path="" element={<UserProfilePage />} />
                            <Route path="doi-mat-khau" element={<ChangePasswordPage />} />
                            <Route path="lich-su-don-hang" element={<OrderHistoryPage />} />
                        </Route>
                    </Route>
                    {/* Supplier */}
                    <Route element={<SupplierProtectedRoute />}>
                        <Route path="/nha-cung-cap" element={<SupplierLayout />}>
                            <Route index element={ <DashboardSupplierPage />} />
                            <Route path="san-pham" element={<ProductSupplierPage />} />
                            <Route path="don-hang" element={<OrderSupplierPage/>} />
                            <Route path="chung-nhan" element={<CertificationSupplierPage />} />
                            <Route path="thong-tin-ca-nhan" element={<SupplierInfoPage />} />
                            <Route path="danh-muc" element={<CategorySupplierPage />} />
                            <Route path="tat-ca-thong-bao" element={<NotificationPage />} />
                            <Route path="canh-tac" element={<CultivationSupplierPage />} />
                        </Route>
                    </Route>
                    <Route path="/nha-cung-cap/dang-nhap" element={<SupplierLoginPage />} />
                    <Route path="dang-ky-nha-cung-cap" element={<RegisterPage />} />


                    {/* Admin */}
                    <Route path="/quan-tri/dang-nhap" element={<AdminLoginPage />} />
                    <Route element={<AdminProtectedRoute />}>
                        <Route path="/quan-tri" element={<AdminLayout />}>
                            <Route path="cau-hinh" element={<SettingPage />} />
                            <Route path="nha-cung-cap" element={<SupplierPage />} />
                            <Route path="danh-muc" element={<CategoryPage />} />
                            <Route path="san-pham" element={<ProductPage />} />
                            <Route path="chung-chi" element={<CertificationPage />} />
                            <Route path="giay-to" element={<DocumentPage />} />
                            <Route path="tat-ca-thong-bao" element={<NotificationPage />} />
                            <Route path="dai-ly" element={<DealerPage />} />
                        </Route>
                    </Route>

                    {/* Dealer */}
                    <Route element={<DealerProtectedRoute />}>
                        <Route path="/dai-ly" element={<DealerLayout />}>
                            <Route path="tat-ca-thong-bao" element={<NotificationPage />} />
                            <Route index element={<DealerDashboardPage />} />
                            <Route path="nha-cung-cap" element={<DealerSupplierPage />} />
                            <Route path="danh-muc" element={<DealerCategoryPage />} />
                            <Route path="kho-hang" element={<DealerInventoryPage />} />
                            <Route path="ban-hang" element={<DealerSalesOrderPage />} />
                            <Route path="nhap-hang" element={<DealerPurchaseOrderPage />} />
                            <Route path="nhap-hang/tao-moi" element={<DealerCreatePurchaseOrderPage />} />
                            <Route path="nhap-hang/tao-phieu-nhap" element={<DealerPurchaseOrderDetailPage />} />
                            <Route path="nhap-hang/chi-tiet/:id" element={<DealerPurchaseOrderDetailPage />} />
                            <Route path="nha-cung-cap/:id" element={<DealerSupplierDetailPage />} />
                            <Route path="danh-muc/:id" element={<DealerCategoryDetail />} />
                            <Route path="cau-hinh" element={<DealerInfoPage />} />
                        </Route>
                    </Route>
                    <Route path="dai-ly/dang-nhap" element={<DealerLoginPage />} />
                    <Route path="dai-ly/dang-ky" element={<RegisterDealerPage />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}