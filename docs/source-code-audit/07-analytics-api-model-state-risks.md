# 07 — Chỉ mục analytics, API, model, state machine và rủi ro

> Phạm vi kiểm chứng: `backend/`, `frontend/web-site/src/`, `frontend/mobile/lib/`. Đây là tài liệu tra cứu chéo từ source hiện tại, không lặp lại phần mô tả kiến trúc/nghiệp vụ của các tài liệu 01–06. Prefix business API là `/api/` theo `backend/config/urls.py`.
>
> Quy ước: **KHÔNG TÌM THẤY TRONG SOURCE CODE** nghĩa là đã tìm toàn repository nhưng không có model, route hoặc triển khai tương ứng. “CRUD” bên dưới là các route chuẩn của DRF router: `GET/POST <base>/`, `GET/PUT/PATCH/DELETE <base>/{id}/`; nếu ViewSet giới hạn method thì ghi riêng.

## 1. Analytics/reporting/RFM/segmentation/conversion và FE visualization

| Năng lực / API | Query, annotation, aggregation chính xác | Response / phép tính | FE visualization | Source |
|---|---|---|---|---|
| Dealer dashboard summary `GET /api/dashboard/dealer/summary/` | `Order(dealer, status in completed/delivered)`; `Sum(total_amount)` theo `updated_at` hôm nay/hôm qua; count đơn mới/pending; `DealerInventoryBatch(status=active)` `Sum(remaining_quantity)`; cảnh báo dùng `ExpressionWrapper((expiry_date-import_date)/5)` và `Q(remaining_quantity__lt=10) OR expiry_date <= now.date()+F(duration_20pct)` | `revenue.today/change_percent`, `orders.new_today/pending`, `inventory.total_quantity/new_types_today`, `alerts.count` | 4 cards trong `frontend/web-site/src/pages/Dealer/Dashboard.jsx` | `backend/apps/dashboard/views.py:71-164`; service `frontend/web-site/src/services/api/dashboard.js` |
| Dealer revenue 7 ngày `GET /api/dashboard/dealer/revenue-chart/` | Filter completed/delivered, `updated_at__gte=start_date`; `annotate(date=TruncDate("updated_at")).values("date").annotate(total=Sum("total_amount"))`; bù ngày thiếu bằng 0 | `[{date,revenue}]` | Custom column chart `RevenueChart`; FE đổi ngày thành CN/T2… và triệu đồng | `backend/apps/dashboard/views.py:182-216`; `frontend/web-site/src/pages/Dealer/Dashboard.jsx:59-69,173-179` |
| Dealer top products `GET /api/dashboard/dealer/top-products/` | `OrderItem` completed/delivered, group `dealer_product id/title/category`; `Sum(quantity)`, `Sum(subtotal)`, sort `-total_revenue`, top 10; mỗi dòng lại `Sum(remaining_quantity)` batch active | `id,name,category,sales,revenue,current_stock` | `TopProducts` | `backend/apps/dashboard/views.py:238-279`; `frontend/web-site/src/pages/Dealer/Dashboard.jsx` |
| Dealer purchase summary `GET /api/dashboard/dealer/purchase-summary/` | `PurchaseOrder(dealer)`; count; completed/delivered `Sum(total_amount)`; `PurchaseOrderItem Sum(quantity)`; distinct supplier count; status counts | 7 chỉ số phiếu nhập | Custom donut `PurchaseDonutChart` | `backend/apps/dashboard/views.py:301-355`; `frontend/web-site/src/pages/Dealer/Dashboard.jsx:188` |
| Supplier summary `GET /api/dashboard/supplier/summary/` | completed/delivered `PurchaseOrder`; tháng hiện tại `Sum(total_amount)` theo `updated_at`; count đơn tạo trong tháng/pending supplier; count `SupplierProduct(active)` | revenue/orders/products | Trang Supplier **không gọi summary**, tự ghép order list + các API khác | `backend/apps/dashboard/views.py:398-449`; `frontend/web-site/src/pages/Supplier/DashBoard.jsx` |
| Supplier revenue 6 tháng `GET /api/dashboard/supplier/revenue-chart/` | completed/delivered; `annotate(month=TruncMonth("updated_at")).values("month").annotate(total=Sum("total_amount"))`; bù tháng thiếu 0 | `[{month,revenue}]` | Custom `Sparkline`; có fallback mock `REVENUE_DATA` | `backend/apps/dashboard/views.py:467-507`; `frontend/web-site/src/pages/Supplier/DashBoard.jsx:65-96,323-334` |
| Supplier top products `GET /api/dashboard/supplier/top-products/` | `PurchaseOrderItem` completed/delivered, group supplier product; `Sum(quantity/subtotal)`, top 10 | `id,name,category,sales,revenue` | Progress bars top 4; `% = revenue sản phẩm / tổng revenue của top-10 response`, không phải toàn bộ catalog | `backend/apps/dashboard/views.py:528-556`; `frontend/web-site/src/pages/Supplier/DashBoard.jsx:284-311` |
| Admin summary/charts/top `GET /api/dashboard/admin/{summary,revenue-chart,top-dealers,top-suppliers,top-products}/` | Summary: `Order` completed/delivered tháng hiện tại `Sum(total_amount)`; account active counts; buyer mới. Chart: `TruncMonth(updated_at)+Sum(total_amount)`. Top dealer/supplier: group + `Sum(total_amount), Count(id)`. Top product: hai query B2C/B2B, mỗi bên top 10 rồi merge-sort top 10 | Các inline serializer trong view | `frontend/web-site/src/services/api/Admin/adminDashboardService.js` có client; nhưng `frontend/web-site/src/pages/Admin/Dashboard.jsx` không dùng client này mà tải 5 danh sách moderation và tính ở FE | `backend/apps/dashboard/views.py:559-847` |
| Báo cáo dealer `GET /api/statistical/dealer/statistics/?start_date=&end_date=&group_by=day|week|month` | Orders/PO completed/delivered theo `created_at__date__range`; `Sum(total_amount)`, count; `TruncDate/TruncWeek/TruncMonth`; category `Sum(subtotal)`; wastage `ExpressionWrapper(F(quantity)*F(batch__import_price), DecimalField())` + `Sum`; PO return approved `Sum(refund_amount)` và return item `Sum(quantity)` | `metrics`, `chart_data`, `category_distribution`, `wastage_stats`, `detailed_breakdown`; `gross_profit = retail revenue - tổng giá trị PO`, không phải COGS theo `OrderItem.import_price` | Cards; custom grouped bars bằng CSS; progress bars ngành hàng; bảng; export CSV phía client | `backend/apps/statistical/views.py`; `frontend/web-site/src/pages/Dealer/Stats.jsx`; `frontend/web-site/src/services/api/statisticalService.js` |
| Customer interaction conversion (pipeline AI) | `Order` group customer: `Max(created_at)`, `Count(id, filter created_at>=start)`, `Sum(total_amount, filter...)` **không lọc status**. `CustomerInteraction` group customer: `Sum(view_count)`, `Sum(purchase_count)`. `conversion_rate = purchases/views`, làm tròn 4 số | Feature: `last_order,total_order,total_spent,conversion_rate,raw_views,raw_purchases` | Dealer Customer page gọi pipeline; không có chart phân cụm | `backend/apps/training_models/services/customer_segmentation.py:14-104`; `frontend/web-site/src/services/api/customerService.js:32-44` |
| RFM + Bisecting K-Means `POST /api/customer-segmentation/` | Min-max: `R=(Rmax-R)/(Rmax-Rmin+1e-8)`, F/M thuận; `RFM_score=0.3R+0.2F+0.5M`; input chuẩn hóa z-score `[RFM_score, conversion_rate]`; bisect cụm SSE lớn nhất đến `k=4`; label theo mean `RFM_score+conversion_rate`; silhouette pairwise TensorFlow | Ghi `CustomerSegmentMember` và `CustomerSegmentationHistory` trong `transaction.atomic`; response chỉ `success,message,customer_count` | Nút/chức năng chạy phân khúc ở web; danh sách segment từ profile/customer serializers; **không có visualization cluster/silhouette** | `backend/apps/training_models/views.py:27-114`; `backend/apps/training_models/services/customer_segmentation.py` |
| Snapshot conversion khác (không nối trực tiếp API ở source) | Chỉ completed, `completed_at` trong kỳ; `Count`, `Sum`, `Max`; click `Sum(view_count)` với `last_viewed_at`; `Conversion_rate=Total_order/Total_click*100` | Key viết hoa `Last_order,Total_order,Total_spent,Conversion_rate` | **KHÔNG TÌM THẤY TRONG SOURCE CODE** nơi FE/API gọi hàm | `backend/apps/marketing/customer_metrics.py` |
| Customer segments CRUD/list | Không aggregation; segment hệ thống dùng chung, membership qua customer profile | Dealer read-only; Admin CRUD; system segment không sửa/xóa | Web chỉ `GET /customer-segments/`; không có trang phân tích segment độc lập | `backend/apps/marketing/views.py`; `frontend/web-site/src/services/api/customerSegmentService.js` |
| Mobile analytics/reporting/RFM/conversion | **KHÔNG TÌM THẤY TRONG SOURCE CODE** | — | Mobile chỉ buyer storefront/order/preorder/voucher/review/notification; không có dashboard/statistical/segmentation | `frontend/mobile/lib/` |

