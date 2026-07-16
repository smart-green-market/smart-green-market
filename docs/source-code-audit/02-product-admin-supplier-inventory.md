# 02 — Audit source code: sản phẩm, quản trị, nhà cung cấp và tồn kho

## 1. Phạm vi và nguyên tắc

- Phạm vi đã đọc trực tiếp: danh mục, Product Master, Supplier Product, ảnh sản phẩm, quy trình canh tác, chứng nhận NCC, liên kết chứng nhận–sản phẩm, chính sách/bậc giảm theo số lượng, trường liên quan tồn kho phía NCC, trang Web Admin/Supplier và Mobile.
- Chuỗi được truy từ UI → service HTTP → URL router → ViewSet/action → serializer/service → model/bảng → notification/error.
- Tài liệu mô tả **source code hiện tại**, không mô tả ý định ngoài code. Chỗ không có triển khai được ghi rõ **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Tiền tố API thực tế là `/api/`, do `backend/config/urls.py` include các app dưới `path("api/", ...)`. Web dùng `axiosClient` với `baseURL = API_BASE_URL`; JWT được interceptor gắn dưới dạng `Authorization: Bearer ...`. Mobile dùng base URL `https://smart-green-market-api.onrender.com/api`.

## 2. Bản đồ thành phần

| Miền | Web route / UI chính | Service FE | Backend router / lớp | Model / bảng |
|---|---|---|---|---|
| Danh mục Admin | `/quan-tri/danh-muc`; `pages/Admin/Category.jsx` | `categoryService` | `/api/categories/`; `CategoryViewSet` | `Category` / `categories` |
| Danh mục Supplier | `/nha-cung-cap/danh-muc`; `pages/Supplier/Category.jsx` | `categoryService` | `/api/categories/`; `CategoryViewSet` | `Category` / `categories` |
| Product Master | `/quan-tri/san-pham-chuan`; `pages/Admin/ProductMaster.jsx` | `productMasterService` | `/api/product-masters/`; `ProductMasterViewSet` | `ProductMaster` / `product_masters` |
| Supplier Product | `/nha-cung-cap/san-pham`; `pages/Supplier/Product.jsx` | `productService` | `/api/supplier-products/`; `SupplierProductViewSet` | `SupplierProduct` / `supplier_products` |
| Duyệt Supplier Product | `/quan-tri/san-pham`; `pages/Admin/Product.jsx` | `productService.verify` | `/api/supplier-products/{id}/verify/`; `SupplierProductViewSet.verify` | `supplier_products`; notification tables |
| Ảnh sản phẩm | Modal tạo/chi tiết sản phẩm NCC | `productService.addImageProduct/updateImageProduct/deleteImageProduct` | `/api/supplier-product-images/`; `SupplierProductImageViewSet` | `SupplierProductImage` / `supplier_product_images`; file `product_images/` |
| Canh tác | `/nha-cung-cap/canh-tac`; `pages/Supplier/Cultivation.jsx`; đồng thời trong `DetailProductModal` | `farmingProcessService` | `/api/cultivation-processes/`; `CultivationProcessViewSet` | `CultivationProcess` / `cultivation_processes` |
| Chứng nhận Supplier | `/nha-cung-cap/chung-nhan`; `pages/Supplier/Vertification.jsx` | `certificationService` | `/api/certifications/`; `CertificationViewSet` | `Certification`, `CertificationImage`, `CertificationAuditLog` |
| Duyệt chứng nhận | `/quan-tri/chung-chi`; `pages/Admin/Certification.jsx` | `certificationService.verify` | `/api/certifications/{id}/verify/`; `CertificationViewSet.verify` | `certifications`, `certification_audit_logs`, notification tables |
| Giảm giá số lượng | `/nha-cung-cap/giam-gia`; `pages/Supplier/Discount.jsx` | `quantityDiscountService` | `/api/quantity-discount-policies/`; `QuantityDiscountPolicyViewSet` | `quantity_discount_policies`, `quantity_discount_tiers` |
| Mobile | Buyer storefront, không có route Admin/Supplier | `BuyerApiProvider` | `/api/storefronts/{slug}/categories/`, `/products/`, `/check-stock/` | dữ liệu catalog/tồn kho **Dealer**, không CRUD miền NCC |

## 3. Model, bảng và ràng buộc

