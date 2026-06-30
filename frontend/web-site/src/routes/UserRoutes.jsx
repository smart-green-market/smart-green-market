import React from 'react';
import { Route } from "react-router-dom";
import UserLayout from "../layouts/UserLayout";
import StorefrontSlugSync from "../layouts/StorefrontSlugSync";
import UserProfileLayout from "../layouts/UserProfileLayout";
import BuyerRouteProtect from "../contexts/buyerRouteProtect";

import {
  HomePage,
  ProductDetailPage,
  ProductsPage,
  CartPage,
  OrderPage,
  PaymentPage,
  UserProfilePage,
  ChangePasswordPage,
  OrderHistoryPage,
  ProductReviewsPage,
  UserLoginPage,
  UserRegisterPage,
  SearchProductPage,
  DealerSlugEntryPage,
  CheckoutPage,
  OrderTrackingPage,
  PoliciesPage,
  SupportPage,
  AboutUsPage
} from "../pages/User";

const UserRoutes = (
  <>
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
            <Route path="danh-gia-san-pham" element={<ProductReviewsPage />} />
          </Route>
          <Route path="dat-hang-1" element={<CheckoutPage />} />
        </Route>
      </Route>
    </Route>
  </>
);

export default UserRoutes;