### Điểm lệch định nghĩa metric cần lưu ý

| ID | Lệch / rủi ro | Bằng chứng source |
|---|---|---|
| A-01 | “Doanh thu” dùng cả `delivered` và `completed`; buyer COD chỉ được đánh dấu paid ở `completed`, nên có thể ghi nhận trước thu tiền. | `backend/apps/dashboard/views.py`; `backend/apps/orders/services.py:_mark_cod_paid` |
| A-02 | Mốc thời gian không thống nhất: dashboard dùng `updated_at`, statistical dùng `created_at`, snapshot conversion dùng `completed_at`, AI segmentation dùng `created_at`. | Các file ở bảng trên |
| A-03 | “Gross profit” của statistical là doanh thu retail trừ toàn bộ PO hoàn tất trong cùng kỳ, không đối ứng hàng đã bán; `OrderItem.import_price` có nhưng không được dùng. | `backend/apps/statistical/views.py:127-153`; `backend/apps/orders/models.py:181-187` |
| A-04 | AI `load_data()` tính mọi Order bất kể cancelled/returned/pending; snapshot `customer_metrics.py` chỉ completed. Hai conversion lần lượt là tỷ lệ 0–1 và phần trăm 0–100. | `customer_segmentation.py:43-50,89-93`; `customer_metrics.py:31-43,69-71` |
| A-05 | Supplier dashboard card ghi cứng “Doanh thu tháng 6”, dù API trả rolling 6 tháng và ngày hiện tại có thể khác. | `frontend/web-site/src/pages/Supplier/DashBoard.jsx:609-611` |
| A-06 | Supplier top-product `%` lấy mẫu số là tổng của danh sách top API, nên nhãn phần trăm dễ bị hiểu nhầm là tỷ trọng toàn doanh thu. | `frontend/web-site/src/pages/Supplier/DashBoard.jsx:284-310` |
| A-07 | Admin dashboard API đã có nhưng trang dashboard hiện tại không sử dụng; trang thống kê Admin cần kiểm tra riêng component `StatisticsDataSection`, không phải dashboard này. | `frontend/web-site/src/pages/Admin/Dashboard.jsx`; `frontend/web-site/src/services/api/Admin/adminDashboardService.js` |

## 2. Bảng API toàn dự án

### 2.1 Auth, hồ sơ, catalog và quản trị