| Model | Bảng | Trường/ràng buộc quan trọng | Quan hệ và hành vi xóa |
|---|---|---|---|
| `Category` | `categories` | `scope: system/custom`; `status`; `sort_order`; `created_by`; `verified_by/at`; `rejection_reason` | Supplier Product và Dealer Product `PROTECT`; Product Master `PROTECT`. API dùng soft-delete `status=deleted`. |
| `ProductMaster` | `product_masters` | `category`, `name`, `slug`, `default_unit`, `description`, `status`, `sort_order`; unique `(category, slug)` | `category=PROTECT`; chỉ được gắn category system active qua serializer. API destroy mặc định là hard delete, nhưng `PROTECT` từ Supplier/Dealer Product có thể chặn. |
| `SupplierProduct` | `supplier_products` | `supplier`, `category`, `product_master?`, `name`, `slug`, `unit`, `wholesale_price?`, `daily_production_capacity?`, thông tin bảo quản, `status`, audit duyệt | unique `(supplier, slug)` và conditional unique `(supplier, product_master)` khi master khác null. API destroy soft-delete. |
| `SupplierProductImage` | `supplier_product_images` | `image_url`, `is_thumbnail`, `sort_order` | FK product `CASCADE`; serializer cố giữ một thumbnail, nhưng DB không có unique constraint. |
| `CultivationProcess` | `cultivation_processes` | `supplier_product`, `step_order`, `process_name`, `description` | unique `(supplier_product, step_order)`; FK product `CASCADE`. |
| `Certification` | `certifications` | metadata cấp/hết hạn; `status`; audit duyệt/thu hồi; `deleted_at` | FK supplier `CASCADE`; revoke vừa đặt `revoked` vừa soft-delete bằng `deleted_at`. |
| `CertificationImage` | `certification_images` | `image_url`, `sort_order` | FK certification `CASCADE`; file dưới `certifications/`. |
| `CertificationAuditLog` | `certification_audit_logs` | `action`, `performed_by`, `note` | Ghi submitted/approved/rejected/revoked/expired. |
| `SupplierProductCertification` | `supplier_product_certifications` | `supplier_product`, `certification`, `created_at` | Hai FK `CASCADE`; **không có unique constraint** cho cặp; chỉ thấy seed dùng `get_or_create`. |
| `QuantityDiscountPolicy` | `quantity_discount_policies` | `supplier`, `title`, `scope`, FK scope, `priority`, `is_active`, `start_at/end_at` | FK supplier/category/product đều `CASCADE`. |
| `QuantityDiscountTier` | `quantity_discount_tiers` | `min_quantity`, `discount_type`, `discount_value`, `sort_order` | FK policy `CASCADE`; chống trùng `min_quantity` chỉ ở serializer, không có DB constraint. |
| `PurchaseOrderItem` | `purchase_order_items` | snapshot `unit_price`, `base_unit_price`, `discount_type/value/min_quantity`, `line_discount_amount` | Chứng minh discount được áp dụng thực sự vào phiếu nhập; không phải chỉ là UI cấu hình. |

## 4. Bảng trạng thái và chuyển trạng thái

### 4.1. Category

| Trạng thái | Nguồn vào | Chuyển tiếp có code | Quyền |
|---|---|---|---|
| `pending` | Supplier/Dealer tạo custom; Admin tạo custom; non-admin sửa category đang `active` | `verify → active/rejected/inactive`; soft-delete → `deleted` | Tạo/sửa: tài khoản active, ownership kiểm ở update/destroy; verify: Admin |
| `active` | Admin tạo `scope=system`; Admin verify; Admin unlock | non-admin sửa → `pending`; lock/verify → `inactive`; verify → `rejected`; delete → `deleted` | như trên |
| `rejected` | Admin verify | Có thể gọi verify lại sang `active/inactive/rejected`; không có action submit lại riêng | Admin verify |
| `inactive` | Admin lock hoặc verify | unlock → `active`; verify có thể đổi tiếp | Admin |
| `deleted` | `soft_delete_category` | Không có restore | Admin hoặc người tạo custom |

### 4.2. Product Master

| Trạng thái | Cách đặt | Chuyển tiếp | Ghi chú |
|---|---|---|---|
| `active` | mặc định khi create; Admin PATCH | PATCH `inactive` | Không có workflow submit/verify/reject. |
| `inactive` | Admin PATCH | PATCH `active` | Non-admin list chỉ thấy master active thuộc category active. |

### 4.3. Supplier Product

| Trạng thái | Cách đặt thực tế | Chuyển tiếp có code | Ghi chú |
|---|---|---|---|
| `pending` | create mặc định | Admin `verify` → `active/rejected/inactive`; delete → `deleted` | Có notification Admin khi create. |
| `active` | Admin verify | Admin verify → `rejected/inactive`; Supplier PATCH metadata nhưng **không tự quay về pending** | Supplier không thể PATCH `status` vì serializer read-only. |
| `rejected` | Admin verify | Admin có thể verify lại; Supplier có thể PATCH metadata nhưng status vẫn `rejected` | Endpoint/action `submit` hoặc `resubmit`: **KHÔNG TÌM THẤY TRONG SOURCE CODE**. |
| `inactive` | Admin verify | Admin verify lại | Các FE method `lockSelling/unlockSelling` gửi PATCH `status`, nhưng backend bỏ field read-only; xem mục mismatch. |
| `deleted` | `soft_delete_supplier_product` | Không có restore | Chặn nếu còn PO không terminal hoặc Dealer Product chưa deleted. |

### 4.4. Certification

| Trạng thái | Nguồn/chuyển tiếp | Side effect |
|---|---|---|
| `pending` | create mặc định | audit `submitted`; notify Admin |
| `approved` | Admin verify | audit `approved`; notify Supplier |
| `rejected` | Admin verify, bắt buộc reason | audit `rejected`; notify Supplier |
| `expired` | `mark_expired_certifications` khi gọi API list/retrieve queryset và ngày hết hạn đã qua | audit `expired`; **không thấy notification hết hạn** |
| `revoked` | Admin action `revoke` | audit; notify Supplier; đồng thời `deleted_at=now`, nên biến mất khỏi queryset chuẩn |

