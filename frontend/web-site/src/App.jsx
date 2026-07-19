import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/authProvider";
import { NotificationRealtimeProvider } from "./contexts/notificationRealtimeProvider";
import AppToaster from "./components/common/AppToaster";
//Protected Routes
import AdminProtectedRoute from "./contexts/adminProtectedRoute";
import SupplierProtectedRoute from "./contexts/supplierProtectedRoute";
import DealerProtectedRoute from "./contexts/dealerProtectedRoute";
import BuyerRouteProtect from "./contexts/buyerRouteProtect";
//Layouts
import UserLayout from "./layouts/UserLayout";
import StorefrontSlugSync from "./layouts/StorefrontSlugSync";
import AdminLayout from "./layouts/AdminLayout";
import SupplierLayout from "./layouts/SupplierLayout";
import UserProfileLayout from "./layouts/UserProfileLayout";
import DealerLayout from "./layouts/DealerLayout";
import NotFoundPage from "../public/404";


import StorefrontEntryRedirect from "./components/User/StorefrontEntryRedirect";
//User Pages
import { LoyaltyHistoryPage, HomePage, ProductDetailPage, ProductsPage, CartPage, OrderPage, PaymentPage, OrderStatusPage, UserProfilePage, ChangePasswordPage, OrderHistoryPage, PreOrderRequestsPage, ProductReviewsPage, UserVoucherPage, BuyerNotificationsPage, UserLoginPage, UserRegisterPage, SearchProductPage, DealerSlugEntryPage, CheckoutPage, OrderTrackingPage, PoliciesPage, SupportPage, AboutUsPage } from "./pages/User";
//Supplier Pages
import { OrderSupplierPage, ProductSupplierPage, CertificationSupplierPage, RegisterPage, SupplierLoginPage, SupplierInfoPage, CategorySupplierPage, CultivationSupplierPage, DashboardSupplierPage, SupplierNotificationPage, NotFound, OrderStats, RevenuePage, SupplierDiscountPage, CustomerSupplierPage } from "./pages/Supplier";
//Admin Pages
import { TrainingHistoryPage, SegmentModelEvaluationPage, DetailDealerPage, AdminStatisticsPage, AdminLoginPage, AdminDashboardPage, SettingPage, SupplierPage, CategoryPage, ProductPage, ProductMasterPage, SeasonPage, CertificationPage, DocumentPage, NotificationPage, DealerPage, VoucherPage, SupplierFinancePage, } from "./pages/Admin";
//Dealer Pages
import { RegisterDealerPage, DealerLoginPage, DealerDashboardPage, DealerInventoryPage, DealerSupplierPage, DealerCategoryPage, DealerSalesOrderPage, DealerPreOrderPage, DealerPurchaseOrderPage, DealerCreatePurchaseOrderPage, DealerPurchaseOrderDetailPage, DealerDraftOrderPreviewPage, DealerSupplierDetailPage, DealerCategoryDetail, DealerInfoPage, DealerCustomerPage, DealerProductManagementPage, DealerProductDetailPage, DealerDiscountPage, DealerAiPredictionPage, DealerStatsPage, DealerLoyaltyPage } from "./pages/Dealer";
export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppToaster />
                <NotificationRealtimeProvider>
                <Routes>
                    {/* User */}
                    <Route path="/" element={<DealerSlugEntryPage />} />
                    <Route path="cua-hang/:dealerSlug/dang-nhap" element={<UserLoginPage />} />
                    <Route path="cua-hang/:dealerSlug/dang-ky" element={<UserRegisterPage />} />
                    <Route path="cua-hang/:dealerSlug" element={<StorefrontSlugSync />}>
                        <Route element={<UserLayout />}>
                            <Route index element={<HomePage />} />
                            <Route path="trang-chu" element={<HomePage />} />
                            <Route path="san-pham" element={<ProductsPage />} />
                            <Route path="san-pham/:id" element={<ProductDetailPage />} />
                            <Route path="tim-kiem" element={<SearchProductPage />} />
                            <Route path="chinh-sach" element={<PoliciesPage />} />
                            <Route path="ho-tro" element={<SupportPage />} />
                            <Route path="ve-chung-toi" element={<AboutUsPage />} />

                            <Route element={<BuyerRouteProtect />}>
                                <Route path="gio-hang" element={<CartPage />} />
                                <Route path="dat-hang" element={<OrderPage />} />
                                <Route path="thanh-toan" element={<PaymentPage />} />
                                <Route path="theo-doi-don-hang" element={<OrderTrackingPage />} />
                                <Route path="tai-khoan" element={<UserProfileLayout />}>
                                    <Route path="" element={<UserProfilePage />} />
                                    <Route path="doi-mat-khau" element={<ChangePasswordPage />} />
                                    <Route path="lich-su-don-hang" element={<OrderHistoryPage />} />
                                    <Route path="lich-su-diem" element={<LoyaltyHistoryPage />} />
                                    <Route path="dat-truoc" element={<PreOrderRequestsPage />} />
                                    <Route path="danh-gia-san-pham" element={<ProductReviewsPage />} />
                                    <Route path="vouchers" element={<UserVoucherPage />} />
                                    <Route path="thong-bao" element={<BuyerNotificationsPage />} />
                                </Route>
                                <Route path="dat-hang-1" element={<CheckoutPage />} />
                            </Route>
                        </Route>
                    </Route>
                    <Route path="cua-hang/*" element={<NotFoundPage />} />

                    {/* Supplier */}
                    <Route element={<SupplierProtectedRoute />}>
                        <Route path="/nha-cung-cap" element={<SupplierLayout />}>
                            <Route index element={<DashboardSupplierPage />} />
                            <Route path="san-pham" element={<ProductSupplierPage />} />
                            <Route path="don-hang" element={<OrderSupplierPage />} />
                            <Route path="chung-nhan" element={<CertificationSupplierPage />} />
                            <Route path="thong-tin-ca-nhan" element={<SupplierInfoPage />} />
                            <Route path="danh-muc" element={<CategorySupplierPage />} />
                            <Route path="tat-ca-thong-bao" element={<SupplierNotificationPage />} />
                            <Route path="canh-tac" element={<CultivationSupplierPage />} />
                            <Route path="thong-ke-don-hang" element={<OrderStats />} />
                            <Route path="doanh-thu" element={<RevenuePage />} />
                            <Route path="giam-gia" element={<SupplierDiscountPage />} />
                            <Route path="khach-hang" element={<CustomerSupplierPage />} />
                            <Route path="*" element={<NotFound />} />
                        </Route>
                    </Route>
                    <Route path="/nha-cung-cap/dang-nhap" element={<SupplierLoginPage />} />
                    <Route path="dang-ky-nha-cung-cap" element={<RegisterPage />} />


                    {/* Admin */}
                    <Route path="/quan-tri/dang-nhap" element={<AdminLoginPage />} />
                    <Route element={<AdminProtectedRoute />}>
                        <Route path="/quan-tri" element={<AdminLayout />}>
                            <Route index element={<AdminDashboardPage />} />
                            <Route path="thong-ke" element={<AdminStatisticsPage />} />
                            <Route path="danh-gia-phan-khuc" element={<SegmentModelEvaluationPage />} />
                            <Route path="cau-hinh" element={<SettingPage />} />
                            <Route path="nha-cung-cap" element={<SupplierPage />} />
                            <Route path="tai-chinh-ncc" element={<SupplierFinancePage />} />
                            <Route path="danh-muc" element={<CategoryPage />} />
                            <Route path="san-pham-chuan" element={<ProductMasterPage />} />
                            <Route path="mua-he" element={<SeasonPage />} />
                            <Route path="san-pham" element={<ProductPage />} />
                            <Route path="chung-chi" element={<CertificationPage />} />
                            <Route path="giay-to" element={<DocumentPage />} />
                            <Route path="tat-ca-thong-bao" element={<NotificationPage />} />
                            <Route path="dai-ly" element={<DealerPage />} />
                            <Route path="dai-ly/:id" element={<DetailDealerPage />} />
                            <Route path="khuyen-mai" element={<VoucherPage />} />
                            <Route path="lich-su-huan-luyen-ai" element={<TrainingHistoryPage />} />
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
                            <Route path="dat-truoc" element={<DealerPreOrderPage />} />
                            <Route path="nhap-hang" element={<DealerPurchaseOrderPage />} />
                            <Route path="nhap-hang/tao-moi" element={<DealerCreatePurchaseOrderPage />} />
                            <Route path="nhap-hang/tao-phieu-nhap" element={<DealerPurchaseOrderDetailPage />} />
                            <Route path="nhap-hang/xem-truoc" element={<DealerDraftOrderPreviewPage />} />
                            <Route path="nhap-hang/chi-tiet/:id" element={<DealerPurchaseOrderDetailPage />} />
                            <Route path="nha-cung-cap/:id" element={<DealerSupplierDetailPage />} />
                            <Route path="danh-muc/:id" element={<DealerCategoryDetail />} />
                            <Route path="cau-hinh" element={<DealerInfoPage />} />
                            <Route path="khach-hang" element={<DealerCustomerPage />} />
                            <Route path="san-pham" element={<DealerProductManagementPage />} />
                            <Route path="san-pham/:id" element={<DealerProductDetailPage />} />
                            <Route path="giam-gia" element={<DealerDiscountPage />} />
                            <Route path="du-bao-ai" element={<DealerAiPredictionPage />} />
                            <Route path="thong-ke" element={<DealerStatsPage />} />
                            <Route path="loyalty" element={<DealerLoyaltyPage />} />
                        </Route>
                    </Route>
                    <Route path="dai-ly/dang-nhap" element={<DealerLoginPage />} />
                    <Route path="dai-ly/dang-ky" element={<RegisterDealerPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </NotificationRealtimeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}