| Module | Endpoint / method | Role / scope | View.action | Request serializer | Response |
|---|---|---|---|---|---|
| accounts | `POST /api/register/` | AllowAny | `RegisterView.post` | `RegisterSerializer` | `{message,data}` account; 201 |
| accounts | `POST /api/login/` | AllowAny | `LoginView` | `CustomTokenObtainPairSerializer` | access/refresh + `account` |
| accounts | `POST /api/refresh/`; `POST /api/verify/` | token | SimpleJWT views | JWT built-in | token / verify result |
| accounts | `POST /api/logout/` | authenticated | `LogoutView.post` | `LogoutSerializer` | detail |
| accounts | `GET/PUT /api/profile/` | authenticated | `ProfileView.get/put` | `ProfileSerializer` | `ProfileSerializer` |
| accounts | `POST/DELETE /api/profile/avatar/` | authenticated | `AvatarView.post/delete` | `AvatarUploadSerializer` / none | `ProfileSerializer` |
| accounts | `POST /api/change-password/` | authenticated | `ChangePasswordView.post` | `ChangePasswordSerializer` | detail |
| account documents | CRUD `/api/account-documents/` | Admin all; Supplier/Dealer own; verify Admin | `AccountDocumentViewSet` | create `AccountDocumentBulkUploadSerializer`; update `AccountDocumentSerializer` | list `AccountDocumentListSerializer`; create array `AccountDocumentReadSerializer` |
| account documents | `POST /api/account-documents/{id}/verify/` | Admin | `verify` | `VerifyAccountDocumentSerializer` | `AccountDocumentListSerializer` |
| dealers | CRUD `/api/dealers/` | Admin read; Dealer own create/write/delete | `DealerProfileViewSet` | `DealerProfileSerializer` | list/detail `DealerProfileList/DetailSerializer` |
| dealers | `GET /api/dealers/me/`; `GET /api/dealers/me/storefront-link/` | Dealer | `me`, `storefront_link` | none | detail / `DealerStorefrontLinkSerializer` shape |
| dealers | `POST /api/dealers/{id}/verify/`; `POST .../account-status/` | Admin | `verify`, `account_status` | `VerifyDealerSerializer`; `SupplierAccountStatusSerializer` | `DealerProfileDetailSerializer` |
| dealers | `GET /api/dealers/{id}/{documents,categories,products}/` | documents Admin/Dealer-own; catalog active user | corresponding action | query/pagination | paginated document/category/product serializers |
| suppliers | CRUD `/api/suppliers/` | Admin read; Supplier own write; Dealer sees approved active catalog | `SupplierViewSet` | `SupplierSerializer` | role-dependent `SupplierList/Detail/Catalog*Serializer` |
| suppliers | `POST /api/suppliers/{id}/verify/`; `POST .../account-status/` | Admin | `verify`, `account_status` | `VerifySupplierSerializer`; `SupplierAccountStatusSerializer` | `SupplierDetailSerializer` |
| suppliers | `GET /api/suppliers/{id}/{products,categories,documents}/` | Admin/Dealer; documents Admin/Supplier owner | actions | query params | paginated list serializers |
| suppliers | `POST /api/suppliers/{id}/interactions/` | active Dealer | `track_catalog_interaction` | `DealerCatalogInteractionTrackSerializer` | `InteractionTrackResponseSerializer` |
| supplier finance | `GET /api/suppliers/finance-overview/`; `GET /api/suppliers/finance/` | Admin | APIViews | query `start_date,end_date,...` | `SupplierFinanceOverviewSerializer`; paginated finance rows |
| categories | CRUD `/api/categories/` | active; visibility by role; mutation owner/Admin | `CategoryViewSet` | `CategorySerializer` | list `CategoryListSerializer` |
| categories | `POST /api/categories/{id}/{verify,lock,unlock}/`; `POST /api/categories/reorder/` | Admin | actions | `VerifyCategorySerializer` / none / `CategoryReorderSerializer` | category serializer(s) |
| product catalog | CRUD `/api/product-masters/` | active read; Admin write | `ProductMasterViewSet` | `ProductMasterWriteSerializer` | `ProductMasterListSerializer` |
| supplier products | CRUD `/api/supplier-products/` | active; Admin all, Supplier own, Dealer active approved catalog | `SupplierProductViewSet` | `SupplierProductSerializer` | list/detail `SupplierProductList/DetailSerializer` |
| supplier products | `POST /api/supplier-products/{id}/verify/` | Admin | `verify` | `VerifySupplierProductSerializer` | `SupplierProductListSerializer` |
| supplier product images | CRUD `/api/supplier-product-images/` | Admin/Supplier owner | `SupplierProductImageViewSet` | create bulk upload serializer | image serializer / array |
| cultivation | CRUD `/api/cultivation-processes/` | Admin/Supplier owner | `CultivationProcessViewSet` | `CultivationProcessSerializer` | same |
| quantity discounts | CRUD `/api/quantity-discount-policies/` | Admin/Supplier view; Supplier owner mutation | `QuantityDiscountPolicyViewSet` | write serializer | list/detail serializers |
| dealer products | CRUD `/api/dealer-products/` | active; Admin all, Dealer own; verify Admin | `DealerProductViewSet` | `DealerProductSerializer` | list/detail serializers |
| dealer products | `POST /api/dealer-products/{id}/verify/` | Admin | `verify` | `VerifyDealerProductSerializer` | `DealerProductListSerializer` |
| dealer images | CRUD `/api/dealer-product-images/` | Admin/Dealer owner | `DealerProductImageViewSet` | `DealerProductImageSerializer` multipart | same |
| inventory | `GET /api/dealer-inventory-batches[/\{id\}/]` | Admin/Dealer owner | readonly ViewSet | query filters | `DealerInventoryBatchSerializer` |
| inventory | `POST /api/dealer-inventory-batches/{id}/{record-wastage,set-expiry-date,recompute-expiry-date,set-sale-price,clear-sale-price}/` | Admin/Dealer owner | actions | action-specific serializer/none | batch detail |
| inventory | `POST /api/dealer-inventory-batches/backfill-expiry-dates/` | Admin or scoped Dealer | action | backfill fields | counts + skipped batches |
| inventory | `GET /api/dealer-inventory-transactions[/\{id\}/]` | Admin/Dealer owner | readonly | query | `DealerInventoryTransactionSerializer` |
| age discounts | CRUD `/api/age-discount-policies/` | Admin/Dealer read; Dealer mutate own | `AgeDiscountPolicyViewSet` | `AgeDiscountPolicyWriteSerializer` | list/detail |
| related recommendation | `GET /api/dealer-product-related-recommendations/`; `GET /api/dealer-products/{product_id}/related-recommendation/` | active Admin/Dealer scoped | readonly ViewSet / APIView | optional `dealer_product` | `DealerProductRelatedRecommendationSerializer` |
| certifications | CRUD `/api/certifications/` | Admin/Supplier owner | `CertificationViewSet` | create/write serializers multipart | list/read serializers |
| certifications | `POST /api/certifications/{id}/verify/`; `POST .../revoke/`; `GET .../audit-history/` | Admin | actions | `VerifyCertificationSerializer`; `RevokeCertificationSerializer` | certification / paginated audit |
| certification images | CRUD `/api/certification-images/` | active Admin/Supplier owner | `CertificationImageViewSet` | bulk/single image serializer | image serializer(s) |
| reviews dealer | `GET /api/dealer-product-reviews/`; `GET .../{id}/` | Admin/Dealer owner | APIViews | search/filter query | list/detail review serializers |
| config | `GET /api/banks/`; `GET /api/purchase-order-config/`; `GET /api/customer-order-config/` | configured API permissions | APIViews | none | bank/business-rule payloads |
| config | `GET/PATCH /api/system-config/` | GET authenticated; PATCH Admin | `SystemConfigView` | `SystemSettingsSerializer` | same |

### 2.2 Purchase order, buyer order, storefront, marketing