## 5. API và quyền trong phạm vi

| Endpoint / method | Action | Serializer chính | Quyền/query ownership | Lỗi/ràng buộc nổi bật |
|---|---|---|---|---|
| `GET /api/categories/` | list | `CategoryListSerializer` | `IsActive`; Admin tất cả; Supplier/Dealer system active + custom của mình; Buyer system active | Supplier/Dealer mặc định chỉ status active; `status=` mới xem pending/rejected/inactive |
| `POST /api/categories/` | create | `CategorySerializer` | `IsActive` | Giới hạn `max_categories_per_supplier`; Supplier/Dealer luôn custom/pending |
| `PUT/PATCH /api/categories/{id}/` | update | `CategorySerializer` | ownership trong `_ensure_can_edit` | non-admin sửa active → pending và notify Admin |
| `POST /api/categories/{id}/verify/` | verify | request `VerifyCategorySerializer`; response list serializer | `IsAdmin` | reason bắt buộc cho rejected/inactive |
| `POST .../{id}/lock|unlock/` | lock/unlock | list serializer | `IsAdmin` | unlock chỉ nhận category inactive |
| `DELETE /api/categories/{id}/` | soft delete | — | `_ensure_can_edit` | 409/business error nếu còn Supplier Product, Dealer Product hoặc Product Master active |
| `GET /api/product-masters/` | list | `ProductMasterListSerializer` | `IsActive`; non-admin chỉ active/category active | `category_id` phải integer >=1 |
| `POST/PUT/PATCH/DELETE /api/product-masters/...` | CRUD | `ProductMasterWriteSerializer` | `IsAdmin` | category phải system active; slug tự sinh unique; delete là ModelViewSet destroy mặc định |
| `GET /api/supplier-products/` | list | `SupplierProductListSerializer` | Admin tất cả; Supplier chỉ mình; Dealer chỉ active từ NCC approved/account active/có giá | search/status/supplier_id; Supplier/Admin có demand annotations |
| `POST /api/supplier-products/` | create | `SupplierProductSerializer` | `IsSupplier + IsActive` | Supplier profile phải approved; category assignable; giới hạn max product; catalog rules |
| `PATCH /api/supplier-products/{id}/` | update | `SupplierProductSerializer` | `IsSupplier + IsActive`; queryset ownership chặn sản phẩm khác | status/audit read-only; không có reset pending |
| `POST /api/supplier-products/{id}/verify/` | verify | `VerifySupplierProductSerializer` | `IsAdmin` | active/rejected/inactive; reason bắt buộc cho rejected/inactive |
| `DELETE /api/supplier-products/{id}/` | soft delete | — | `IsActive + IsAdminOrSupplierProfile`; queryset ownership | chặn active PO và Dealer Product |
| CRUD `/api/supplier-product-images/` | ảnh | bulk serializer khi create; image serializer còn lại | `IsActive`; queryset Admin hoặc owner Supplier | file hợp lệ, tối đa config; owner check; không atomic bulk |
| CRUD `/api/cultivation-processes/` | bước canh tác | `CultivationProcessSerializer` | `IsActive`; queryset Admin hoặc owner Supplier | owner check khi chọn product; duplicate step do DB unique |
| CRUD `/api/certifications/` | chứng nhận | create/metadata/list serializer theo action | `IsActive`; queryset Admin hoặc owner Supplier | create bắt buộc ảnh; expiry > issue; update không reset pending |
| `POST /api/certifications/{id}/verify/` | duyệt | `VerifyCertificationSerializer` | `IsAdmin` | reject cần reason |
| `POST /api/certifications/{id}/revoke/` | thu hồi | `RevokeCertificationSerializer` | `IsAdmin` | reason bắt buộc; UI Admin hiện không gọi |
| `GET .../{id}/audit-history/` | audit | `CertificationAuditLogSerializer` | `IsAdmin` | UI Web hiện không gọi |
| CRUD `/api/certification-images/` | ảnh scan | bulk/image serializer | `IsActive`; Admin hoặc owner Supplier | giới hạn config; owner check |
| CRUD `/api/quantity-discount-policies/` | policy + nested tiers | list/detail/write | base `IsAdminOrSupplier`; write kết hợp thêm `IsSupplier`, nên chỉ Supplier | ít nhất 1 tier; scope/FK/owner/time validation |

## 6. Chuỗi UI → DB chi tiết

### 6.1. Admin tạo/cập nhật/khóa Product Master

