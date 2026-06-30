import React from 'react';
import { Route } from "react-router-dom";
import DealerProtectedRoute from "../contexts/dealerProtectedRoute";
import DealerLayout from "../layouts/DealerLayout";
import { NotificationPage } from "../pages/Admin";
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
  DealerDraftOrderPreviewPage,
  DealerSupplierDetailPage,
  DealerCategoryDetail,
  DealerInfoPage,
  DealerCustomerPage,
  DealerProductManagementPage,
  DealerProductDetailPage,
  DealerDiscountPage
} from "../pages/Dealer";

const DealerRoutes = (
  <>
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
        <Route path="nhap-hang/xem-truoc" element={<DealerDraftOrderPreviewPage />} />
        <Route path="nhap-hang/chi-tiet/:id" element={<DealerPurchaseOrderDetailPage />} />
        <Route path="nha-cung-cap/:id" element={<DealerSupplierDetailPage />} />
        <Route path="danh-muc/:id" element={<DealerCategoryDetail />} />
        <Route path="cau-hinh" element={<DealerInfoPage />} />
        <Route path="khach-hang" element={<DealerCustomerPage />} />
        <Route path="san-pham" element={<DealerProductManagementPage />} />
        <Route path="san-pham/:id" element={<DealerProductDetailPage />} />
        <Route path="giam-gia" element={<DealerDiscountPage />} />
      </Route>
    </Route>
    <Route path="dai-ly/dang-nhap" element={<DealerLoginPage />} />
    <Route path="dai-ly/dang-ky" element={<RegisterDealerPage />} />
  </>
);

export default DealerRoutes;