| Module | Endpoint / method | Role / scope | View.action | Request serializer | Response |
|---|---|---|---|---|---|
| PurchaseOrder | `GET/POST /api/purchase-orders/`; `GET /api/purchase-orders/{id}/` | list Admin/Supplier/Dealer scoped; create Dealer | `list/create/retrieve` | `PurchaseOrderCreateSerializer` | paginated `PurchaseOrderListSerializer`; create `{orders:[PurchaseOrderDetailSerializer]}` |
| PurchaseOrder | `POST .../{id}/confirm/` | owning Supplier | `confirm` | `SupplierConfirmSerializer` | detail |
| PurchaseOrder | `POST .../{id}/approve-adjustment/` | owning Dealer | `approve_adjustment` | `NoteSerializer` | detail |
| PurchaseOrder | `POST .../{id}/reject/` | owning Supplier | `reject` | `SupplierRejectSerializer` | detail |
| PurchaseOrder | `GET .../{id}/payment-qr/?payment_type=deposit|final_payment` | owning Dealer hoặc Admin | `payment_qr` | query | `PaymentQrSerializer` |
| PurchaseOrder | `POST .../{id}/submit-deposit/`; `POST .../submit-final-payment/` | owning Dealer | actions | multipart `SubmitPaymentSerializer` | `PurchaseOrderPaymentReadSerializer`, 201 |
| PurchaseOrder | `POST .../{id}/verify-payment/` | owning Supplier | `verify_payment` | `VerifyPaymentSerializer` | payment read |
| PurchaseOrder | `POST .../{id}/ship/` | owning Supplier | `ship` | `NoteSerializer` | detail |
| PurchaseOrder | `POST .../{id}/confirm-delivery/` | owning Dealer | `confirm_delivery` | `NoteSerializer` | detail |
| PurchaseOrder | `POST .../{id}/cancel/` | owning Dealer hoặc Admin | `cancel` | `CancelOrderSerializer` | detail |
| PurchaseOrder return | `POST .../{id}/request-return/` | owning Dealer | `request_return` | `RequestPurchaseOrderReturnSerializer` JSON/multipart | `PurchaseOrderReturnReadSerializer`, 201 |
| PurchaseOrder return | `POST .../{id}/returns/{return_id}/review/` | owning Supplier | `review_return` | `ReviewReturnSerializer` | return read |
| Buyer order management | `GET /api/customer-orders/`; `GET .../{id}/` | Admin/Dealer scoped | `CustomerOrderViewSet.list/retrieve` | query | paginated list/detail |
| Buyer order management | `POST .../{id}/{confirm,start-processing,ship}/` | owning Dealer | actions | `NoteSerializer` | `OrderDetailSerializer` |
| Buyer order management | `POST .../{id}/propose-delivery-reschedule/` | owning Dealer | action | `ProposeDeliveryRescheduleSerializer` | detail |
| Buyer order management | `POST .../{id}/cancel/` | owning Dealer/Admin | `cancel` | `CancelOrderSerializer` | detail |
| Buyer return | `POST .../{id}/returns/{return_id}/review/` | owning Dealer/Admin | `review_return` | `ReviewReturnSerializer` | `OrderReturnReadSerializer` |
| Dealer preorder management | `GET /api/preorder-requests/`; `GET .../{id}/` | Dealer scoped | list/retrieve | none/query | preorder list/detail |
| Dealer preorder management | `POST .../{id}/{confirm,propose,reject}/` | owning Dealer | actions | note / `PreOrderProposeSerializer` / `PreOrderRejectSerializer` | preorder detail |
| Storefront auth | `POST /api/storefronts/{slug}/{register,login}/` | AllowAny | APIViews | `StorefrontRegisterSerializer`; `StorefrontLoginSerializer` | auth session |
| Storefront catalog | `GET /api/storefronts/{slug}/`; `categories/`; `products/`; `products/bestsellers/`; `products/{id}/`; `products/{id}/related/` | public/AllowAny | catalog APIViews | query filters | storefront serializers |
| Storefront profile | `GET/PUT/PATCH /api/storefronts/{slug}/me/` | buyer đúng storefront | profile ViewSet mapping | `CustomerProfileUpdateSerializer` | `CustomerProfileSerializer` |
| Storefront addresses | `GET/POST .../addresses/`; `GET/PUT/PATCH/DELETE .../addresses/{id}/` | buyer owner | address ViewSet mapping | `CustomerAddressSerializer` | same/paginated |
| Storefront orders | `GET/POST .../orders/`; `GET .../orders/{id}/` | buyer đúng storefront và owner | APIViews | `OrderCreateSerializer` | list/detail |
| Storefront orders | `POST .../orders/{id}/{confirm-received,cancel,accept-delivery-reschedule,reject-delivery-reschedule,request-return}/` | buyer owner | APIViews | note/cancel/return serializers tùy action | order detail hoặc return read |
| Storefront preorder | `POST .../check-stock/`; `GET/POST .../preorder-requests/`; `GET .../{id}/`; `POST .../{id}/{accept,reject}/` | buyer owner | preorder APIViews | check/create/reject serializers | stock list / preorder / converted order |
| Storefront reviews | `GET/POST .../reviews/`; `GET/PATCH/DELETE .../reviews/{id}/`; image POST/DELETE; pending list; product review list/summary | public read product; buyer owner write | review APIViews | review create/update/image serializers | review/list/summary |
| Interaction | `POST /api/storefronts/{slug}/interactions/` | storefront buyer | `StorefrontInteractionTrackView.post` | `InteractionTrackSerializer` | `InteractionTrackResponseSerializer` |
| Dealer customers | `GET /api/dealer-customers/`; `GET/PUT/PATCH .../{id}/` | Admin/Dealer scoped | `DealerCustomerViewSet` | note serializer for write | list/detail customer |
| Voucher | CRUD `/api/vouchers/` | Admin/Dealer scoped | `PromotionViewSet` | `PromotionSerializer` | same |
| Voucher buyer | `GET /api/vouchers/{available,saved}/`; `POST /api/vouchers/{id}/save/`; `DELETE .../unsave/`; `POST /api/vouchers/apply/` | active Buyer, storefront from token | actions | available params / apply serializers | available/saved/apply payload |
| Voucher verify | `POST /api/vouchers/{id}/verify/` | Admin | `verify` | `VerifyPromotionSerializer` | promotion |
| Customer segments | CRUD `/api/customer-segments/` | Admin CRUD; Dealer list/retrieve | `CustomerSegmentViewSet` | `CustomerSegmentSerializer` | same/paginated |
| Notifications | CRUD `/api/notifications/` | Admin | `NotificationViewSet` | `NotificationSerializer` | same/paginated |
| Notifications | `GET /api/notifications/my/`; `POST .../{id}/mark_read/`; `POST .../mark_all_read/` | authenticated recipient | actions | none | feed with unread; mark result/message |

### 2.3 Dashboard, AI và schema

| Module | Endpoint / method | Role | View/action | Request | Response |
|---|---|---|---|---|---|
| dashboard dealer | `GET /api/dashboard/dealer/{summary,revenue-chart,top-products,purchase-summary}/` | authenticated + runtime dealer profile check | `DealerDashboardViewSet` | none | inline shapes ở §1 |
| dashboard supplier | `GET /api/dashboard/supplier/{summary,revenue-chart,top-products}/` | authenticated + runtime supplier profile check | `SupplierDashboardViewSet` | none | inline shapes |
| dashboard admin | `GET /api/dashboard/admin/{summary,revenue-chart,top-dealers,top-suppliers,top-products}/` | authenticated + runtime role check | `AdminDashboardViewSet` | none | inline shapes |
| statistical | `GET /api/statistical/dealer/statistics/` | authenticated + runtime dealer profile | `DealerStatisticalViewSet.statistics` | query dates/group | aggregate payload §1 |
| segmentation | `POST /api/customer-segmentation/` | Admin/Dealer; Dealer phải đúng `dealer_id` | `CustomerSegmentationView.post` | `CustomerSegmentationRequestSerializer` | success/message/count |
| related AI | `POST /api/train-related-products/`; `POST /api/sync-related-products/` | Admin | APIViews | none | success/message |
| dealer AI | `POST /api/dealer/train/`; `POST /api/dealer/analyze/`; `GET /api/dealer/recommendations/` | authenticated; scope kiểm tra trong views/services | APIViews | dealer_id / query | training/analysis/recommendations |
| AI index | `GET /api/` route từ `training_models` bị xung đột với nhiều include cùng prefix | permission mặc định | function `index` | none | `"AI index"` nếu resolver tới route này |
| docs | `GET /api/schema/`, `/api/docs/`, `/api/redoc/` | theo DRF settings | drf-spectacular | — | OpenAPI/UI |

## 3. Bảng model/table/relationship