| Bước | UI/path | Class/hàm | HTTP/endpoint | Backend call | Model/bảng & trạng thái | Quyền | Notification / error |
|---|---|---|---|---|---|---|---|
| 1 | `/quan-tri/san-pham-chuan` | `ProductMasterPage`; `handleCreate`, `handleUpdate`, `handleToggleStatus` | — | — | form category/name/unit/description/sort/status | `AdminProtectedRoute` ở Web | FE toast/error |
| 2 | service | `buildProductMasterPayload`; `productMasterService.create/update` | POST `/product-masters/`; PATCH `/product-masters/{id}/` | JWT qua `axiosClient` | FE còn gửi `season_ids` | — | FE `handleApiError` ưu tiên `data.message`, dễ bỏ qua DRF field error |
| 3 | URL | `product_catalog/urls.py` | `/api/product-masters/` | `ProductMasterViewSet` | — | write → `IsAdmin` | 403 nếu không phải Admin |
| 4 | validate | `ProductMasterWriteSerializer.validate_category` → `ensure_system_category` | — | kiểm scope system + category active | `categories` | — | `"Product Master chỉ gắn danh mục hệ thống"` / `"Danh mục hệ thống chưa active"` |
| 5 | save | serializer `create/update` → `generate_unique_master_slug` → ORM | — | create/update | `product_masters`; active/inactive | — | DB unique `(category,slug)` được chủ động tránh bằng suffix |
| 6 | response | `_response_with_detail` | 201/200 | query lại `select_related(category)` | dữ liệu list serializer | — | Notification: **KHÔNG TÌM THẤY TRONG SOURCE CODE** |

Delete gọi `DELETE /api/product-masters/{id}/`, đi theo destroy mặc định của `ModelViewSet`; không có soft-delete service và không có notification/audit log.

### 6.2. Supplier tạo Supplier Product — catalog system và custom

| Bước | UI/path | Class/hàm | HTTP/endpoint | Backend call | Model/bảng & trạng thái | Quyền | Notification / error |
|---|---|---|---|---|---|---|---|
| 1 | `/nha-cung-cap/san-pham` | `ProductSupplierPage` mở `CreateProductModal` mode `catalog` hoặc `personal` | — | — | — | `SupplierProtectedRoute` | — |
| 2 | nạp category/master | `useProductModalData` → `categoryService.getsupplierCategories`, `productMasterService.getByCategory_id`, `productService.getAll` | GET `/categories/`, `/product-masters/?category_id=`, `/supplier-products/` | các list ViewSet | lọc master đã được NCC link ở FE | account active; query ownership | fetch lỗi thường đổi thành list rỗng |
| 3 | dựng payload | `CreateProductModal.handleSubmit` | — | — | system: `category+product_master`; custom: `category+name(+product_master?)`; giá, capacity, bảo quản | — | FE bắt giá và capacity >0; backend cho phép null |
| 4 | tạo product | `productService.addProduct` | POST `/supplier-products/` JSON | `SupplierProductViewSet` → `SupplierProductSerializer` | — | `IsSupplier + IsActive` | DRF validation |
| 5 | validate catalog | `validate`, `validate_category` → `category_assignable_by_user` → `apply_supplier_product_catalog_rules` | — | kiểm supplier approved, category active/owned | system bắt master đúng category/active và lấy `name/default_unit`; custom bắt name/unit | owner theo `request.user.supplier_profile` | duplicate master/listing; category invalid; max product |
| 6 | save | `SupplierProductSerializer.create` | — | ORM create | `supplier_products`, status `pending`, slug unique theo supplier | — | — |
| 7 | notify | `SupplierProductViewSet.perform_create` → `notify_admins` | — | tạo notification + receipts, WebSocket, email async | notification/receipt tables | tất cả Admin | Không bọc transaction với product |
| 8 | upload ảnh | FE `Promise.all`, mỗi ảnh gọi `productService.addImageProduct` | nhiều POST `/supplier-product-images/`, mỗi request có đúng một `images` | `SupplierProductImageViewSet.create` → bulk serializer | mỗi request insert `supplier_product_images`; file storage | owner Supplier/Admin | Một ảnh lỗi không rollback product hoặc ảnh đã thành công |
| 9 | UI hoàn tất | `appToast.success`, refresh | — | — | product vẫn pending | — | Toast nói chờ Admin duyệt |

Không có một API submit độc lập: hành vi “submit” chính là create. Với product rejected đã sửa, action resubmit và notification gửi lại Admin: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### 6.3. Supplier cập nhật Supplier Product

| Bước | UI/path | Class/hàm | HTTP/endpoint | Backend call | Model/bảng & trạng thái | Quyền | Notification / error |
|---|---|---|---|---|---|---|---|
| 1 | modal chi tiết | `DetailProductModal.executeSave` → `buildUpdatePayload` | — | — | name/category/price/capacity/bảo quản | Supplier route | FE validate |
| 2 | service | `productService.updateProduct` | PATCH `/supplier-products/{id}/` | `SupplierProductViewSet.partial_update` | — | `IsSupplier + IsActive`; owned queryset | lỗi parse bởi `parseSupplierApiErrors` |
| 3 | validate/save | `SupplierProductSerializer.validate` → catalog rules → `ModelSerializer.update` | — | cập nhật ORM | `supplier_products`; **giữ nguyên status hiện tại** | owner | notification Admin: **KHÔNG TÌM THẤY** |
| 4 | UI merge | FE trộn response với local `product`, local ghi đè response | — | — | có thể che dữ liệu canonical backend trong UI đến lần fetch sau | — | comment FE chủ động “tránh API trả dữ liệu cũ” |

