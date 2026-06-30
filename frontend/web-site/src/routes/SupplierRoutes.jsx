import React from 'react';
import { Route } from "react-router-dom";
import SupplierProtectedRoute from "../contexts/supplierProtectedRoute";
import SupplierLayout from "../layouts/SupplierLayout";
import { NotificationPage } from "../pages/Admin";
import {
  OrderSupplierPage,
  ProductSupplierPage,
  CertificationSupplierPage,
  RegisterPage,
  SupplierLoginPage,
  SupplierInfoPage,
  CategorySupplierPage,
  CultivationSupplierPage,
  DashboardSupplierPage,
  NotFound
} from "../pages/Supplier";

const SupplierRoutes = (
  <>
    <Route element={<SupplierProtectedRoute />}>
      <Route path="/nha-cung-cap" element={<SupplierLayout />}>
        <Route index element={<DashboardSupplierPage />} />
        <Route path="san-pham" element={<ProductSupplierPage />} />
        <Route path="don-hang" element={<OrderSupplierPage />} />
        <Route path="chung-nhan" element={<CertificationSupplierPage />} />
        <Route path="thong-tin-ca-nhan" element={<SupplierInfoPage />} />
        <Route path="danh-muc" element={<CategorySupplierPage />} />
        <Route path="tat-ca-thong-bao" element={<NotificationPage />} />
        <Route path="canh-tac" element={<CultivationSupplierPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Route>
    <Route path="/nha-cung-cap/dang-nhap" element={<SupplierLoginPage />} />
    <Route path="dang-ky-nha-cung-cap" element={<RegisterPage />} />
  </>
);

export default SupplierRoutes;