| App | Model → db_table | Quan hệ chính / ràng buộc đáng chú ý |
|---|---|---|
| accounts | `Account` → `Accounts` | FK `store_dealer→DealerProfile`; unique conditional email global cho admin/supplier/dealer; `(store_dealer,email)` cho buyer |
| accounts | `AccountDocument` → `account_documents` | FK account, verified_by; unique `(account,document_type)` |
| accounts | `LoginAttempt` → `login_attempts` | username unique |
| suppliers | `Supplier` → `supplier` | O2O account; FK verified_by |
| dealers | `DealerProfile` → `dealer_profiles` | O2O account; FK verified_by |
| customers | `CustomerProfile` → `customer_profiles` | O2O user; FK favorite_category |
| customers | `CustomerAddress` → `customer_addresses` | FK customer; conditional/default-address constraint trong model |
| categories | `Category` → `categories` | FK created_by, verified_by; system/custom ownership |
| product_catalog | `ProductMaster` → `product_masters` | FK category; unique catalog naming constraint |
| supplier_products | `SupplierProduct` → `supplier_products` | FK supplier/category/product_master/verified_by; unique supplier+slug và supplier+non-null master |
| supplier_products | `SupplierProductImage` → `supplier_product_images` | FK supplier_product |
| supplier_products | `CultivationProcess` → `cultivation_processes` | FK supplier_product; unique `(supplier_product,step_order)` |
| supplier_products | `QuantityDiscountPolicy` → `quantity_discount_policies` | FK supplier/category/supplier_product; scope ALL/CATEGORY/SUPPLIER_PRODUCT |
| supplier_products | `QuantityDiscountTier` → `quantity_discount_tiers` | FK policy; tier thresholds |
| dealer_products | `DealerProduct` → `dealer_products` | FK dealer_profile/supplier_product/product_master/category; unique active-ish per dealer+master hoặc case-insensitive title |
| dealer_products | `DealerProductImage` → `dealer_product_images` | FK dealer_product |
| dealer_products | `DealerInventoryBatch` → `dealer_inventory_batches` | FK dealer_product, nullable PO item; unique `(dealer_product,batch_number)` |
| dealer_products | `DealerInventoryWastage` → `dealer_inventory_wastages` | FK batch, created_by |
| dealer_products | `DealerInventoryTransaction` → `dealer_inventory_transactions` | FK batch, created_by; before/change/after ledger |
| dealer_products | `DealerProductRelatedRecommendation` → `dealer_product_related_recommendations` | O2O dealer_product; Postgres `ArrayField` related IDs, không FK từng phần tử |
| dealer_products | `AgeDiscountPolicy` → `age_discount_policies` | FK dealer/category/dealer_product |
| purchase_orders | `PurchaseOrder` → `purchase_orders` | FK supplier/dealer/cancelled_by |
| purchase_orders | `PurchaseOrderItem` → `purchase_order_items` | FK PO/supplier_product; snapshot giá/discount/review |
| purchase_orders | `PurchaseOrderPayment` → `purchase_order_payments` | FK PO/verified_by; **không có unique transaction code** |
| purchase_orders | `PurchaseOrderStatusHistory` → `purchase_order_status_histories` | FK PO/changed_by |
| purchase_orders | `PurchaseOrderReturn` → `purchase_order_returns` | FK PO/requested_by/reviewed_by |
| purchase_orders | `PurchaseOrderReturnItem` → `purchase_order_return_items` | FK return/PO item |
| orders | `Order` → `orders` | FK customer/dealer/address/cancelled_by |
| orders | `OrderItem` → `order_items` | FK order/dealer_product; nullable batch khi waiting_stock |
| orders | `OrderStatusHistory` → `order_status_histories` | FK order/changed_by |
| orders | `CustomerPayment` → `customer_payments` | FK order/verified_by; unique conditional `(provider,transaction_code)` |
| orders | `OrderReturn` → `order_returns` | FK order/requested_by/reviewed_by |
| orders | `OrderReturnItem` → `order_return_items` | FK return/order_item |
| orders | `PreOrderRequest` → `preorder_requests` | FK customer/dealer/address/converted_order |
| orders | `PreOrderRequestItem` → `preorder_request_items` | FK preorder/dealer_product |
| reviews | `ProductReview` → `product_reviews` | FK customer/dealer/dealer_product/order; unique review constraint |
| reviews | `ReviewImage` → `review_images` | FK review |
| reviews | `ProductRecommendation` → `product_recommendations` | FK customer/dealer/dealer_product; unique recommendation scope |
| certifications | `Certification` → `certifications` | FK supplier/verified_by/revoked_by |
| certifications | `CertificationImage` → `certification_images` | FK certification |
| certifications | `CertificationAuditLog` → `certification_audit_logs` | FK certification/performed_by |
| certifications | `SupplierProductCertification` → `supplier_product_certifications` | join FK supplier_product + certification |
| promotions | `Promotion` → `promotions` | FK dealer/created_by; code unique theo dealer |
| promotions | `PromotionTarget` → `promotion_targets` | FK promotion và nullable segment/dealer_product/category/customer |
| promotions | `PromotionUsage` → `promotion_usages` | FK promotion/order; unique usage constraint |
| promotions | `CustomerSavedVoucher` → `customer_saved_vouchers` | FK customer/promotion; unique pair |
| marketing | `CustomerSegment` → `customer_segments` | code unique, segment hệ thống dùng chung |
| marketing | `CustomerSegmentMember` → `customer_segment_members` | FK customer_profile/segment; unique pair |
| marketing | `CustomerSegmentationHistory` → `marketing_customer_segmentation_history` | `dealer_id` là integer, **không phải FK** |
| marketing | `CustomerInteraction` → `customer_interactions` | FK customer/dealer/dealer_product; unique `(customer,dealer_product)` |
| marketing | `DealerSupplierProductInteraction` → `dealer_supplier_product_interactions` | FK dealer/supplier/supplier_product; unique `(dealer,supplier_product)` |
| notifications | `Notification` → tên mặc định Django (Meta không đặt `db_table`) | FK created_by; nội dung + reference type/id polymorphic không FK |
| notifications | `NotificationReceipt` → tên mặc định Django | FK notification/account; unique pair |
| system_config | `SystemSettings` → `system_settings` | FK updated_by; singleton do service quản lý |
| training_models | `ProductPredictionResult` → `dealer_product_prediction_results` | dealer/product lưu dạng ID; unique_together |
| training_models | `AITrainingHistory` → `ai_training_history` | lịch sử train |
| dashboard/statistical | `models.py` không định nghĩa model | **KHÔNG TÌM THẤY TRONG SOURCE CODE** bảng riêng |
| inventory reservation | `InventoryReservation` | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |

## 4. State-transition index

### 4.1 Account, Supplier verification, SupplierProduct

| Aggregate | From → To | Actor / trigger | Guard / side effect | Source |
|---|---|---|---|---|
| Account | create → `active` | register Buyer | role buyer | `backend/apps/accounts/serializers.py:165-175` |
| Account | create → `pending` | register Supplier/Dealer | chờ hồ sơ/giấy tờ | cùng file |
| Account | `pending→active` | Admin approve Supplier/Dealer profile | phải đủ 3 document approved; profile cũng approved/active | `suppliers/views.py:376-422`; `dealers/views.py:314-362` |
| Account | `*→pending` | Admin reject Supplier/Dealer profile | profile rejected; notification | cùng files |
| Account | `*→active|inactive|banned` | Admin `account-status` | status body; login chặn inactive/banned | supplier/dealer views; `accounts/serializers.py:46-49` |
| Supplier verification | create/default → `pending` | Supplier tạo profile | — | `backend/apps/suppliers/models.py` |
| Supplier verification | `pending/rejected→approved` | Admin verify | đủ giấy tờ approved; account pending→active | `backend/apps/suppliers/views.py:376-422` |
| Supplier verification | `pending/approved→rejected` | Admin verify | reason bắt buộc; account→pending | cùng file |
| SupplierProduct | create → `pending` | Supplier create | owner supplier | `backend/apps/supplier_products/serializer.py:548-552` |
| SupplierProduct | `*→active|rejected|inactive` | Admin verify | reason bắt buộc rejected/inactive; audit fields + notify | `backend/apps/supplier_products/views.py:305-336` |
| SupplierProduct | non-deleted → `deleted` | owner/Admin DELETE | chặn PO active hoặc dealer product tham chiếu; soft delete | `backend/apps/supplier_products/archive.py` |
| SupplierProduct | `inactive/rejected→pending` khi Supplier sửa | **KHÔNG TÌM THẤY TRONG SOURCE CODE** chuyển tự động rõ ràng | update serializer giữ status read-only | serializer/views |