Đối với category system, backend luôn lấy lại `name`/`unit` từ Product Master; FE vẫn gửi `name` và local merge có thể tạm hiển thị tên FE khác tên backend.

### 6.4. Admin duyệt/từ chối/tạm ngưng Supplier Product

| Bước | UI/path | Class/hàm | HTTP/endpoint | Backend call | Model/bảng & trạng thái | Quyền | Notification / error |
|---|---|---|---|---|---|---|---|
| 1 | `/quan-tri/san-pham` | `ProductPage.handleApprove/handleReject/handlePause` | — | — | active/rejected/inactive | Admin route | modal error |
| 2 | service | `productService.verify` dựng `FormData` | POST `/supplier-products/{id}/verify/` | router action `verify` | — | `IsAdmin` | FE comment sai ghi `approved/rejected`; code thực gửi `active/rejected/inactive` |
| 3 | validate | `VerifySupplierProductSerializer` + `require_rejection_reason` | — | status choice | — | — | rejected/inactive bắt buộc reason |
| 4 | save | `SupplierProductViewSet.verify` | — | set status, reason, `verified_by`, `verified_at`; `save()` | `supplier_products` | — | Không giới hạn trạng thái nguồn |
| 5 | notify | `notify_account` | — | notification + receipt + WebSocket + email | notification tables | Supplier owner | type success nếu active, error cho mọi trạng thái khác |
| 6 | response | `SupplierProductListSerializer` | 200 | gồm supplier/category/images/discount tiers | — | — | Không transaction giữa save và notification |

### 6.5. Ảnh sản phẩm

| Bước | UI/service | Endpoint | Backend hàm | Ghi DB/file | Ownership | Lỗi và tính nhất quán |
|---|---|---|---|---|---|---|
| List/detail | product response hoặc GET image endpoint | GET `/supplier-product-images/` | `get_queryset` → `filter_admin_or_supplier_account` | đọc `supplier_product_images` | Admin tất cả; Supplier owner; Dealer nhận none dù OpenAPI nói Supplier/Dealer | Documentation lệch code |
| Bulk create | `addImageProduct(FormData)` | POST `/supplier-product-images/` | `SupplierProductImageBulkUploadSerializer.validate/create` | insert từng ảnh + file | `_ensure_product_image_permission` | file bắt buộc, validate type/size, max config |
| Replace/update | `updateImageProduct` | PATCH `/supplier-product-images/{id}/` | `SupplierProductImageSerializer.update` | xóa file cũ trước rồi save file mới | queryset + field validator | Nếu DB save lỗi sau khi xóa file cũ có thể mất file |
| Thumbnail | `is_thumbnail` | cùng endpoint | bulk/create/update update các row khác `False` | nhiều UPDATE/INSERT | owner | Không transaction, không DB unique; race có thể sinh nhiều thumbnail |
| Delete | `deleteImageProduct` | DELETE `/supplier-product-images/{id}/` | destroy mặc định | xóa row; Django FileField không đảm bảo tự xóa file vật lý khi model delete | owner | FE bỏ qua 404 |

### 6.6. Quy trình canh tác

| Bước | UI/path | Hàm | Endpoint | Backend | DB/quyền | Error/notification |
|---|---|---|---|---|---|---|
| 1 | `/nha-cung-cap/canh-tac` hoặc `DetailProductModal` | `CultivationSupplierPage.fetchData`; `CreateCultivationModal.fetchProducts` | GET `/cultivation-processes/`, GET `/supplier-products/` | `CultivationProcessViewSet.get_queryset` | Supplier chỉ row thuộc account; Admin tất cả | list error chỉ log ở page |
| 2 | create | `CreateCultivationModal.handleSubmit` → `farmingProcessService.create` | POST `/cultivation-processes/` | `CultivationProcessSerializer.validate_supplier_product` | insert `cultivation_processes`; owner product | FE parse field errors; duplicate step trả lỗi DB/serializer framework |
| 3 | update | `EditCultivationModal.handleSubmit` | PATCH `/cultivation-processes/{id}/` | serializer update | owner qua queryset và product validator | — |
| 4 | delete | `CultivationSupplierPage.handleDelete` | DELETE `/cultivation-processes/{id}/` | destroy mặc định | owner qua queryset | alert chung |

Không có trạng thái duyệt, submit, verify, rejection, audit log hoặc notification cho cultivation: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### 6.7. Supplier tạo chứng nhận và Admin duyệt

