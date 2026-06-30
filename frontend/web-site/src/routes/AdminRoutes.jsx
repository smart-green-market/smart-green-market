import React from 'react';
import { Route } from "react-router-dom";
import AdminProtectedRoute from "../contexts/adminProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import {
  AdminLoginPage,
  AdminDashboardPage,
  SettingPage,
  SupplierPage,
  CategoryPage,
  ProductMasterPage,
  ProductPage,
  CertificationPage,
  DocumentPage,
  NotificationPage,
  DealerPage
} from "../pages/Admin";

const AdminRoutes = (
  <>
    <Route path="/quan-tri/dang-nhap" element={<AdminLoginPage />} />
    <Route element={<AdminProtectedRoute />}>
      <Route path="/quan-tri" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="cau-hinh" element={<SettingPage />} />
        <Route path="nha-cung-cap" element={<SupplierPage />} />
        <Route path="danh-muc" element={<CategoryPage />} />
        <Route path="san-pham-chuan" element={<ProductMasterPage />} />
        <Route path="san-pham" element={<ProductPage />} />
        <Route path="chung-chi" element={<CertificationPage />} />
        <Route path="giay-to" element={<DocumentPage />} />
        <Route path="tat-ca-thong-bao" element={<NotificationPage />} />
        <Route path="dai-ly" element={<DealerPage />} />
      </Route>
    </Route>
  </>
);

export default AdminRoutes;