### 4.2 PurchaseOrder và PO Payment

| From | To | Trigger / actor | Side effect |
|---|---|---|---|
| ∅ | `pending_supplier_confirmation` | Dealer create | split theo supplier; snapshot item/discount; history/notify |
| `pending_supplier_confirmation` | `confirmed` | Supplier confirm không điều chỉnh | review item, deposit%, delivery time |
| `pending_supplier_confirmation` | `pending_dealer_confirmation` | Supplier đổi ngày/quantity/reject item | Dealer cần approve |
| `pending_dealer_confirmation` | `confirmed` | Dealer approve adjustment | history |
| `pending_supplier_confirmation` | `rejected` | Supplier reject | terminal |
| `confirmed` | `deposit_pending_verification` | Dealer submit deposit | Payment `pending` |
| `deposit_pending_verification` | `processing` | Supplier verify deposit | Payment `verified`; refresh paid/debt |
| `deposit_pending_verification` | `confirmed` | Supplier reject deposit | Payment `rejected`, nộp lại |
| `processing` | `shipping` | Supplier ship | history/notify |
| `shipping` | `delivered` | Dealer confirm delivery | set delivered_at |
| `delivered` | `final_payment_pending_verification` | Dealer submit final | Payment `pending` amount=debt |
| `final_payment_pending_verification` | `completed` | Supplier verify final | Payment verified; import dealer inventory MAIN; allocate waiting orders |
| `final_payment_pending_verification` | `delivered` | Supplier reject final | Payment rejected |
| `pending_supplier_confirmation|pending_dealer_confirmation|confirmed` | `cancelled` | Dealer; Admin từ mọi non-terminal | pending payment→cancelled |
| `delivered` | `return_requested` | Dealer request return | return requested + computed refund |
| `return_requested` | `delivered` | Supplier reject hoặc approve partial | return rejected/approved; adjust total/debt |
| `return_requested` | `returned` | Supplier approve full | terminal |

Ghi chú enum không có transition runtime: `deposit_paid`, `return_approved`, `return_rejected` được khai báo trong `PurchaseOrderStatus` nhưng **KHÔNG TÌM THẤY TRONG SOURCE CODE** nơi service gán các trạng thái này. Source chuẩn: `backend/apps/purchase_orders/models.py`, `services.py`.

PO Payment: `pending→verified|rejected`; `pending→cancelled` khi PO bị hủy. Không có chuyển ngược payment; retry tạo payment mới.

### 4.3 Buyer Order, InventoryReservation, InventoryBatch

| Aggregate | From → To | Trigger / actor | Side effect |
|---|---|---|---|
| Buyer Order thường | ∅→`pending` | Buyer create | atomic; lock batch sellable; trừ kho; ledger SALE; COD pending |
| Buyer Order | `pending→confirmed→processing→shipping→completed` | Dealer confirm/process/ship; Buyer confirm received | completed set delivered/completed, COD paid, customer stats |
| Buyer Order preorder | ∅→`waiting_stock` | preorder converted | item.batch null, không trừ kho |
| Buyer Order | `waiting_stock→processing` | import kho + đủ toàn bộ item | gắn batch, cập nhật giá, trừ kho |
| Buyer Order | `waiting_stock→delivery_reschedule_proposed→waiting_stock` | Dealer propose; Buyer accept | đổi delivery_time |
| Buyer Order | `delivery_reschedule_proposed→cancelled` | Buyer reject | cancel/restore; item waiting chưa gắn batch nên bỏ qua |
| Buyer Order | cancellable→`cancelled` | Buyer: pending/reschedule; Dealer/Admin: pending/confirmed/processing/waiting/reschedule | hoàn batch, payment pending→cancelled |
| Buyer Order | `completed→return_requested→completed` | Buyer request; Dealer reject | Return rejected |
| Buyer Order | `completed→return_requested→returned` | Dealer approve | hoàn kho, COD paid→refunded, giảm customer total_spent |
| Buyer Order enum | `delivered,cancel_requested,delivery_failed,return_approved,return_rejected` | **KHÔNG TÌM THẤY TRONG SOURCE CODE** service gán | enum dư so với flow hiện hành |
| InventoryReservation | mọi trạng thái | **KHÔNG TÌM THẤY TRONG SOURCE CODE** model/table/state machine | Giữ hàng hiện là trừ trực tiếp `DealerInventoryBatch.remaining_quantity` và FK `OrderItem.batch` |
| InventoryBatch | create/import→`active` | hoàn tất PO / MAIN batch | quantity + remaining; ledger IMPORT |
| InventoryBatch | `active→depleted` | sale/wastage làm remaining=0 | ledger tương ứng |
| InventoryBatch | `depleted→active` | cancel/return restore hoặc import mới | cộng remaining |
| InventoryBatch | `active→expired` | mark expired hoặc sửa expiry quá khứ | bulk update hoặc sync |
| InventoryBatch | `expired→active` | expiry sửa lại hợp lệ/import mới và còn hàng | — |
| InventoryBatch | `*→cancelled` | **KHÔNG TÌM THẤY TRONG SOURCE CODE** runtime assignment | enum tồn tại nhưng không có action |

Source: `backend/apps/orders/services.py`, `preorder_services.py`, `waiting_stock_services.py`, `delivery_reschedule_services.py`; `backend/apps/dealer_products/canonical_inventory.py`, `inventory_expiry.py`.

### 4.4 Return, Preorder, Notification

| Aggregate | From → To | Actor / action | Ghi chú |
|---|---|---|---|
| Buyer `OrderReturn` | create `requested`→`approved|rejected` | Buyer request; Dealer/Admin review | một request pending; buyer flow trả toàn đơn |
| PO `PurchaseOrderReturn` | create `requested`→`approved|rejected` | Dealer request; Supplier review | hỗ trợ partial và nhiều lần, nhưng chỉ một pending |
| PreOrderRequest | ∅→`submitted` | Buyer create | chỉ khi requested > available, không reserve |
| PreOrderRequest | `submitted→converted` | Dealer confirm nguyên điều kiện | tạo Order waiting_stock |
| PreOrderRequest | `submitted→customer_confirmation_pending` | Dealer propose | quantity/date mới |
| PreOrderRequest | `customer_confirmation_pending→converted` | Buyer accept | tạo Order waiting_stock |
| PreOrderRequest | `submitted→rejected_by_dealer` | Dealer reject | reason |
| PreOrderRequest | `customer_confirmation_pending→rejected_by_customer` | Buyer reject | reason/default |
| PreOrderRequest | `*→cancelled` | **KHÔNG TÌM THẤY TRONG SOURCE CODE** action/service gán | enum dư |
| Notification | create → receipt unread (`read_at=null`) | domain service `notify_account/notify_admins` | push websocket sau create |
| NotificationReceipt | unread→read | `mark_read` hoặc `mark_all_read` | update `read_at=now`; không có unread transition |
| Notification | update/delete | Admin CRUD | receipt cascade khi notification delete |