| Bước | UI/path | Hàm | Endpoint | Backend | DB/status | Quyền / notification / error |
|---|---|---|---|---|---|---|
| 1 | `/nha-cung-cap/chung-nhan` | `CertificationSupplierPage` → `AddCertificationModal.handleSubmit` | — | — | — | FE bắt metadata + một file |
| 2 | service | `certificationService.create(FormData)` | POST `/certifications/` multipart | `CertificationViewSet.create` → `CertificationCreateSerializer` | — | `IsActive`; serializer yêu cầu supplier profile |
| 3 | validate/save | `validate/create` | — | expiry > issue; validate ảnh; create certification rồi loop create images | `certifications` pending + `certification_images` | Không atomic: lỗi ảnh giữa loop để lại partial |
| 4 | audit/notify | `perform_create` → `log_certification_action(SUBMITTED)` → `notify_admins` | — | insert audit + notifications/receipts; WebSocket/email | ba nhóm bảng | Không transaction |
| 5 | Admin list | `/quan-tri/chung-chi`; `CertificationPage` | GET `/certifications/` | `get_queryset` gọi `mark_expired_certifications` | approved quá hạn → expired + audit | Admin tất cả |
| 6 | Admin review | `handleApprove/handleReject` → `certificationService.verify` | POST `/certifications/{id}/verify/` | validate, set status/audit fields, audit log | approved/rejected | `IsAdmin`; reject cần reason; notify Supplier |

`SupplierProductCertification` có model và seed helper, nhưng API/serializer/UI để Supplier chọn sản phẩm và tạo/xóa liên kết chứng nhận–sản phẩm: **KHÔNG TÌM THẤY TRONG SOURCE CODE**. Form Supplier có state `product`, fetch danh sách product, nhưng select và `formData.append("product", ...)` đang comment; vì vậy chứng nhận tạo từ UI không liên kết product.

### 6.8. Chính sách và bậc giảm số lượng

| Bước | UI/path | Hàm | Endpoint | Backend | DB/tính giá | Quyền / error |
|---|---|---|---|---|---|---|
| 1 | `/nha-cung-cap/giam-gia` | `SupplierDiscountPage.fetchPolicies`; create/edit/detail modal | GET policy endpoint | `QuantityDiscountPolicyViewSet.list` | đọc policy + tier | Supplier chỉ policy mình |
| 2 | dựng payload | `validateQuantityDiscountForm` → `buildQuantityDiscountPayload` | — | — | scope all/category/product; tiers; FE luôn `start_at/end_at=null` | FE validate dương, unique threshold, percent <=100 |
| 3 | create/update | `quantityDiscountService.create/update` | POST/PATCH `/quantity-discount-policies/` | `QuantityDiscountPolicyWriteSerializer` | create/update policy; `_save_tiers` xóa toàn bộ tier cũ rồi insert lại | write yêu cầu đồng thời `IsAdminOrSupplier` và `IsSupplier`, thực tế chỉ Supplier |
| 4 | validate owner | serializer `validate` | — | category custom phải do supplier tạo; product phải thuộc supplier | policy/tier tables | scope/FK/time/tier errors |
| 5 | áp giá | khi Dealer tạo PO: `create_purchase_order` atomic → `build_order_items` → `compute_wholesale_unit_price` | POST purchase order (ngoài UI scope này) | lọc policy active theo thời gian/supplier, rank product > category > all, rồi priority/id; chọn tier threshold lớn nhất | snapshot vào `purchase_order_items` | policy thay đổi sau đó không đổi snapshot |
| 6 | hiển thị tier | `SupplierProductListSerializer.get_quantity_discount_tiers` | GET Supplier Product | `get_quantity_discount_tiers_for_product` | trả tiers của policy thắng | Dealer thấy trước qua product API |

Create/update policy và `_save_tiers` **không có `transaction.atomic`**. Lỗi giữa thao tác có thể để policy không tier, hoặc update đã xóa tier cũ nhưng chưa tạo đủ tier mới.

## 7. Trường tồn kho phía Supplier

### 7.1. Kết luận

Trong `SupplierProduct` **không có** `stock`, `inventory`, `available_quantity`, batch tồn NCC, nhập/xuất kho NCC hay bảng kho NCC. Trường gần nhất:

| Trường | Ý nghĩa code | Có phải tồn kho? |
|---|---|---|
| `daily_production_capacity` | năng lực sản xuất trung bình mỗi ngày, cùng `unit` | Không. Backend/OpenAPI ghi rõ “không phải tồn kho”. |
| `pending_order_quantity` | annotation tổng lượng PO chờ Supplier xác nhận | Không; demand động từ PO |
| `preparation_quantity` | annotation tổng lượng PO đã xác nhận chưa giao | Không; demand động từ PO |
| `storage_duration_days`, `min_storage_temp`, `max_storage_temp` | điều kiện bảo quản | Không |

Tồn kho có thật nằm phía Dealer: `DealerInventoryBatch.remaining_quantity` được aggregate thành `DealerProduct.available_quantity`; Buyer Web/Mobile đọc `available_quantity/in_stock` qua storefront và `/check-stock/`.

### 7.2. FE Supplier Inventory là dead/mock

`frontend/web-site/src/pages/Supplier/Inventory.jsx` dùng hằng `INITIAL_DATA`, CRUD local state, không gọi API. `InventorySupplierPage` không được export trong `pages/Supplier/index.js` và không có route trong `App.jsx`. Các component `Supplier/Inventory/*` vì vậy là mock/dead UI trong luồng hiện tại. Backend kho Supplier tương ứng: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

## 8. Mobile

Ứng dụng Flutter chỉ triển khai buyer storefront:

| Mobile chain | Endpoint | Dữ liệu |
|---|---|---|
| `HomeController` / `ProductListController` → repository → `BuyerApiProvider.getCategories` | GET `/storefronts/{slug}/categories/` | category cửa hàng Dealer |
| Product list/detail controllers → `BuyerApiProvider.getProducts/getProductById` | GET `/storefronts/{slug}/products/`, `/{id}/` | Dealer Product đã publish, có stock Dealer; có thể lộ metadata Supplier Product do storefront serializer |
| Checkout → `BuyerApiProvider.checkStock` | POST `/storefronts/{slug}/check-stock/` | available quantity của Dealer |

Màn hình/route/provider mobile cho Admin hoặc Supplier quản lý Category, Product Master, Supplier Product, ảnh, cultivation, certification, discount policy hay kho NCC: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

## 9. Hồ sơ hàm quan trọng

| Hàm/lớp | Input | Output/side effect | Điểm cần lưu ý |
|---|---|---|---|
| `CategoryViewSet.perform_update` | serializer/category/request user | save; active do non-admin sửa → pending; notify Admin | Logic reset pending chỉ tồn tại ở Category, không tồn tại ở Supplier Product/Certification. |
| `ensure_system_category` | Category | pass hoặc DRF `ValidationError` | Product Master chỉ nằm trong category system active. |
| `apply_supplier_product_catalog_rules` | user/category/master/name/unit/supplier/instance | dict canonical category/master/name/unit/slug | Là nguồn sự thật của hai luồng catalog; kiểm duplicate master theo Supplier. |
| `SupplierProductSerializer.validate` | payload + request | normalized attrs | Truy cập `request.user.supplier_profile`; supplier chưa approved bị chặn. |
| `SupplierProductViewSet.verify` | Admin request, status/reason | cập nhật duyệt + notify Supplier | Không kiểm transition nguồn; không atomic. |
| `soft_delete_supplier_product` | product/user | status deleted hoặc business conflict | Có `transaction.atomic`; tham số `user` không được dùng để kiểm ownership, ownership nằm ở ViewSet/queryset. |
| `SupplierProductImageBulkUploadSerializer.create` | product/files/thumbnail flag | list ảnh | Loop insert không atomic; sort base có race. |
| `mark_expired_certifications` | không | update từng approved cert quá hạn + audit | Chỉ chạy khi API certification dựng queryset; không scheduler/cron được tìm thấy. |
| `QuantityDiscountPolicyWriteSerializer._save_tiers` | policy + tier list | delete-all rồi recreate sorted | ID tier thay đổi mỗi lần update; không atomic. |
| `_active_policies_for_product` | Supplier Product, thời điểm | ordered matching policies | Rank scope trước priority: product > category > all. |
| `compute_wholesale_unit_price` | product, quantity | `WholesalePriceResult` | Dùng policy đầu tiên có tier phù hợp; fixed không cho giá âm. |
| `build_order_items` | PO + rows | item snapshots + total | Gọi compute discount và lưu snapshot; được gọi bên trong `create_purchase_order @transaction.atomic`. |
| `notify_admins/notify_account` | nội dung/reference/account | Notification, receipt, WebSocket, email async | Không tự atomic; lỗi realtime/email có khả năng xảy ra sau DB writes. |

## 10. Ownership và transaction

### 10.1. Ownership

- Category: update/destroy gọi `user_can_manage_category`; Admin hoặc creator của custom. System chỉ Admin.
- Supplier Product: create/update chỉ Supplier; queryset `filter_admin_or_supplier_account` giới hạn theo `supplier__account`. Destroy thêm role permission. Admin không được create/update metadata vì write permission chỉ Supplier, nhưng được verify/delete.
- Ảnh/cultivation/certification: queryset giới hạn Admin hoặc Supplier owner. Serializer còn kiểm FK đích khi create/update.
- Discount: queryset giới hạn Supplier owner; serializer kiểm custom category/product thuộc Supplier. Dealer branch trong `_filter_policies_for_user` tồn tại nhưng permission `IsAdminOrSupplier` không cho Dealer vào endpoint, nên branch không đạt được.
- `CertificationViewSet` mọi non-admin đều đi `filter_admin_or_supplier_account`; Dealer nhận queryset rỗng. OpenAPI nói “Supplier/Dealer” là sai với implementation.

### 10.2. Transaction

| Luồng | Atomic? | Rủi ro thực tế từ code |
|---|---|---|
| Soft-delete Category/Supplier Product | Có | ràng buộc count + update cùng transaction |
| Create Supplier Product + notify + upload ảnh | Không | product có thể tồn tại nhưng notification/ảnh thiếu |
| Bulk ảnh product/certification | Không | partial rows/files; thumbnail race |
| Create Certification + images + audit + notification | Không | certification/ảnh/audit/notification có thể partial |
| Verify product/category/certification + notification | Không | trạng thái có thể đã đổi dù notification lỗi |
| Create/update discount policy + tiers | Không | policy không tier hoặc tier bị thay partial |
| Tính discount khi tạo Purchase Order | Có ở `create_purchase_order` | snapshot item/total nằm trong transaction PO |