## 5. Transaction/lock integrity

| Khu vực | Atomic / lock hiện có | Khoảng trống / rủi ro |
|---|---|---|
| Create buyer order | `@transaction.atomic`; sellable batch query `select_for_update`; trừ tồn + order + payment cùng transaction | `generate_order_code()` dùng `count()+1` ngoài unique retry/sequence: concurrent create có thể collision |
| Restore inventory | caller atomic; `_restore_batch_quantity` lock batch | tốt cho cancel/return; nhưng order itself không `select_for_update`, hai action trạng thái đồng thời có thể cùng vượt guard |
| PO create | nested `@transaction.atomic`; split multi-supplier nằm trong một transaction | `generate_order_code()` cùng race `count()+1` |
| Supplier PO confirm | atomic; `order.items.select_for_update()` | PO header/payment không lock; hai confirm/verify request đồng thời có race |
| Payment submit/verify | atomic | check `.exists()` rồi create không có unique pending payment hoặc transaction code; race tạo duplicate; verify không lock payment |
| PO complete/import | cùng transaction của verify; MAIN batch `select_for_update` nếu đã tồn tại | get-then-create MAIN không bắt `IntegrityError`; concurrent first import có thể vi phạm unique |
| Waiting-stock allocation | atomic; batch lấy qua `_active_batches_qs(...for_update=True)` | query `OrderItem` chờ không lock; hai allocator có thể xử lý cùng item trước khi refresh |
| Wastage | `dealer_products/services.py` atomic; canonical/inventory query lock | cần dựa DB constraint nhưng `remaining_quantity<=quantity` không có CheckConstraint |
| Preorder | create/propose/convert atomic | preorder header không lock; concurrent accept có thể cả hai thấy `converted_order_id` null |
| RFM save | `transaction.atomic`; delete memberships + bulk_create + history | hai pipeline cùng dealer không lock/advisory lock; last commit wins, history vẫn có cả hai |
| Interaction counters | service dùng update/create/F-expression tại các luồng | unique pair giúp chống duplicate row, nhưng cần kiểm chứng xử lý IntegrityError cho first concurrent insert |
| Notification | create Notification rồi Receipt(s), không thấy decorator atomic tại helper | lỗi bulk receipt/push có thể để notification mồ côi; websocket/email nằm trong request transaction, không dùng `transaction.on_commit` |
| Returns | request/review atomic | không lock order/return; concurrent review/request có thể double apply refund/restore |
| DB constraints | unique email/ownership/catalog/payment provider transaction, batch number | thiếu CheckConstraint cho số lượng tồn, amount, `quantity_after=before+change`; PO payment thiếu unique provider+transaction |

## 6. Permission và multi-tenant

| Tài nguyên | Permission lớp | Tenant filter/object check | Nhận xét |
|---|---|---|---|
| AccountDocument | Admin/Supplier/Dealer theo action | account=current user; Admin all | `IsAdminOrSupplier` có tên gây hiểu nhầm và thực tế gồm Dealer (`common/permission.py:26-37`) |
| Supplier | role/action | Supplier own; Dealer chỉ approved+active | products/categories có object scope qua supplier queryset |
| Dealer | role/action | Dealer account own; catalog chỉ active | categories/products cho mọi active account, phù hợp catalog nội bộ |
| SupplierProduct/images/cultivation/discount | active + role | supplier account owner; Dealer catalog filtered approved/active | phải giữ object checks ở serializer `validate_*` khi create FK |
| DealerProduct/images/inventory/policy | role | dealer account owner; Admin all | inventory readonly nhưng mutation qua action có `_ensure_batch_owner` |
| PurchaseOrder | action role | queryset supplier/dealer tenant; action kiểm tra account_id | `get_permissions()` default `IsAdminOrSupplier` **bao gồm Dealer**, tên không phản ánh thực tế |
| Buyer Order management | Admin/Dealer | `filter_customer_orders` theo dealer | tốt; action check lại ownership |
| Storefront buyer | `IsStorefrontCustomer` | token account có `store_dealer`; URL slug phải khớp trong permission/query helper | mobile/web dùng cùng API |
| Voucher buyer | `IsBuyer` | dealer lấy từ `request.user.store_dealer`, bỏ qua `dealer_slug` query của mobile | buyer không thể dùng voucher dealer khác nếu token đúng |
| CustomerSegment | Admin/Dealer | segment global, không tenant | thiết kế có chủ ý; custom segment cũng global vì model không có dealer FK |
| CustomerSegmentMember | không có CRUD public | profile trả memberships | AI xóa theo customer IDs + system segment IDs |
| Segmentation API | Admin/Dealer | Dealer buộc `dealer_id == dealer_profile.id` | Admin có thể chạy mọi integer dealer_id |
| Dashboard | chỉ `IsAuthenticated` | runtime profile/role check, query scoped | nên dùng role permission thống nhất; hiện trả 403 thủ công |
| Statistical | chỉ `IsAuthenticated` | runtime dealer profile | như trên |
| Notification feed | authenticated mặc định DRF (không khai báo explicit trên action) | receipt account=current user | phụ thuộc global `DEFAULT_PERMISSION_CLASSES`; CRUD explicit Admin |
| AI dealer train/analyze/recommend | authenticated | cần xem từng view/service; không phải tất cả đoạn đều thể hiện object ownership ở decorator | rủi ro IDOR nếu chỉ nhận `dealer_id`; ưu tiên test |
| Mobile | buyer token + dealer slug | provider luôn truyền slug cho storefront resources | base URL production hard-code; không có flavor/env injection trong constant |

## 7. FE/BE incompleteness, mismatch và risk register