## 11. Mismatch, dead code và TODO

| Mức | Phát hiện có bằng chứng source | Hệ quả |
|---|---|---|
| Cao | `productService.lockSelling/unlockSelling/updateSellingStatus` PATCH `status`, nhưng `SupplierProductSerializer.status` read-only | Supplier UI có thể báo thành công nhưng status DB không đổi; response vẫn status cũ. |
| Cao | Supplier Product update không reset `active/rejected` về `pending`, không notify Admin; không có submit/resubmit action | Nội dung đã duyệt có thể bị Supplier sửa và giữ active; rejected không có đường nộp lại đúng nghĩa. |
| Cao | Chứng nhận update metadata không reset pending; ảnh certification có thể sửa sau duyệt | Approved certification có thể thay metadata/file mà không review lại. |
| Cao | Chứng nhận UI “thu hồi” gọi `DELETE /certifications/{id}/`, trong khi backend revoke/audit/notify nằm ở POST `/{id}/revoke/` | Supplier delete dùng destroy mặc định hard-delete; không tạo revoke audit/notification. Admin UI không expose revoke. |
| Cao | Product/certification/discount nested writes không atomic | Dữ liệu partial khi request lỗi giữa chuỗi. |
| Trung bình | `SupplierProductCertification` không có API/UI; product select trong form chứng nhận bị comment | Chứng nhận không được gắn sản phẩm từ luồng thật; bảng link chủ yếu do seed. |
| Trung bình | Product Master FE gửi/đọc `season_ids` và `seasons`, nhưng model/serializer Product Master hiện không có field mùa vụ | Field gửi bị DRF coi là unknown và có thể trả 400; dữ liệu season FE luôn rỗng nếu API đúng serializer hiện tại. |
| Trung bình | `ProductSupplierPage` gửi filter `category_id` và `category`; `SupplierProductViewSet._apply_supplier_product_list_filters` không xử lý cả hai | Bộ lọc category trên server không có tác dụng. |
| Trung bình | `SupplierDiscountPage` và modal gửi `limit`, backend paginator dùng `page_size` | Kích thước trang mong muốn 10 có thể không được áp dụng. |
| Trung bình | `QuantityDiscountPolicyViewSet` có code Dealer list active nhưng endpoint base permission không cho Dealer | Dead branch; dealer xem tier gián tiếp qua Supplier Product serializer, không list policy trực tiếp. |
| Trung bình | `CertificationStatus.EXPIRED` chỉ cập nhật khi gọi certification API | Không bảo đảm hết hạn đúng thời điểm nếu API lâu không được gọi; notification nhắc trước 30 ngày trong UI chỉ là text, code nhắc lịch: **KHÔNG TÌM THẤY**. |
| Trung bình | `SupplierProductImageViewSet`/`CertificationImageViewSet` OpenAPI nói Dealer thấy của mình; query helper chỉ hỗ trợ Admin/Supplier | Tài liệu API sai; Dealer nhận rỗng. |
| Trung bình | `_ensure_product_image_permission` và `_ensure_certification_image_permission` nhánh role `dealer` nhưng lại tìm `supplier_profile` | Nhánh Dealer không thể sở hữu hợp lệ; dead/misleading. |
| Trung bình | FE certification cho phép PDF; backend dùng `validate_image_upload` và field tên ảnh | PDF có thể bị từ chối tùy allowlist config; UI và backend cần đồng bộ. |
| Thấp | Product table hiển thị `daily_production_capacity` là `kg/tháng`, model/OpenAPI nói năng lực trung bình mỗi ngày và cùng unit sản phẩm | Sai nhãn/đơn vị UI. |
| Thấp | `CreateCertificationModal` còn `apiCreateCertification` mock không được gọi, `PRODUCT_TYPES`, product fetch/state và nhiều TODO/comment tích hợp cũ | Dead code gây nhiễu audit/bảo trì. |
| Thấp | `Supplier/Inventory` toàn mock, không route/export | Không phải chức năng kho NCC thật. |
| Thấp | `handleApiError` ở nhiều service chỉ đọc `response.data.message`, trong khi DRF thường trả `detail` hoặc field map | Thông báo UI có thể rơi về lỗi chung. |
| Thấp | Category Admin helper có thể tạo query `scope=`, nhưng backend category list không parse `scope` | Filter scope nếu được bật sẽ không tác dụng. |

## 12. Những chức năng không tìm thấy

- Draft riêng cho Supplier Product trước khi submit: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Endpoint `submit`/`resubmit` Supplier Product hoặc Certification: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Review lại tự động khi Supplier sửa Product/Certification đã approved: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Kho, batch, stock on-hand, reservation, nhập/xuất kho phía Supplier: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Admin page quản lý cultivation hoặc quantity discount policy: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- UI/API CRUD liên kết `SupplierProductCertification`: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Scheduler/periodic job hết hạn và nhắc chứng nhận trước 30 ngày: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Mobile Admin/Supplier cho toàn bộ phạm vi tài liệu: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Notification cho Product Master, cultivation, discount policy và thao tác ảnh: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