| ID | Mức | FE/BE/mobile | Phát hiện kiểm chứng | Source |
|---|---|---|---|---|
| R-01 | Critical | BE concurrency | Order/PO code dùng `count()+1`; race tạo trùng unique code. | `orders/services.py:71-76`; `purchase_orders/services.py:163-171` |
| R-02 | Critical | BE inventory | Không có `InventoryReservation`; checkout trừ tồn ngay. Cart/check-stock không reserve nên kết quả có thể lỗi lúc create; preorder cũng không reserve. | **KHÔNG TÌM THẤY TRONG SOURCE CODE** model; `orders/services.py`, `preorder_services.py` |
| R-03 | High | BE state | Nhiều enum không có transition runtime: PO `deposit_paid/return_approved/return_rejected`; Order `delivered/cancel_requested/delivery_failed/return_approved/return_rejected`; batch cancelled; preorder cancelled. | model/service đối chiếu §4 |
| R-04 | High | BE analytics | Statistical “profit” không phải realized margin/COGS và so sánh hai tập đơn theo thời điểm tạo, dễ sai quyết định. | `backend/apps/statistical/views.py` |
| R-05 | High | BE AI | Segmentation tính cả đơn chưa thành công và conversion 0–1, trong khi snapshot khác chỉ completed và 0–100. | hai file metric §1 |
| R-06 | High | BE multi-tenant | `CustomerSegment` global và custom segment không có dealer FK; Admin-created custom visible mọi Dealer. Nếu yêu cầu segment riêng dealer thì model thiếu tenant. | `marketing/models.py`, `marketing/views.py` |
| R-07 | High | FE endpoint | `userService` gọi `/users/` và `/users/{id}/verify/`; backend không đăng ký route. | `frontend/web-site/src/services/api/userService.js`; **KHÔNG TÌM THẤY TRONG SOURCE CODE** URL |
| R-08 | High | FE endpoint | Admin season service gọi CRUD `/seasons/`; backend không có app/URL/model season. | `frontend/web-site/src/services/api/Admin/seasonService.js`; **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| R-09 | High | FE endpoint | Supplier export gọi `/supplier/order-stats/export`; backend không có route. | `frontend/web-site/src/services/api/Supplier/orderStatsService.js`; **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| R-10 | High | FE endpoint | AI service gọi `GET /product-prediction-results/`; `training_models/urls.py` không đăng ký route này dù model/serializer tồn tại. | `frontend/web-site/src/services/api/aiPredictionService.js`; `backend/apps/training_models/urls.py` |
| R-11 | High | BE payment | PO payment không unique provider/transaction code và không unique “một pending mỗi type”; check-then-create có race. | `purchase_orders/models.py`, `services.py:671-715` |
| R-12 | High | BE transaction | Notification helper không atomic/on_commit; có thể push sự kiện trước khi domain transaction commit hoặc để bản ghi mồ côi khi receipt lỗi. | `backend/common/notifications.py` |
| R-13 | High | BE security | Dashboard/statistical chỉ `IsAuthenticated` rồi check runtime; AI dealer endpoints cần test ownership `dealer_id` xuyên suốt. | dashboard/statistical/training views |
| R-14 | Medium | FE admin | Admin Dashboard không dùng `/dashboard/admin/*`; metric doanh thu/top API không xuất hiện ở trang dashboard hiện tại. | `frontend/web-site/src/pages/Admin/Dashboard.jsx`; admin dashboard service |
| R-15 | Medium | FE supplier | Supplier Dashboard không gọi `/dashboard/supplier/summary/`, tự tải toàn bộ PO rồi lọc/count tại client; pagination có thể làm count sai nếu `getAll()` không fetch toàn bộ. | `frontend/web-site/src/pages/Supplier/DashBoard.jsx`; `orderService.js` |
| R-16 | Medium | FE supplier | Có fallback mock 6 tháng; khi API trả mảng rỗng UI hiển thị số giả `8.2…12.4tr`, không phải empty state. | `Supplier/DashBoard.jsx:65-96,325-327` |
| R-17 | Medium | FE supplier | Label “Doanh thu tháng 6” hard-code; không theo tháng hiện tại/response. | `Supplier/DashBoard.jsx:609-611` |
| R-18 | Medium | FE analytics | Dealer Stats chart tự đặt chiều cao tối thiểu 4px kể cả giá trị 0, tạo cột dương giả; không có trục/tick định lượng. | `frontend/web-site/src/pages/Dealer/Stats.jsx:307-318` |
| R-19 | Medium | FE analytics | Export CSV nối chuỗi không escape comma/quote/newline; label/category có thể làm hỏng CSV. | `Dealer/Stats.jsx:63-80` |
| R-20 | Medium | FE/BE | Admin dashboard service URL thiếu trailing slash; Django `APPEND_SLASH` thường redirect GET nên vẫn chạy, nhưng không nhất quán và dễ lỗi proxy/CORS. | `frontend/web-site/src/services/api/Admin/adminDashboardService.js` |
| R-21 | Medium | Mobile | Base API production hard-code, không thấy env/flavor override; dev/staging khó tách và có rủi ro test vào production. | `frontend/mobile/lib/core/constants/api_constants.dart` |
| R-22 | Medium | Mobile | Mobile không có analytics/reporting/RFM/segment visualization. | **KHÔNG TÌM THẤY TRONG SOURCE CODE** trong `frontend/mobile/lib` |
| R-23 | Medium | FE buyer | Repository còn `src/mocks/userOrderMockData.js`, `dealerProductMockData.js`, `components/User/Order/mockData.js`; một số component import formatter/status steps từ mock modules, tạo coupling production–mock. | các path nêu trên |
| R-24 | Medium | BE model | `CustomerSegmentationHistory.dealer_id`, AI prediction dealer/product IDs và notification polymorphic references không có FK; orphan/stale reference không được DB bảo vệ. | model table §3 |
| R-25 | Medium | BE integrity | Inventory quantity/ledger không có CheckConstraint; application có thể lưu âm/sai invariant nếu code path khác bypass service. | `dealer_products/models.py` |
| R-26 | Medium | BE performance | Dealer top products chạy thêm một `Sum(stock)` cho từng top item (N+1 aggregation). | `dashboard/views.py:261-277` |
| R-27 | Medium | BE API | `training_models/urls.py` có `path("")`; vì include ở `/api/` sau nhiều URLconf, root API behavior phụ thuộc resolver order và không phải API index tổng hợp. | `backend/config/urls.py`; `backend/apps/training_models/urls.py` |
| R-28 | Medium | BE API | Permission class `IsAdminOrSupplier` thực tế cho cả Dealer; tên/docstring mâu thuẫn, dễ cấp quyền quá rộng khi tái sử dụng. | `backend/common/permission.py:26-38` |
| R-29 | Medium | BE return | Return request/review không khóa order/return row; concurrent requests có thể double restore/refund dù atomic. | `orders/services.py`, `purchase_orders/services.py` |
| R-30 | Low | FE naming | `suppilerService`/`Suppiler.jsx` và `Vertification.jsx` typo; không lỗi runtime nhưng làm search/maintenance khó. | path FE |
| R-31 | Low | BE table naming | `Accounts` dùng chữ hoa, `supplier` số ít, notification dùng tên mặc định; convention table không thống nhất, migration/report SQL dễ sai tên. | model table §3 |
| R-32 | Low | FE/mobile notification | Web/mobile dùng action path DRF mặc định underscore (`mark_read`); cần giữ nguyên khi backend rename/url_path, không có shared contract/generated client. | `notifications/views.py`; `buyer_api_provider.dart:441-443` |

## 8. Chỉ mục source trọng yếu

- URL root: `backend/config/urls.py`; từng module: `backend/apps/*/urls.py`, `backend/common/urls.py`.
- Permission/scope: `backend/common/permission.py`, `backend/common/querysets.py`, `backend/apps/customers/permissions.py`.
- PO state machine: `backend/apps/purchase_orders/models.py`, `services.py`, `views.py`, `serializers.py`.
- Buyer/preorder/return/inventory: `backend/apps/orders/{models,services,preorder_services,waiting_stock_services,delivery_reschedule_services,views,storefront_views,preorder_views}.py`.
- Kho canonical/lock/expiry: `backend/apps/dealer_products/{models,canonical_inventory,inventory_queries,inventory_expiry,services}.py`.
- Analytics: `backend/apps/dashboard/views.py`, `backend/apps/statistical/views.py`.
- RFM/segmentation/conversion: `backend/apps/training_models/services/customer_segmentation.py`, `backend/apps/training_models/views.py`, `backend/apps/marketing/customer_metrics.py`, `backend/apps/marketing/models.py`.
- FE web analytics: `frontend/web-site/src/pages/{Dealer/Dashboard,Dealer/Stats,Supplier/DashBoard,Admin/Dashboard}.jsx` và các service tương ứng.
- Mobile contract: `frontend/mobile/lib/core/constants/api_constants.dart`, `frontend/mobile/lib/data/providers/buyer_api_provider.dart`.
